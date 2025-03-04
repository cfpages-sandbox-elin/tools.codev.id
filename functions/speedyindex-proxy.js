export async function onRequest({ request }) {
    const url = new URL(request.url);
    // Remove "/functions/speedyindex-proxy" prefix to get the intended API path
    const apiPath = url.pathname.replace('/functions/speedyindex-proxy', '');
    const apiUrl = `https://api.speedyindex.com${apiPath}`;

    // Get API Key from request headers
    const apiKey = request.headers.get('Authorization');

    if (!apiKey) {
        return new Response("API Key is missing", { status: 400 });
    }

    try {
        const speedyIndexResponse = await fetch(apiUrl, {
            method: request.method,
            headers: {
                'Authorization': apiKey,
                'Content-Type': request.headers.get('Content-Type') || 'application/json',
                'User-Agent': request.headers.get('User-Agent') // Forward User-Agent (optional but good practice)
            },
            body: request.method !== 'GET' ? await request.blob() : null
        });

        // Clone the headers to modify them if needed (e.g., CORS)
        const headers = new Headers(speedyIndexResponse.headers);

        // Add CORS headers to allow access from your frontend domain (replace with your actual domain)
        headers.set('Access-Control-Allow-Origin', '*'); // Or your specific domain for better security in production
        headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Allow necessary methods
        headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type'); // Allow necessary headers

        return new Response(speedyIndexResponse.body, {
            status: speedyIndexResponse.status,
            headers: headers, // Use the modified headers with CORS
        });

    } catch (error) {
        console.error("Proxy error:", error);
        return new Response("Proxy error", { status: 500 });
    }
}

// For OPTIONS requests (preflight for CORS), directly return CORS headers
export function onRequestOptions() {
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*'); // Or your specific domain
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    headers.set('Access-Control-Max-Age', '86400'); // Cache preflight response for 24 hours

    return new Response(null, {
        status: 204, // No Content
        headers: headers
    });
}
