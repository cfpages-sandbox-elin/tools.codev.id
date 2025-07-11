/**
 * Cloudflare Function to securely proxy scraper API calls.
 * VERSION WITH ENHANCED LOGGING FOR DEBUGGING.
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

// --- Provider Configurations (unchanged) ---
const providerConfigs = {
    gmapsextractor: {
        endpoint: 'https://cloud.gmapsextractor.com/api/v2/search',
        getHeaders: (apiKey) => ({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        }),
        getBody: (params) => {
            const payload = {
                "q": params.query, "page": params.page,
                "hl": params.hl || 'en', "gl": params.gl || 'us',
                "extra": true
            };
            if (params.ll) payload.ll = params.ll;
            return payload;
        }
    },
};

// --- Helper Functions (unchanged) ---
const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
};

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
    if (request.method !== 'POST') {
        return new Response(`Method Not Allowed`, { status: 405 });
    }
    
    if (Math.random() < 0.01) {
        cleanupRequestTracker();
    }

    const ip = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
    const now = Date.now();
    const record = ipRequestTracker.get(ip);
    if (!record || now - record.startTime > RATE_LIMIT_WINDOW_MS) {
        ipRequestTracker.set(ip, { count: 1, startTime: now });
    } else {
        record.count++;
        if (record.count > RATE_LIMIT_COUNT) {
            return jsonResponse({ success: false, error: 'Rate limit exceeded.' }, 429);
        }
        ipRequestTracker.set(ip, record);
    }

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
        try {
            // *** NEW LOGGING: Log the details of the outgoing request ***
            const outboundBody = config.getBody(params);
            const outboundHeaders = config.getHeaders(apiKey);

            console.log("--- [DEBUG] Preparing Outbound Request ---");
            console.log("Endpoint:", config.endpoint);
            console.log("Headers:", JSON.stringify({ ...outboundHeaders, Authorization: 'Bearer [REDACTED]' }));
            console.log("Body:", JSON.stringify(outboundBody, null, 2));
            console.log("-----------------------------------------");

            const apiResponse = await fetchWithRetry(config.endpoint, {
                method: 'POST',
                headers: outboundHeaders,
                body: JSON.stringify(outboundBody)
            });

            // Use .clone() so we can read the body twice if needed (for logging)
            const responseClone = apiResponse.clone();
            
            if (!apiResponse.ok) {
                // *** NEW LOGGING: Log the full error response from the external API ***
                const errorData = await responseClone.json().catch(() => responseClone.text()); // Handle non-JSON errors
                console.error(`--- [DEBUG] External API Error ---`);
                console.error(`Status: ${apiResponse.status} ${apiResponse.statusText}`);
                console.error("Full Error Response Body:", JSON.stringify(errorData, null, 2));
                console.error(`--------------------------------`);
                return new Response(JSON.stringify(errorData), { status: apiResponse.status });
            }
            
            const responseData = await apiResponse.json();
            return jsonResponse(responseData, 200);

        } catch (error) {
            // *** NEW LOGGING: Log the full stack trace of the crash ***
            console.error("--- [DEBUG] FATAL PROXY FUNCTION CRASH ---");
            console.error("Error Message:", error.message);
            console.error("Error Stack:", error.stack);
            console.error("----------------------------------------");
            return jsonResponse({ success: false, error: `The API proxy encountered a fatal error. Check the function logs for details.` }, 500);
        }
    }

    return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400);
}