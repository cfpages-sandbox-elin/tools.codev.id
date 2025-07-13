/**
 * Cloudflare Function to securely proxy scraper API calls.
 * Now supports GMapsExtractor and DataForSEO (with async polling).
 */

// --- Constants & In-Memory Rate Limiter (unchanged) ---
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const RATE_LIMIT_COUNT = 300;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const ipRequestTracker = new Map();

function cleanupRequestTracker() {
    const now = Date.now();
    for (const [ip, record] of ipRequestTracker.entries()) {
        if (now - record.startTime > RATE_LIMIT_WINDOW_MS) {
            ipRequestTracker.delete(ip);
        }
    }
}

// --- Provider Configurations ---
const providerConfigs = {
    gmapsextractor: {
        endpoint: 'https://cloud.gmapsextractor.com/api/v2/search',
        getHeaders: (auth) => ({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.apiKey}`
        }),
        getBody: (params) => ({
            q: params.query, page: params.page,
            hl: params.hl || 'en', gl: params.gl || 'us',
            ll: params.location, extra: true
        })
    },
    dataforseo: {
        taskPostEndpoint: 'https://api.dataforseo.com/v3/serp/google/maps/task_post',
        taskGetEndpoint: 'https://api.dataforseo.com/v3/serp/google/maps/task_get/advanced/',
        getHeaders: (auth) => {
            const credentials = `${auth.login}:${auth.password}`;
            // btoa is available in Cloudflare Workers for Base64 encoding
            const encoded = btoa(credentials);
            return {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${encoded}`
            };
        },
        getBody: (params) => ([{ // DataForSEO expects an array of tasks
            keyword: params.query,
            location_coordinate: params.location.replace('@', ''), // Remove the '@' sign
            language_code: params.hl,
            depth: 100 // Get a good number of results
        }])
    }
};

// --- Helper Functions ---
const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function fetchWithRetry(url, options, retryCount = 0) {
    try {
        const response = await fetch(url, options);
        if ([429, 500, 502, 503, 504].includes(response.status) && retryCount < MAX_RETRIES) {
            await delay(INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount));
            return fetchWithRetry(url, options, retryCount + 1);
        }
        return response;
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            await delay(INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount));
            return fetchWithRetry(url, options, retryCount + 1);
        }
        throw error;
    }
}

// --- Main Request Handler ---
export async function onRequest({ request }) {
    if (request.method !== 'POST') return new Response(`Method Not Allowed`, { status: 405 });
    if (Math.random() < 0.01) cleanupRequestTracker();
    
    // Rate Limiting (unchanged)
    const ip = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
    const now = Date.now();
    const record = ipRequestTracker.get(ip);
    if (!record || now - record.startTime > RATE_LIMIT_WINDOW_MS) ipRequestTracker.set(ip, { count: 1, startTime: now });
    else { record.count++; if (record.count > RATE_LIMIT_COUNT) return jsonResponse({ error: 'Rate limit exceeded.' }, 429); ipRequestTracker.set(ip, record); }

    let requestData;
    try { requestData = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON.' }, 400); }

    const { action, provider, params, ...auth } = requestData;
    if (!action || !provider || !params) return jsonResponse({ error: 'Missing required fields.' }, 400);

    const config = providerConfigs[provider];
    if (!config) return jsonResponse({ error: `Unsupported provider: ${provider}` }, 400);

    try {
        if (provider === 'gmapsextractor') {
            const apiResponse = await fetchWithRetry(config.endpoint, {
                method: 'POST',
                headers: config.getHeaders(auth),
                body: JSON.stringify(config.getBody(params))
            });
            const data = await apiResponse.json();
            return jsonResponse(data, apiResponse.status);
        } 
        else if (provider === 'dataforseo') {
            // Step 1: Post the task
            const postResponse = await fetchWithRetry(config.taskPostEndpoint, {
                method: 'POST',
                headers: config.getHeaders(auth),
                body: JSON.stringify(config.getBody(params))
            });
            const postData = await postResponse.json();
            if (postResponse.status !== 200 || postData.status_code !== 20000) {
                return jsonResponse({ error: `Failed to create task: ${postData.status_message}` }, 400);
            }
            const taskId = postData.tasks[0]?.id;
            if (!taskId) return jsonResponse({ error: 'API did not return a task ID.' }, 500);

            // Step 2: Poll for the results
            const POLLING_INTERVAL_MS = 5000; // 5 seconds
            const MAX_POLLS = 12; // 12 * 5s = 60s timeout

            for (let i = 0; i < MAX_POLLS; i++) {
                await delay(POLLING_INTERVAL_MS);
                const getResponse = await fetchWithRetry(`${config.taskGetEndpoint}${taskId}`, {
                    method: 'GET',
                    headers: config.getHeaders(auth)
                });
                const getData = await getResponse.json();
                
                // Check if task is complete
                if (getResponse.status === 200 && getData.tasks[0]?.status_code === 20000) {
                    return jsonResponse(getData, 200); // Success! Return the final data.
                }
                // Check if task failed permanently
                if (getData.tasks[0]?.status_code !== 20100) { // 20100 = "Task is in queue"
                     return jsonResponse({ error: `Task failed with status: ${getData.tasks[0]?.status_message}` }, 500);
                }
                // Otherwise, continue polling...
            }
            return jsonResponse({ error: 'Task timed out after 60 seconds.' }, 408);
        }

    } catch (error) {
        console.error(`[FATAL] Proxy error for ${provider}: ${error.stack}`);
        return jsonResponse({ error: 'The API proxy encountered a fatal error.' }, 500);
    }
    
    return jsonResponse({ error: `Unknown action/provider combination.` }, 400);
}