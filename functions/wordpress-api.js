/**
 * =================================================================================
 * WordPress Publishing Proxy for Cloudflare Functions
 * =================================================================================
 * Securely publishes content to a WordPress site via the REST API.
 * endpoint: /wordpress-api
 */

const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*', // Allow all origins (CORS)
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
};

export async function onRequest({ request }) {
    // 1. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    }

    // 2. Validate Method
    if (request.method !== 'POST') {
        return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
    }

    // 3. Parse Body
    let body;
    try {
        body = await request.json();
    } catch (e) {
        return jsonResponse({ success: false, error: 'Invalid JSON body' }, 400);
    }

    const { wpUrl, username, password, title, content, status, date, categories, tags } = body;

    // 4. Validate Inputs
    if (!wpUrl || !username || !password || !title || !content) {
        return jsonResponse({ success: false, error: 'Missing required fields (wpUrl, username, password, title, content)' }, 400);
    }

    // 5. Prepare WordPress Request
    // Ensure URL ends with /wp-json/wp/v2/posts
    const cleanBaseUrl = wpUrl.replace(/\/$/, ''); 
    const endpoint = `${cleanBaseUrl}/wp-json/wp/v2/posts`;
    
    // Basic Auth
    const authString = btoa(`${username}:${password}`);

    const wpPayload = {
        title: title,
        content: content,
        status: status || 'draft',
        date: date, // ISO 8601 format (YYYY-MM-DDTHH:mm:ss)
        // categories: categories, // Array of IDs (optional)
        // tags: tags // Array of IDs (optional)
    };

    try {
        console.log(`Publishing to: ${endpoint} with status: ${wpPayload.status}`);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Cloudflare-Worker-WP-Publisher/1.0'
            },
            body: JSON.stringify(wpPayload)
        });

        const responseData = await response.json();

        if (!response.ok) {
            // Handle WP Errors (e.g., invalid_username, empty_content)
            const errorMessage = responseData.message || responseData.code || 'Unknown WordPress Error';
            console.error(`WP Error (${response.status}):`, errorMessage);
            return jsonResponse({ success: false, error: `WordPress API Error: ${errorMessage}` }, response.status);
        }

        // Success
        return jsonResponse({ 
            success: true, 
            postId: responseData.id, 
            link: responseData.link,
            status: responseData.status
        });

    } catch (error) {
        console.error("Network/Worker Error:", error);
        return jsonResponse({ success: false, error: `Network Error: ${error.message}` }, 500);
    }
}