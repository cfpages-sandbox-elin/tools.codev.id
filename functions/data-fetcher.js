/**
 * =================================================================================
 * Data Fetcher v5 (Production Ready)
 * =================================================================================
 * This version includes enhanced logging and a more resilient XML parser
 * to handle variations in YouTube's transcript format.
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
  if (request.method === 'GET') return jsonResponse({ status: "ok", message: "Data Fetcher v5 (Production Ready) is live!" }, 200);
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
    // 1. Fetch video page to get player response
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}&lang=en`;
    console.log(`[${videoId}] Step 1: Fetching video page...`);
    const pageResponse = await fetch(videoPageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36' }
    });
    if (!pageResponse.ok) return jsonResponse({ error: `YouTube returned status ${pageResponse.status}. Video may be private or deleted.` }, 404);
    const html = await pageResponse.text();

    const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.*?});/);
    if (!playerResponseMatch) return jsonResponse({ error: "Could not find player data. Video may be private or restricted." }, 404);
    
    let playerResponse;
    try {
        playerResponse = JSON.parse(playerResponseMatch[1]);
    } catch(e) {
        return jsonResponse({ error: "Could not parse YouTube's video data. The page format may have changed." }, 500);
    }
    
    // 2. Find best available English transcript URL
    const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks || captionTracks.length === 0) return jsonResponse({ error: "Transcripts are disabled for this video." }, 404);
    
    const transcriptInfo = 
        captionTracks.find(t => t.vssId === '.en') || 
        captionTracks.find(t => t.vssId === 'a.en') ||
        captionTracks.find(t => t.vssId.startsWith('.en')) ||
        captionTracks.find(t => t.vssId.startsWith('a.en'));

    if (!transcriptInfo || !transcriptInfo.baseUrl) return jsonResponse({ error: "Could not find an English transcript for this video." }, 404);
    
    console.log(`[${videoId}] Step 2: Found transcript URL. Fetching XML...`);

    // 3. Fetch the transcript XML
    const xmlResponse = await fetch(transcriptInfo.baseUrl);
    if (!xmlResponse.ok) return jsonResponse({ error: `Could not fetch transcript XML (Status: ${xmlResponse.status})` }, 502);
    const xmlText = await xmlResponse.text();

    // *** ENHANCED LOGGING & PARSING ***
    console.log(`[${videoId}] Step 3: Received XML data (first 500 chars): ${xmlText.substring(0, 500)}`);
    
    // Using a more resilient, non-greedy regex to capture text content.
    const lines = [...xmlText.matchAll(/<text start="([^"]+)" dur="[^"]+">(.*?)<\/text>/gs)];
    const transcriptJson = lines.map(lineMatch => {
        const text = lineMatch[2]
          .replace(/&#39;/g, "'").replace(/'/g, "'")
          .replace(/&quot;/g, '"').replace(/"/g, '"')
          .replace(/'/g, "'")
          .replace(/&/g, '&');
        return { text, start: parseFloat(lineMatch[1]) };
    });

    if (transcriptJson.length === 0) {
      console.error(`[${videoId}] Failed to parse any lines from the received XML.`);
      return jsonResponse({ error: "Could not parse transcript from the received data. Format may be unexpected."}, 404);
    }
    
    console.log(`[${videoId}] Step 4: Successfully parsed ${transcriptJson.length} transcript lines.`);
    return jsonResponse(transcriptJson, 200);

  } catch (error) {
    console.error(`[${videoId}] A critical error occurred:`, error);
    return jsonResponse({ error: `An internal error occurred: ${error.message}` }, 500);
  }
}