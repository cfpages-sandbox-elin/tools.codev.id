/**
 * =================================================================================
 * Data Fetcher v4 (Hybrid HTML + XML Fetch)
 * =================================================================================
 * This version uses the most reliable self-contained method:
 * 1. Scrapes the video watch page to get the list of available transcript tracks.
 * 2. Fetches the chosen transcript track's XML data directly.
 * This avoids calling the complex internal 'get_transcript' API and is more stable.
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
  if (request.method === 'GET') return jsonResponse({ status: "ok", message: "Data Fetcher v4 (Hybrid HTML + XML Fetch) is live!" }, 200);
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
 * Implements the most reliable self-contained fetching logic.
 * @param {string} videoId The YouTube video ID.
 */
async function getTranscriptFromYouTube(videoId) {
  try {
    // 1. Fetch the main video page HTML.
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}&lang=en`;
    console.log(`[${videoId}] Step 1: Fetching video page: ${videoPageUrl}`);
    const pageResponse = await fetch(videoPageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36' }
    });
    if (!pageResponse.ok) return jsonResponse({ error: `YouTube returned status ${pageResponse.status}. Video may be private or deleted.` }, 404);
    const html = await pageResponse.text();

    // 2. Find the Player Response JSON embedded in the HTML.
    const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.*?});/);
    if (!playerResponseMatch || !playerResponseMatch[1]) {
       return jsonResponse({ error: "Could not find player data in the video page. This might be a private or restricted video." }, 404);
    }
    
    // ** THE FIX IS HERE **
    // We now parse the JSON in a try-catch block to handle malformed data.
    let playerResponse;
    try {
        playerResponse = JSON.parse(playerResponseMatch[1]);
    } catch(e) {
        console.error(`[${videoId}] Failed to parse ytInitialPlayerResponse. Error: ${e.message}`);
        // This is a more helpful error message.
        return jsonResponse({ error: "Could not parse YouTube's video data. The page format may have changed." }, 500);
    }
    
    // 3. Get the list of all available caption tracks from the parsed data.
    const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks || captionTracks.length === 0) return jsonResponse({ error: "Transcripts are disabled for this video." }, 404);
    
    // 4. Find the best available English transcript URL.
    const transcriptInfo = 
        captionTracks.find(t => t.vssId === '.en') || 
        captionTracks.find(t => t.vssId === 'a.en') ||
        captionTracks.find(t => t.vssId.startsWith('.en')) ||
        captionTracks.find(t => t.vssId.startsWith('a.en'));

    if (!transcriptInfo || !transcriptInfo.baseUrl) return jsonResponse({ error: "Could not find an English transcript for this video." }, 404);
    
    console.log(`[${videoId}] Step 2: Found transcript URL. Fetching XML...`);

    // 5. Fetch the transcript XML from the found URL.
    const xmlResponse = await fetch(transcriptInfo.baseUrl);
    if (!xmlResponse.ok) return jsonResponse({ error: `Could not fetch transcript XML (Status: ${xmlResponse.status})` }, 502);
    const xmlText = await xmlResponse.text();

    // 6. Parse the XML and convert it to clean JSON.
    const lines = [...xmlText.matchAll(/<text start="([^"]+)" dur="[^"]+">([^<]+)<\/text>/g)];
    const transcriptJson = lines.map(lineMatch => {
        const text = lineMatch[2]
          .replace(/&#39;/g, "'").replace(/'/g, "'")
          .replace(/&quot;/g, '"').replace(/"/g, '"')
          .replace(/'/g, "'")
          .replace(/&/g, '&');
        return { text, start: parseFloat(lineMatch[1]) };
    });

    if (transcriptJson.length === 0) return jsonResponse({ error: "Successfully fetched transcript data, but it contained 0 lines."}, 404);
    
    console.log(`[${videoId}] Step 3: Successfully fetched and parsed ${transcriptJson.length} transcript lines.`);
    return jsonResponse(transcriptJson, 200);

  } catch (error) {
    console.error(`[${videoId}] A critical error occurred:`, error);
    return jsonResponse({ error: `An internal error occurred: ${error.message}` }, 500);
  }
}