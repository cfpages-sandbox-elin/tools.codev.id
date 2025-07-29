/**
 * =================================================================================
 * CORS Bypass Proxy for Cloudflare Functions
 * =================================================================================
 * This function acts as a secure proxy to fetch content from whitelisted domains,
 * bypassing client-side CORS restrictions.
 *
 * Endpoint: /bypass-cors
 * Method: POST
 * Body: { "url": "https://target-url.com" }
 */

// SECURITY: Only allow requests to these specific hostnames.
// This prevents the function from being used as an open proxy for malicious activities.
const ALLOWED_HOSTNAMES = [
  'www.youtube.com',
  'youtube.com',
  // A simple, free API to get YouTube transcripts by video ID.
  'youtube-transcript-api.com', 
];

// Standard CORS headers.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Or specify your domain for better security
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Handles CORS preflight requests (OPTIONS).
 */
function handleOptions(request) {
  if (
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    // Handle CORS preflight requests.
    return new Response(null, {
      headers: CORS_HEADERS,
    });
  } else {
    // Handle standard OPTIONS request.
    return new Response(null, {
      headers: {
        Allow: 'POST, OPTIONS',
      },
    });
  }
}

/**
 * Main fetch handler.
 */
export default {
  async fetch(request, env) {
    if (request.method === 'GET') {
      return new Response(JSON.stringify({
        status: "ok",
        message: "bypass-cors function is running!",
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: {
          ...CORS_HEADERS, // Use existing CORS headers
          'Content-Type': 'application/json'
        },
      });
    }

    // --- Handle CORS preflight (OPTIONS) requests ---
    if (request.method === 'OPTIONS') {
      return handleOptions(request); // Assumes handleOptions function exists above
    }

    // --- Handle actual proxy (POST) requests ---
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed. This endpoint only accepts POST.', {
        status: 405,
        headers: CORS_HEADERS
      });
    }

    // --- Main Logic for POST ---
    let targetUrl;
    try {
      const body = await request.json();
      targetUrl = body.url;

      if (!targetUrl) {
        throw new Error('The "url" property is missing in the request body.');
      }
      
      const urlObject = new URL(targetUrl);

      // Security Check
      if (!ALLOWED_HOSTNAMES.includes(urlObject.hostname)) {
        console.warn(`Forbidden request to non-whitelisted hostname: ${urlObject.hostname}`);
        return new Response(JSON.stringify({ error: 'Requests to this host are not allowed.' }), {
          status: 403, // Forbidden
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }

    } catch (err) {
      return new Response(JSON.stringify({ error: `Invalid request: ${err.message}` }), {
        status: 400, // Bad Request
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // --- Perform the actual fetch ---
    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Content-Type', response.headers.get('Content-Type') || 'text/plain');
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        newResponse.headers.set(key, value);
      });
      
      return newResponse;

    } catch (error) {
      return new Response(JSON.stringify({ error: `Failed to fetch from target URL: ${error.message}` }), {
        status: 502, // Bad Gateway
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }
  },
};