// functions/printfriendly-api.js

export async function onRequest({ request, env }) {
  try { // Add top-level try block here
    const apiKey = request.url.searchParams.get('apikey'); // Get API Key from query parameter
    if (!apiKey) {
      const response = new Response(JSON.stringify({ error: "PrintFriendly API Key missing in request." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      return response;
    }

    const pageUrl = request.url.searchParams.get('page_url'); // Get the URL to convert from query parameter

    if (!pageUrl) {
      const response = new Response(JSON.stringify({ error: "Missing 'page_url' parameter." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      return response;
    }

    const printFriendlyApiUrl = `https://api.printfriendly.com/v2/pdf/create?api_key=${apiKey}`; // Use API key from query parameter

    let response;
    try {
      const printFriendlyResponse = await fetch(printFriendlyApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        },
        body: `page_url=${encodeURIComponent(pageUrl)}`
      });

      if (!printFriendlyResponse.ok) {
        const errorData = await printFriendlyResponse.json();
        console.error("PrintFriendly API error (proxy):", printFriendlyResponse.status, printFriendlyResponse.statusText, errorData);
        response = new Response(JSON.stringify({ error: `PrintFriendly API error: ${printFriendlyResponse.status} ${printFriendlyResponseResponse.statusText} - ${errorData?.message || 'Unknown error'}` }), {
          status: printFriendlyResponse.status, // Forward the PrintFriendly API status code
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        const data = await printFriendlyResponse.json();
        if (data.status === "success" && data.file_url) {
          // Fetch the PDF Blob from PrintFriendly's file_url and return it as the function response
          const pdfResponse = await fetch(data.file_url);
          if (!pdfResponse.ok) {
            throw new Error(`Error fetching PDF from PrintFriendly URL (proxy): ${pdfResponse.status} ${pdfResponse.statusText}`);
          }
          const pdfBlob = await pdfResponse.blob();

          response = new Response(pdfBlob, { // Return PDF Blob as function response
            headers: { 'Content-Type': 'application/pdf' } // Set Content-Type to application/pdf
          });

        } else {
          console.error("PrintFriendly API failed to generate PDF (proxy):", data);
          response = new Response(JSON.stringify({ error: `PrintFriendly API failed to generate PDF: ${data?.message || 'Unknown error'}` }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

    } catch (error) {
      console.error("Error in printfriendly-api Function (inner try):", error); // Keep inner catch
      response = new Response(JSON.stringify({ error: "Error processing PDF conversion." }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Set CORS headers to the response
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;

  } catch (outerError) { // Add outer catch block to onRequest
    console.error("Error in printfriendly-api Function (outer try - onRequest):", outerError); // Log outer error
    const errorResponse = new Response(JSON.stringify({ error: "Internal Server Error in PrintFriendly API Function." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
    errorResponse.headers.set('Access-Control-Allow-Origin', '*'); // CORS for error response too
    errorResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    errorResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return errorResponse; // Return a controlled 500 error response
  }
}

export function onRequestOptions() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');

  return new Response(null, {
    status: 204,
    headers: headers
  });
}