/**
 * =================================================================================
 * Data Fetcher v7 (Lightweight Proxy)
 * =================================================================================
 * This version exclusively uses a lightweight proxy to a reliable external
 * service. This avoids hitting Cloudflare's free tier CPU/subrequest limits
 * that heavy on-worker scraping can cause, solving the "no logs" crash issue.
 *
 * Endpoint: /data-fetcher
 */

// --- Reusable Helper Functions ---
const jsonResponse = (data, status = 200) => {
  return new Response(JSON.stringify(data), {
    status: status, headers: {
      'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};

const handleOptions = (request) => {
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
};


// --- Main Request Handler ---
export async function onRequest({ request }) {
  // Standard handlers, no changes needed here.
  if (request.method === 'OPTIONS') return handleOptions(request);
  if (request.method === 'GET') return jsonResponse({ status: "ok", message: "Data Fetcher v7 (Lightweight Proxy) is live!" }, 200);
  if (request.method !== 'POST') return new Response(`Method Not Allowed`, { status: 405 });

  try {
    const body = await request.json();
    if (body.mode === 'youtube') {
      const { videoId } = body;
      if (!videoId) return jsonResponse({ error: 'Missing "videoId" for YouTube mode.' }, 400);
      
      // Directly call the reliable, lightweight proxy method.
      return await fetchFromProxy(videoId);
    }
    
    return jsonResponse({ error: 'Invalid or missing mode in request body.' }, 400);

  } catch (err) {
    return jsonResponse({ error: `Invalid request: ${err.message}` }, 400);
  }
}

/**
 * Uses a reliable third-party open-source service to get the transcript.
 * This is the primary and only method for stability and performance.
 */
async function fetchFromProxy(videoId) {
  try {
    const proxyUrl = `https://yt-transcript-api.vercel.app/?videoId=${videoId}`;
    console.log(`[${videoId}] Offloading fetch to reliable proxy: ${proxyUrl}`);
    
    // This is the ONLY fetch call our function makes. It is very fast and lightweight.
    const response = await fetch(proxyUrl, {
      headers: { 'User-Agent': 'Codev-Idea-Engine/1.0' }
    });
    
    // Check if the proxy service itself returned an error.
    if (!response.ok) {
      // Pass the error from the proxy service back to our client.
      const errorBody = await response.text();
      return new Response(errorBody, {
          status: response.status,
          headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
          }
      });
    }

    const data = await response.json();
    const apiResponse = data.apiResponse;

    if (!Array.isArray(apiResponse) || apiResponse.length === 0) {
      return jsonResponse({ error: "The proxy service returned no transcript data. The video may not have captions." }, 404);
    }

    // Normalize the data to the format our frontend expects: { text, start }
    const normalizedJson = apiResponse.map(line => ({
      text: line.text,
      start: line.offset / 1000, // Convert ms to seconds
    }));
    
    console.log(`[${videoId}] Successfully fetched and processed ${normalizedJson.length} lines via proxy.`);
    return jsonResponse(normalizedJson, 200);
    
  } catch (error) {
    console.error(`[${videoId}] Proxy Fetch Internal Error:`, error);
    return jsonResponse({ error: `An internal error occurred while contacting the proxy service: ${error.message}` }, 500);
  }
}