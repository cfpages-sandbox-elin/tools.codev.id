/**
 * =================================================================================
 * Data Fetcher v1 (Self-Contained Library Logic)
 * =================================================================================
 * A multi-purpose function to fetch external data.
 * - 'youtube' mode: Reliably scrapes YouTube transcripts.
 * - 'proxy' mode (future): Can be used for generic URL proxying.
 *
 * Endpoint: /data-fetcher
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
  if (request.method === 'GET') return jsonResponse({ status: "ok", message: "Data Fetcher v1 (Self-Contained) is live!" }, 200);
  if (request.method !== 'POST') return new Response(`Method Not Allowed`, { status: 405 });

  try {
    const body = await request.json();
    if (body.mode === 'youtube') {
      const { videoId } = body;
      if (!videoId) return jsonResponse({ error: 'Missing "videoId" for YouTube mode.' }, 400);
      
      // Call our robust, self-contained transcript fetching logic.
      return await getTranscriptFromYouTube(videoId);
    }
    
    return jsonResponse({ error: 'Invalid or missing mode in request body.' }, 400);

  } catch (err) {
    return jsonResponse({ error: `Invalid request: ${err.message}` }, 400);
  }
}

/**
 * Implements the logic from youtube-transcript libraries directly.
 * @param {string} videoId The YouTube video ID.
 */
async function getTranscriptFromYouTube(videoId) {
  try {
    // 1. Fetch the main video page HTML with a standard browser User-Agent.
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`[${videoId}] Fetching video page: ${videoPageUrl}`);
    const pageResponse = await fetch(videoPageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!pageResponse.ok) {
      return jsonResponse({ error: `YouTube returned status ${pageResponse.status}. The video may be unavailable.` }, 404);
    }
    const html = await pageResponse.text();

    // 2. Find the Player Response JSON embedded in the HTML.
    // This is more reliable than the old method.
    const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.*?});/);
    if (!playerResponseMatch || !playerResponseMatch[1]) {
       return jsonResponse({ error: "Could not find player data in the video page. This might be a private or restricted video." }, 404);
    }
    const playerResponse = JSON.parse(playerResponseMatch[1]);
    
    // 3. Navigate the complex JSON to find the caption tracks.
    const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks || captionTracks.length === 0) {
       return jsonResponse({ error: "Transcripts are disabled for this video." }, 404);
    }
    
    // 4. Find the URL for the English auto-generated transcript (or the first available).
    // We prioritize 'a.en' (auto-generated English) or any 'en' track.
    const transcriptInfo = captionTracks.find(t => t.vssId === 'a.en') ||
                           captionTracks.find(t => t.vssId.startsWith('.en')) ||
                           captionTracks[0]; // Fallback to the very first track

    if (!transcriptInfo || !transcriptInfo.baseUrl) {
        return jsonResponse({ error: "Could not find a valid transcript URL." }, 404);
    }

    // 5. Fetch the transcript XML from the found URL.
    console.log(`[${videoId}] Fetching transcript from: ${transcriptInfo.baseUrl}`);
    const xmlResponse = await fetch(transcriptInfo.baseUrl);
    if (!xmlResponse.ok) return jsonResponse({ error: `Could not fetch transcript XML (Status: ${xmlResponse.status})` }, 502);
    const xmlText = await xmlResponse.text();

    // 6. Parse the XML and convert it to the clean JSON our app expects.
    const lines = [...xmlText.matchAll(/<text start="([^"]+)" dur="[^"]+">([^<]+)<\/text>/g)];
    const transcriptJson = lines.map(lineMatch => {
        // Decode HTML entities like & and '
        const text = lineMatch[2]
          .replace(/&#39;/g, "'").replace(/'/g, "'")
          .replace(/&quot;/g, '"').replace(/"/g, '"')
          .replace(/'/g, "'")
          .replace(/&/g, '&');

        return {
            text: text,
            start: parseFloat(lineMatch[1]),
        };
    });

    if (transcriptJson.length === 0) {
      return jsonResponse({ error: "Method parsed 0 transcript lines from the data source."}, 404);
    }
    
    console.log(`[${videoId}] Successfully fetched and parsed ${transcriptJson.length} transcript lines.`);
    return jsonResponse(transcriptJson, 200);

  } catch (error) {
    console.error(`[${videoId}] A critical error occurred:`, error);
    return jsonResponse({ error: `An internal error occurred: ${error.message}` }, 500);
  }
}