// functions/quran-api.js
export async function onRequest({ request, env }) {
  try {
    // Handle OPTIONS requests for CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptionsRequest();
    }
    
    // Get the URL and action from the query parameters
    const url = new URL(request.url);
    const quranUrl = url.searchParams.get('url');
    const action = url.searchParams.get('action') || 'scrape';
    
    if (!quranUrl) {
      return new Response(JSON.stringify({ error: 'Missing Quran URL parameter' }), {
        status: 400,
        headers: corsHeaders()
      });
    }
    
    if (action === 'scrape') {
      // Scrape the Quran.com surah page
      const ayahs = await scrapeQuranSurah(quranUrl);
      
      return new Response(JSON.stringify({ status: 'success', data: ayahs }), {
        status: 200,
        headers: corsHeaders()
      });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action parameter' }), {
        status: 400,
        headers: corsHeaders()
      });
    }
    
  } catch (error) {
    console.error('Error in quran-api function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// Function to scrape Quran.com surah page
async function scrapeQuranSurah(quranUrl) {
  try {
    // Extract surah number from the URL
    const surahMatch = quranUrl.match(/quran\.com\/(\d+)/);
    if (!surahMatch) {
      throw new Error('Invalid Quran.com URL format');
    }
    
    const surahNumber = surahMatch[1];
    const apiUrl = `https://api.quran.com/api/v4/chapters/${surahNumber}?language=en`;
    
    // Fetch chapter information
    const chapterResponse = await fetch(apiUrl);
    if (!chapterResponse.ok) {
      throw new Error('Failed to fetch chapter information');
    }
    
    const chapterData = await chapterResponse.json();
    const chapter = chapterData.chapter;
    
    // Fetch verses for the chapter
    const versesUrl = `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}?language=en&words=true`;
    const versesResponse = await fetch(versesUrl);
    if (!versesResponse.ok) {
      throw new Error('Failed to fetch verses');
    }
    
    const versesData = await versesResponse.json();
    const verses = versesData.verses;
    
    // Process the verses
    const ayahs = verses.map(verse => {
      // Extract Arabic text
      const arabicText = verse.words
        .filter(word => word.char_type === 'word')
        .map(word => word.text)
        .join(' ');
      
      // Extract translation
      const translation = verse.translations.find(t => t.language_id === 20)?.text || '';
      
      return {
        SURAH: `${surahNumber}. ${chapter.name_simple}`,
        AYAH: verse.verse_number,
        ARB: arabicText,
        ENG: translation,
        IDN: '', // Optional field
        LABEL: '', // Empty initially
        SOURCE: `https://quran.com/${surahNumber}/${verse.verse_number}`
      };
    });
    
    return ayahs;
    
  } catch (error) {
    console.error('Error scraping Quran surah:', error);
    throw error;
  }
}

// Handle OPTIONS requests for CORS preflight
function handleOptionsRequest() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

// CORS headers
function corsHeaders() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

// Export the OPTIONS handler
export function onRequestOptions() {
  return handleOptionsRequest();
}