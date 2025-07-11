/**
 * Cloudflare Function to securely proxy scraper API calls.
 * This function handles CORS, adds rate limiting, and provides an extensible
 * structure for adding multiple data providers in the future.
 *
 * Endpoint: /scrape-api
 */

// --- Constants ---
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second

// --- Provider Configurations ---
// This structure makes it easy to add more providers later.
const providerConfigs = {
    gmapsextractor: {
        // The actual API endpoint this provider uses.
        endpoint: 'https://cloud.gmapsextractor.com/api/v2/search',

        // Function to generate the correct headers for the external API call.
        // It takes the API key passed from the frontend.
        getHeaders: (apiKey) => ({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        }),

        // Function to construct the body for the external API call
        // from the parameters sent by our frontend.
        getBody: (params) => {
            const payload = {
                "q": params.query,
                "page": params.page,
                "hl": "en",
                "gl": "us",
                "extra": true // Always get emails and social links
            };
            // Only add the 'll' key if it's provided and not empty
            if (params.ll) {
                payload.ll = params.ll;
            }
            return payload;
        }
    },
    // Example for a future provider
    // provider2: {
    //     endpoint: 'https://api.provider2.com/v1/search',
    //     getHeaders: (apiKey) => ({ 'X-API-Key': apiKey }),
    //     getBody: (params) => ({ search_term: params.query, page_num: params.page })
    // }
};

// --- Helper Functions ---

/**
 * Creates a standardized JSON response.
 */
const jsonResponse = (data, status = 200, headers = {}) => {
    const defaultHeaders = { 'Content-Type': 'application/json' };
    return new Response(JSON.stringify(data), { status, headers: { ...defaultHeaders, ...headers } });
};

/**
 * Delays execution for a specified number of milliseconds.
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wrapper around fetch to automatically retry on network errors or specific server errors.
 */
async function fetchWithRetry(url, options, retryCount = 0) {
    try {
        const response = await fetch(url, options);
        // Retry on 5xx server errors or 429 rate limiting
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
            console.warn(`Request to ${url} failed with network error: ${error.message}. Retrying in ${delayTime}ms...`);
            await delay(delayTime);
            return fetchWithRetry(url, options, retryCount + 1);
        }
        console.error(`Request to ${url} failed after ${MAX_RETRIES} retries: ${error.message}`);
        throw error;
    }
}

// --- Main Request Handler ---

export async function onRequest({ request, env }) {
    // Only allow POST requests
    if (request.method !== 'POST') {
        return new Response(`Method ${request.method} Not Allowed`, { status: 405, headers: { 'Allow': 'POST' } });
    }

    // --- Rate Limiting ---
    // This requires a Rate Limiter binding named 'RATE_LIMITER' in your Cloudflare project settings.
    if (env.RATE_LIMITER) {
        const ip = request.headers.get('CF-Connecting-IP');
        const { success } = await env.RATE_LIMITER.limit({ key: ip });
        if (!success) {
            return jsonResponse({ success: false, error: 'Rate limit exceeded. Please try again in a minute.' }, 429);
        }
    }

    let requestData;
    try {
        requestData = await request.json();
    } catch (error) {
        return jsonResponse({ success: false, error: 'Invalid JSON in request body.' }, 400);
    }

    const { action, provider, apiKey, params } = requestData;

    // --- Input Validation ---
    if (!action || !provider || !apiKey || !params) {
        return jsonResponse({ success: false, error: 'Missing required fields: action, provider, apiKey, or params.' }, 400);
    }

    const config = providerConfigs[provider];
    if (!config) {
        return jsonResponse({ success: false, error: `Unsupported provider: ${provider}` }, 400);
    }

    // --- Action: 'search' ---
    if (action === 'search') {
        if (!params.query || !params.page) {
             return jsonResponse({ success: false, error: 'Missing query or page in params.' }, 400);
        }

        console.log(`Proxying search request for provider: ${provider}`);

        try {
            const targetEndpoint = config.endpoint;
            const targetHeaders = config.getHeaders(apiKey);
            const targetBody = config.getBody(params);

            const apiResponse = await fetchWithRetry(targetEndpoint, {
                method: 'POST',
                headers: targetHeaders,
                body: JSON.stringify(targetBody)
            });

            // Read the response from the external API
            const responseData = await apiResponse.json();

            // If the external API returned an error, forward it
            if (!apiResponse.ok) {
                 console.error(`External API Error (${apiResponse.status}) for ${provider}:`, responseData.message || JSON.stringify(responseData));
                 return jsonResponse(responseData, apiResponse.status);
            }
            
            // Forward the successful response from the external API to our frontend
            return jsonResponse(responseData, 200);

        } catch (error) {
            console.error(`Proxy function error for ${provider}: ${error.message}`);
            return jsonResponse({ success: false, error: `An internal error occurred: ${error.message}` }, 500);
        }
    }

    // Fallback for unknown actions
    return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400);
}