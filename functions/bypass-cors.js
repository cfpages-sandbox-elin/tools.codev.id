/**
 * =================================================================================
 * CORS Bypass & YouTube Transcript Fetcher v2 (with Fallback)
 * =================================================================================
 * Now attempts to fetch directly from YouTube first. If that fails, it
 * automatically uses a third-party proxy as a fallback for reliability.
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
  if (request.method === 'GET') return jsonResponse({ status: "ok", message: "YouTube Transcript Fetcher v2 (with Fallback) is live!" }, 200);
  if (request.method !== 'POST') return new Response(`Method Not Allowed`, { status: 405 });

  try {
    const body = await request.json();
    if (body.mode === 'youtube') {
      const { videoId } = body;
      if (!videoId) return jsonResponse({ error: 'Missing "videoId" for YouTube mode.' }, 400);
      
      // --- Smart Fetching Logic ---
      console.log(`[${videoId}] Attempting direct fetch...`);
      const directResult = await fetchYouTubeDirectly(videoId);

      // If direct fetch was successful (status 200), return its result.
      if (directResult.status === 200) {
        console.log(`[${videoId}] Direct fetch SUCCEEDED.`);
        return directResult;
      }

      // If direct fetch failed, log it and try the proxy fallback.
      console.warn(`[${videoId}] Direct fetch failed. Status: ${directResult.status}. Trying proxy fallback...`);
      const proxyResult = await fetchFromProxy(videoId);
      
      if (proxyResult.status === 200) {
        console.log(`[${videoId}] Proxy fallback SUCCEEDED.`);
      } else {
        console.error(`[${videoId}] Proxy fallback FAILED. Status: ${proxyResult.status}`);
      }
      
      return proxyResult; // Return the result of the proxy attempt (success or failure)
    }
    
    return jsonResponse({ error: 'Invalid or missing mode in request body.' }, 400);

  } catch (err) {
    return jsonResponse({ error: `Invalid request: ${err.message}` }, 400);
  }
}


/**
 * METHOD 1: Attempts to fetch the transcript directly from YouTube's page source.
 * This is fast but can fail if YouTube changes its page layout.
 */
async function fetchYouTubeDirectly(videoId) {
  try {
    const pageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    if (!pageResponse.ok) return jsonResponse({ error: "Could not fetch video page" }, 502);
    const html = await pageResponse.text();

    const match = html.match(/"captionTracks":(\[.*?\])/);
    if (!match || !match[1]) {
      return jsonResponse({ error: "Could not find transcript data in the video page. Captions may be disabled." }, 404);
    }
    const captionTracks = JSON.parse(match[1]);
    const transcriptUrl = captionTracks.find(t => t.languageCode === 'en' && t.kind === 'asr')?.baseUrl || captionTracks[0]?.baseUrl;
    if (!transcriptUrl) return jsonResponse({ error: "No usable caption track URL found." }, 404);

    const xmlResponse = await fetch(transcriptUrl);
    if (!xmlResponse.ok) return jsonResponse({ error: "Could not fetch transcript XML" }, 502);
    const xmlText = await xmlResponse.text();

    const lines = [...xmlText.matchAll(/<text start="([^"]+)" dur="[^"]+">([^<]+)<\/text>/g)];
    const transcriptJson = lines.map(line => {
      const text = line[2].replace(/&#39;/g, "'").replace(/"/g, '"').replace(/'/g, "'").replace(/&/g, '&').replace(/'/g, "'");
      return { text: text, start: parseFloat(line[1]) };
    });

    if (transcriptJson.length === 0) {
      return jsonResponse({ error: "Direct method parsed 0 transcript lines."}, 404);
    }

    return jsonResponse(transcriptJson, 200);
  } catch (error) {
    console.error("Direct Fetch Internal Error:", error);
    return jsonResponse({ error: `An internal error occurred during direct fetch: ${error.message}` }, 500);
  }
}

/**
 * METHOD 2 (FALLBACK): Uses a reliable third-party open-source service to get the transcript.
 * This is more robust against YouTube UI changes.
 */
async function fetchFromProxy(videoId) {
  try {
    const proxyUrl = `https://yt-transcript-api.vercel.app/?videoId=${videoId}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) return jsonResponse({ error: `Proxy service failed with status: ${response.status}` }, 502);

    const data = await response.json();
    const apiResponse = data.apiResponse;
    if (!Array.isArray(apiResponse) || apiResponse.length === 0) {
      return jsonResponse({ error: "Proxy service returned no transcript data." }, 404);
    }

    // IMPORTANT: Normalize the data to match the format of our direct method
    const normalizedJson = apiResponse.map(line => ({
      text: line.text,
      start: line.offset / 1000, // Convert ms to seconds
    }));

    return jsonResponse(normalizedJson, 200);
  } catch (error) {
    console.error("Proxy Fetch Internal Error:", error);
    return jsonResponse({ error: `An internal error occurred during proxy fetch: ${error.message}` }, 500);
  }
}