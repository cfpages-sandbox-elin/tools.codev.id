/**
 * Cloudflare Function to securely proxy scraper API calls.
 * This function handles CORS, includes a self-contained in-memory rate limiter,
 * and provides an extensible structure for multiple data providers.
 *
 * Endpoint: /scrape-api
 */

// --- Constants ---
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;

// --- In-Memory Rate Limiter ---
const RATE_LIMIT_COUNT = 300; // 300 requests...
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // per 1 minute.
const ipRequestTracker = new Map(); // Stores { count: number, startTime: number } for each IP.

// Periodically clean up old entries to prevent memory leaks.
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipRequestTracker.entries()) {
        if (now - record.startTime > RATE_LIMIT_WINDOW_MS) {
            ipRequestTracker.delete(ip);
        }
    }
}, RATE_LIMIT_WINDOW_MS * 2); // Cleanup every 2 minutes.


// --- Provider Configurations ---
const providerConfigs = {
    gmapsextractor: {
        endpoint: 'https://cloud.gmapsextractor.com/api/v2/search',
        getHeaders: (apiKey) => ({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        }),
        getBody: (params) => {
            const payload = {
                "q": params.query,
                "page": params.page,
                "hl": params.hl || 'id',
                "gl": params.gl || 'id',
                "extra": true
            };
            // Only add the 'll' key if it's provided and not empty
            if (params.ll) {
                payload.ll = params.ll;
            }
            return payload;
        }
    },
};

// --- Helper Functions ---
const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, options, retryCount = 0) {
    try {
        const response = await fetch(url, options);
        if ([429, 500, 502, 503, 504].includes(response.status) && retryCount < MAX_RETRIES) {
            const delayTime = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
            console.warn(`Request to ${url} failed with status ${response.status}. Retrying in ${delayTime}ms...`);
            await delay(delayTime);
            return fetchWithRetry(url, options, retryCount + 1);
        }
        return response;
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            const delayTime = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
            console.warn(`Request to ${url} failed with network error: ${error.message}. Retrying...`);
            await delay(delayTime);
            return fetchWithRetry(url, options, retryCount + 1);
        }
        throw error;
    }
}

// --- Main Request Handler ---
export async function onRequest({ request }) {
    if (request.method !== 'POST') {
        return new Response(`Method Not Allowed`, { status: 405 });
    }

    // --- In-Memory Rate Limiting Logic ---
    const ip = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
    const now = Date.now();
    const record = ipRequestTracker.get(ip);

    if (!record || now - record.startTime > RATE_LIMIT_WINDOW_MS) {
        // If no record or the record has expired, create a new one.
        ipRequestTracker.set(ip, { count: 1, startTime: now });
    } else {
        // If the record is still valid, increment the count.
        record.count++;
        if (record.count > RATE_LIMIT_COUNT) {
            return jsonResponse({ success: false, error: 'Rate limit exceeded. Please try again in a minute.' }, 429);
        }
        ipRequestTracker.set(ip, record);
    }
    // --- End of Rate Limiting Logic ---

    let requestData;
    try {
        requestData = await request.json();
    } catch (error) {
        return jsonResponse({ success: false, error: 'Invalid JSON in request body.' }, 400);
    }

    const { action, provider, apiKey, params } = requestData;

    if (!action || !provider || !apiKey || !params) {
        return jsonResponse({ success: false, error: 'Missing required fields: action, provider, apiKey, or params.' }, 400);
    }

    const config = providerConfigs[provider];
    if (!config) {
        return jsonResponse({ success: false, error: `Unsupported provider: ${provider}` }, 400);
    }

    if (action === 'search') {
        if (!params.query || !params.page) {
             return jsonResponse({ success: false, error: 'Missing query or page in params.' }, 400);
        }

        console.log(`Proxying search request for provider: ${provider}, page: ${params.page}`);

        try {
            const apiResponse = await fetchWithRetry(config.endpoint, {
                method: 'POST',
                headers: config.getHeaders(apiKey),
                body: JSON.stringify(config.getBody(params))
            });

            const responseData = await apiResponse.json();

            if (!apiResponse.ok) {
                 console.error(`External API Error (${apiResponse.status}) for ${provider}:`, responseData.message || JSON.stringify(responseData));
                 return jsonResponse(responseData, apiResponse.status);
            }
            
            return jsonResponse(responseData, 200);

        } catch (error) {
            console.error(`Proxy function error for ${provider}: ${error.message}`);
            // This is a more generic error for when the fetch itself fails after retries
            return jsonResponse({ success: false, error: `The API has encountered an unknown error. Please check the function logs.` }, 500);
        }
    }

    return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400);
}