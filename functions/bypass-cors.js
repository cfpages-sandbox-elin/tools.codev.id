/**
 * =================================================================================
 * CORS Bypass Proxy for Cloudflare Functions
 * =================================================================================
 * This function acts as a secure proxy to fetch content from whitelisted domains,
 * bypassing client-side CORS restrictions.
 *
 * Endpoint: /bypass-cors
 * Method: POST, GET (for debug)
 * Body: { "url": "https://target-url.com" }
 */

// --- Security: Whitelist allowed hostnames ---
const ALLOWED_HOSTNAMES = [
  'www.youtube.com',
  'youtube.com',
  'youtube-transcript-api.com',
];

// --- Reusable Helper Functions ---
const jsonResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};

const handleOptions = (request) => {
  // Always respond to OPTIONS requests with CORS headers for preflight checks.
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};

// --- Main Request Handler (Modern Syntax) ---
export async function onRequest({ request }) {

  // Handle CORS preflight requests first.
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  // Handle GET requests for simple debugging.
  if (request.method === 'GET') {
    return jsonResponse({
      status: "ok",
      message: "bypass-cors function is running and correctly deployed!",
      timestamp: new Date().toISOString()
    }, 200);
  }

  // From here, we only handle POST requests.
  if (request.method !== 'POST') {
    return new Response(`Method Not Allowed`, { status: 405 });
  }

  // --- Main Logic for POST ---
  let targetUrl;
  try {
    const body = await request.json();
    targetUrl = body.url;

    if (!targetUrl) {
      return jsonResponse({ error: 'The "url" property is missing in the request body.' }, 400);
    }
    
    const urlObject = new URL(targetUrl);

    // Security Check: Ensure the requested hostname is in our whitelist.
    if (!ALLOWED_HOSTNAMES.includes(urlObject.hostname)) {
      console.warn(`Forbidden request to non-whitelisted hostname: ${urlObject.hostname}`);
      return jsonResponse({ error: 'Requests to this host are not allowed.' }, 403);
    }

  } catch (err) {
    return jsonResponse({ error: `Invalid request: ${err.message}` }, 400);
  }

  // --- Perform the actual fetch to the target URL ---
  try {
    const response = await fetch(targetUrl, {
      headers: { 'User-Agent': 'Cloudflare-Function-Proxy/1.0' }
    });
    
    // Re-create the response to add our own CORS headers.
    const newResponse = new Response(response.body, response);
    
    // Add CORS headers to the final response.
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    
    return newResponse;

  } catch (error) {
    return jsonResponse({ error: `Failed to fetch from target URL: ${error.message}` }, 502);
  }
}