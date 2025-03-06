// functions/printfriendly-api.js v1.1

export async function onRequest({ request, env }) {
  try {
    // ** Check if request.url exists and is valid **
    if (!request.url) {
      console.error("Error: request.url is undefined.");
      return new Response(JSON.stringify({ error: "Invalid request URL." }), {
        status: 400, // Bad Request
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
      });
    }

    let searchParams;
    try {
      // ** Try to create URL object and get searchParams, handle potential URL parsing errors **
      const requestUrl = new URL(request.url); // Attempt to parse URL
      searchParams = requestUrl.searchParams;
    } catch (urlError) {
      console.error("Error parsing request URL:", urlError);
      return new Response(JSON.stringify({ error: "Error parsing request URL." }), {
        status: 400, // Bad Request
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
      });
    }

    // ** Check if searchParams is defined after URL parsing **
    if (!searchParams) {
      console.error("Error: request.url.searchParams is undefined after URL parsing.");
      return new Response(JSON.stringify({ error: "Invalid request parameters." }), {
        status: 400, // Bad Request
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
      });
    }

    const apiKey = searchParams.get('apikey'); // Now safe to use searchParams.get
    if (!apiKey) {
      const response = new Response(JSON.stringify({ error: "PrintFriendly API Key missing in request." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
      });
      return response;
    }

    const pageUrl = searchParams.get('page_url'); // Now safe to use searchParams.get

    if (!pageUrl) {
      const response = new Response(JSON.stringify({ error: "Missing 'page_url' parameter." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
      });
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
        response = new Response(JSON.stringify({ error: `PrintFriendly API error: ${printFriendlyResponse.status} ${printFriendlyResponse.statusText} - ${errorData?.message || 'Unknown error'}` }), {
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
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
    });
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