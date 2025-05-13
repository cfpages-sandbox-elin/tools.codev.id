// /functions/browser.js

/**
 * Cloudflare Worker to fetch content from a given URL.
 * Handles POST requests with a 'url' property in the JSON body.
 */
export async function onRequest({ request, env }) {
    // Only allow POST requests
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
            status: 405,
            headers: { 'Allow': 'POST' },
        });
    }

    let requestData;
    try {
        // Parse the request body as JSON
        requestData = await request.json();
    } catch (error) {
        // Handle invalid JSON
        return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { url } = requestData;

    // Check if the 'url' property is provided
    if (!url) {
        return new Response(JSON.stringify({ success: false, error: 'Missing url parameter in request body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // Fetch the content from the provided URL
        const response = await fetch(url);

        // Check if the fetch was successful
        if (!response.ok) {
            throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
        }

        // Read the response content as text
        const content = await response.text();

        // --- Image Extraction Logic ---
        // Use a simple regex to find image src attributes. This is basic and might not catch all cases.
        // A more robust solution might require a DOM parser if available in the environment.
        const imgRegex = /<img\s+[^>]*src="([^"]+)"[^>]*>/gi;
        const potentialImageUrls = [];
        let match;

        while ((match = imgRegex.exec(content)) !== null) {
            // Add simple filtering for potential logos (e.g., contains 'logo', common extensions)
            const imageUrl = match[1];
            if (imageUrl.includes('logo') || imageUrl.includes('brand') || /\.(png|jpg|jpeg|svg|gif)$/i.test(imageUrl)) {
                potentialImageUrls.push(imageUrl);
            } else {
                // Optionally, include all image URLs or apply different filtering
                // potentialImageUrls.push(imageUrl);
            }
        }

        // Return the extracted potential image URLs
        return new Response(JSON.stringify({ success: true, potentialImageUrls: potentialImageUrls }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        // Handle any errors during the fetch process
        console.error(`Error fetching URL ${url}: ${error}`);
        return new Response(JSON.stringify({ success: false, error: `Could not process URL or find images: ${error.message}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}