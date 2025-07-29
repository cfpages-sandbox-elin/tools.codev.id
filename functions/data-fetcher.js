/**
 * =================================================================================
 * Data Fetcher v3 (Direct Internal API)
 * =================================================================================
 * This version targets YouTube's internal 'get_transcript' API directly,
 * which is more reliable than scraping the main video watch page.
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
  if (request.method === 'OPTIONS') return handleOptions(request);
  if (request.method === 'GET') return jsonResponse({ status: "ok", message: "Data Fetcher v3 (Direct Internal API) is live!" }, 200);
  if (request.method !== 'POST') return new Response(`Method Not Allowed`, { status: 405 });

  try {
    const body = await request.json();
    if (body.mode === 'youtube') {
      const { videoId } = body;
      if (!videoId) return jsonResponse({ error: 'Missing "videoId" for YouTube mode.' }, 400);
      return await getTranscriptFromYouTube(videoId);
    }
    return jsonResponse({ error: 'Invalid or missing mode in request body.' }, 400);
  } catch (err) {
    return jsonResponse({ error: `Invalid request: ${err.message}` }, 400);
  }
}

/**
 * Uses a more direct approach by calling YouTube's internal get_transcript API.
 * @param {string} videoId The YouTube video ID.
 */
async function getTranscriptFromYouTube(videoId) {
  try {
    // 1. Fetch the main video page to get the necessary internal API key.
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`[${videoId}] Step 1: Fetching video page to find API key...`);
    const pageResponse = await fetch(videoPageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36' }
    });
    if (!pageResponse.ok) return jsonResponse({ error: `YouTube returned status ${pageResponse.status}. Video may be private or deleted.` }, 404);
    const html = await pageResponse.text();

    // 2. Extract the INNERTUBE_API_KEY. This is essential for the internal API call.
    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"(.*?)"/);
    if (!apiKeyMatch || !apiKeyMatch[1]) return jsonResponse({ error: "Could not extract internal API key from YouTube page." }, 500);
    const INNERTUBE_API_KEY = apiKeyMatch[1];
    console.log(`[${videoId}] Step 1: Found INNERTUBE_API_KEY.`);

    // 3. Extract the client context information.
    const contextMatch = html.match(/"INNERTUBE_CONTEXT":({.*?})/);
    if (!contextMatch || !contextMatch[1]) return jsonResponse({ error: "Could not extract internal API context." }, 500);
    const INNERTUBE_CONTEXT = JSON.parse(contextMatch[1]);
    console.log(`[${videoId}] Step 1: Found INNERTUBE_CONTEXT.`);

    // 4. Make the POST request to the 'get_transcript' internal API endpoint.
    const apiUrl = `https://www.youtube.com/youtubei/v1/get_transcript?key=${INNERTUBE_API_KEY}`;
    console.log(`[${videoId}] Step 2: Calling internal get_transcript API...`);
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: INNERTUBE_CONTEXT,
        params: playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks?.[0]?.baseUrl.split('?')[1],
      })
    });

    if (!apiResponse.ok) return jsonResponse({ error: `YouTube's internal API failed with status ${apiResponse.status}`}, 502);
    const transcriptData = await apiResponse.json();

    // 5. Check for the transcript data in the response.
    const cues = transcriptData?.actions?.[0]?.updateEngagementPanelAction?.content?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body?.transcriptSegmentListRenderer?.initialSegments;
    if (!cues || cues.length === 0) {
      return jsonResponse({ error: "API response did not contain transcript cues. Captions may be disabled." }, 404);
    }
    
    // 6. Parse the cues into our standard format.
    const transcriptJson = cues.map(cueItem => {
      const cue = cueItem.transcriptSegmentRenderer;
      return {
        text: cue.snippet.runs.map(r => r.text).join(''),
        start: parseInt(cue.startMs, 10) / 1000,
      };
    });

    if (transcriptJson.length === 0) return jsonResponse({ error: "Successfully fetched transcript data, but it contained 0 lines."}, 404);
    
    console.log(`[${videoId}] Step 2: Successfully fetched and parsed ${transcriptJson.length} transcript lines from internal API.`);
    return jsonResponse(transcriptJson, 200);

  } catch (error) {
    console.error(`[${videoId}] A critical error occurred:`, error);
    return jsonResponse({ error: `An internal error occurred: ${error.message}` }, 500);
  }
}