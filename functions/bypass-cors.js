/**
 * =================================================================================
 * CORS Bypass & YouTube Transcript Fetcher
 * =================================================================================
 * Now with a dedicated mode to fetch YouTube transcripts directly,
 * removing the need for third-party services.
 *
 * Endpoint: /bypass-cors
 * Modes:
 *  - 'youtube': { "mode": "youtube", "videoId": "..." }
 *  - 'proxy' (default): { "url": "..." }
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
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};

// --- Main Request Handler ---
export async function onRequest({ request }) {

  if (request.method === 'OPTIONS') return handleOptions(request);
  if (request.method === 'GET') return jsonResponse({ status: "ok", message: "YouTube Transcript Fetcher is live!" }, 200);
  if (request.method !== 'POST') return new Response(`Method Not Allowed`, { status: 405 });

  try {
    const body = await request.json();
    const mode = body.mode || 'proxy'; // Default to 'proxy' for backwards compatibility

    if (mode === 'youtube') {
      const { videoId } = body;
      if (!videoId) return jsonResponse({ error: 'Missing "videoId" for YouTube mode.' }, 400);
      
      return await fetchYouTubeTranscript(videoId);

    } else if (mode === 'proxy') {
      const { url } = body;
      if (!url) return jsonResponse({ error: 'Missing "url" for proxy mode.' }, 400);

      const urlObject = new URL(url);
      const ALLOWED_HOSTNAMES = ['www.some-other-allowed-site.com']; // Keep for other potential uses
      if (!ALLOWED_HOSTNAMES.includes(urlObject.hostname)) {
        return jsonResponse({ error: 'Requests to this host are not allowed in proxy mode.' }, 403);
      }
      
      const response = await fetch(url, { headers: { 'User-Agent': 'Cloudflare-Function-Proxy/1.0' } });
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Access-Control-Allow-Origin', '*');
      return newResponse;

    } else {
      return jsonResponse({ error: `Unknown mode: ${mode}` }, 400);
    }

  } catch (err) {
    return jsonResponse({ error: `Invalid request: ${err.message}` }, 400);
  }
}

/**
 * Fetches transcript directly from YouTube.
 * @param {string} videoId The YouTube video ID.
 */
async function fetchYouTubeTranscript(videoId) {
  try {
    // 1. Fetch the main video page HTML
    const videoPageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    if (!videoPageResponse.ok) {
        return jsonResponse({ error: `Could not fetch YouTube video page (Status: ${videoPageResponse.status})` }, 502);
    }
    const videoPageHtml = await videoPageResponse.text();

    // 2. Parse the HTML to find the caption track URL
    // This is a complex regex to find the right JavaScript object in the page source.
    const captionsJsonRegex = /"captionTracks":(\[.*?\])/;
    const match = videoPageHtml.match(captionsJsonRegex);

    if (!match || !match[1]) {
      return jsonResponse({ error: "Could not find transcript data in the video page. Captions may be disabled." }, 404);
    }

    const captionTracks = JSON.parse(match[1]);
    
    // Find the English auto-generated caption track, or the first available one.
    const transcriptUrl = captionTracks.find(t => t.languageCode === 'en' && t.kind === 'asr')?.baseUrl ||
                          captionTracks[0]?.baseUrl;

    if (!transcriptUrl) {
      return jsonResponse({ error: "No usable caption track URL found." }, 404);
    }

    // 3. Fetch the actual transcript data (which is in XML format)
    const transcriptResponse = await fetch(transcriptUrl);
     if (!transcriptResponse.ok) {
        return jsonResponse({ error: `Could not fetch transcript XML (Status: ${transcriptResponse.status})` }, 502);
    }
    const transcriptXml = await transcriptResponse.text();

    // 4. Parse the XML and convert it to the JSON format our app wants
    const lines = [...transcriptXml.matchAll(/<text start="([^"]+)" dur="[^"]+">([^<]+)<\/text>/g)];
    const transcriptJson = lines.map(lineMatch => {
        const start = parseFloat(lineMatch[1]);
        // Decode HTML entities like &
        const text = lineMatch[2].replace(/&#39;/g, "'")
                                 .replace(/&quot;/g, '"')
                                 .replace(/"/g, '"')
                                 .replace(/'/g, "'")
                                 .replace(/&/g, '&')
                                 .replace(/'/g, "'");

        return {
            text: text,
            start: start,
        };
    });

    return jsonResponse(transcriptJson, 200);

  } catch (error) {
    console.error("YouTube transcript fetch error:", error);
    return jsonResponse({ error: `An internal error occurred: ${error.message}` }, 500);
  }
}