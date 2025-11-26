/**
 * =================================================================================
 * WordPress Publishing Proxy for Cloudflare Functions
 * =================================================================================
 * Securely publishes content to a WordPress site via the REST API.
 * Endpoint: /wordpress-api
 * Version: v9.13 canggih
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

    // 4. Extract Common Credentials & Action
    const { wpUrl, username, password, action } = body;

    if (!wpUrl || !username || !password) {
        return jsonResponse({ success: false, error: 'Missing WordPress credentials (URL, User, Password)' }, 400);
    }

    // Helper: Prepare Headers & Clean URL
    const cleanBaseUrl = wpUrl.replace(/\/$/, '');
    const authString = btoa(`${username}:${password}`);
    const headers = {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Cloudflare-Worker-WP-Publisher/1.0'
    };

    // --- ACTION: Get Categories ---
    if (action === 'get_categories') {
        const endpoint = `${cleanBaseUrl}/wp-json/wp/v2/categories?per_page=100`;
        
        try {
            const response = await fetch(endpoint, { method: 'GET', headers });
            if (!response.ok) throw new Error(`WP Error ${response.status}: ${response.statusText}`);
            
            const categories = await response.json();
            return jsonResponse({ 
                success: true, 
                categories: categories.map(c => ({ id: c.id, name: c.name, slug: c.slug })) 
            });
        } catch (e) {
            return jsonResponse({ success: false, error: e.message }, 500);
        }
    }

    // --- ACTION: Get Posts (For Internal Linking) ---
    if (action === 'get_posts') {
        // Get minimal fields to save bandwidth
        const endpoint = `${cleanBaseUrl}/wp-json/wp/v2/posts?per_page=50&_fields=id,title,link,slug`;
        
        try {
            const response = await fetch(endpoint, { method: 'GET', headers });
            if (!response.ok) throw new Error(`WP Error ${response.status}: ${response.statusText}`);
            
            const posts = await response.json();
            return jsonResponse({ 
                success: true, 
                posts: posts.map(p => ({ 
                    id: p.id, 
                    title: p.title.rendered, 
                    link: p.link, 
                    slug: p.slug 
                })) 
            });
        } catch (e) {
            return jsonResponse({ success: false, error: e.message }, 500);
        }
    }

    // --- ACTION: Publish (Default) ---
    // Now we validate the specific fields required for publishing
    const { title, content, status, date } = body;

    if (!title || !content) {
        return jsonResponse({ success: false, error: 'Missing title or content for publishing.' }, 400);
    }

    const endpoint = `${cleanBaseUrl}/wp-json/wp/v2/posts`;
    const wpPayload = {
        title: title,
        content: content,
        status: status || 'draft',
        date: date, // ISO 8601
    };

    try {
        console.log(`Publishing to: ${endpoint}`);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(wpPayload)
        });

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessage = responseData.message || responseData.code || 'Unknown WordPress Error';
            console.error(`WP Error (${response.status}):`, errorMessage);
            return jsonResponse({ success: false, error: `WordPress API Error: ${errorMessage}` }, response.status);
        }

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