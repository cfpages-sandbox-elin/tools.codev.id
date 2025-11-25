/**
 * =================================================================================
 * Google Suggest Proxy for Cloudflare Functions
 * =================================================================================
 * Fetches autocomplete suggestions from Google's unofficial API.
 * Endpoint: /google-browser
 */

const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
};

export async function onRequest({ request }) {
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    }

    if (request.method !== 'POST') {
        return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
    }

    let body;
    try {
        body = await request.json();
    } catch (e) {
        return jsonResponse({ success: false, error: 'Invalid JSON' }, 400);
    }

    const { queries, lang = 'en', gl = 'us' } = body;

    if (!queries || !Array.isArray(queries) || queries.length === 0) {
        return jsonResponse({ success: false, error: 'Missing or empty "queries" array' }, 400);
    }

    // We use the 'firefox' client because it returns a very clean JSON structure: [query, [suggestions...]]
    const baseUrl = `http://google.com/complete/search?client=firefox&hl=${lang}&gl=${gl}&q=`;

    const results = [];

    // Process in parallel (Cloudflare usually allows ~6-50 sub-requests depending on plan)
    // We assume the frontend sends reasonable batch sizes (e.g., 5-10).
    const fetchPromises = queries.map(async (q) => {
        try {
            const url = baseUrl + encodeURIComponent(q);
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (!response.ok) return [];

            // Google returns: ["query", ["suggestion1", "suggestion2", ...]]
            const data = await response.json();
            return data[1] || [];
        } catch (error) {
            console.error(`Failed to fetch for query "${q}":`, error);
            return [];
        }
    });

    const suggestionsArrays = await Promise.all(fetchPromises);

    // Flatten results
    suggestionsArrays.forEach(arr => {
        results.push(...arr);
    });

    // Basic backend de-duplication
    const uniqueResults = [...new Set(results)];

    return jsonResponse({ success: true, suggestions: uniqueResults });
}