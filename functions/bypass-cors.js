/**
 * =================================================================================
 * YouTube Transcript Fetcher v3 (Reliable Proxy Method)
 * =================================================================================
 * This function uses a reliable third-party open-source service to
 * fetch YouTube transcripts. This approach is lightweight and avoids
 * Cloudflare's free tier CPU and subrequest limits.
 *
 * Endpoint: /bypass-cors
 * Mode: { "mode": "youtube", "videoId": "..." }
 */

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
  return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
};


// --- Main Request Handler ---
export async function onRequest({ request }) {

  if (request.method === 'OPTIONS') return handleOptions(request);
  if (request.method === 'GET') return jsonResponse({ status: "ok", message: "YouTube Transcript Fetcher v3 (Reliable Proxy) is live!" }, 200);
  if (request.method !== 'POST') return new Response(`Method Not Allowed`, { status: 405 });

  try {
    const body = await request.json();
    if (body.mode === 'youtube') {
      const { videoId } = body;
      if (!videoId) return jsonResponse({ error: 'Missing "videoId" for YouTube mode.' }, 400);
      
      // Directly call the reliable proxy method.
      return await fetchFromProxy(videoId);
    }
    
    return jsonResponse({ error: 'Invalid or missing mode in request body.' }, 400);

  } catch (err) {
    return jsonResponse({ error: `Invalid request: ${err.message}` }, 400);
  }
}

/**
 * Uses a reliable third-party open-source service to get the transcript.
 * This is the primary and only method now for stability.
 */
async function fetchFromProxy(videoId) {
  try {
    const proxyUrl = `https://yt-transcript-api.vercel.app/?videoId=${videoId}`;
    console.log(`[${videoId}] Fetching from reliable proxy: ${proxyUrl}`);
    
    const response = await fetch(proxyUrl, {
      // It's good practice to set a custom User-Agent for our service
      headers: { 'User-Agent': 'Codev-Idea-Engine/1.0' }
    });
    
    if (!response.ok) {
        return jsonResponse({ error: `The transcript proxy service failed with status: ${response.status}` }, 502);
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

    return jsonResponse(normalizedJson, 200);
    
  } catch (error) {
    console.error(`[${videoId}] Proxy Fetch Internal Error:`, error);
    return jsonResponse({ error: `An internal error occurred while contacting the proxy service: ${error.message}` }, 500);
  }
}