// functions/speedyindex-api.js

export async function onRequest({ request, env }) { // Single onRequest function
  const apiKey = env.speedyindex_api_key; // Use lowercase env variable name
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "SpeedyIndex API Key not set in environment variables (server-side)." }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action'); // Get 'action' query parameter

  if (action === 'get-balance') {
    return handleGetBalance(apiKey); // Call separate balance handler
  } else if (action === 'index-urls') {
    return handleIndexUrls(request, apiKey); // Call separate index URLs handler
  } else {
    return new Response(JSON.stringify({ error: "Invalid action parameter." }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
}


async function handleGetBalance(apiKey) { // Separate function for balance logic
  const apiUrl = 'https://api.speedyindex.com/v2/account';
  try {
    const response = await fetch(apiUrl, {
      headers: { 'Authorization': apiKey }
    });
    if (!response.ok) {
      console.error("SpeedyIndex API - Get Balance failed:", response.status, response.statusText);
      return new Response(JSON.stringify({ error: "Error fetching SpeedyIndex balance from API." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const data = await response.json();
    return new Response(JSON.stringify({ balance: data.balance?.indexer }), { headers: { 'Content-Type': 'application/json' } }); // Return balance in JSON
  } catch (error) {
    console.error("Error in handleGetBalance:", error);
    return new Response(JSON.stringify({ error: "Error communicating with SpeedyIndex API." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleIndexUrls(request, apiKey) { // Separate function for indexing logic
  if (request.method !== 'POST') {
    return new Response("Method Not Allowed", { status: 405 });
  }
  try {
    const requestData = await request.json();
    const urls = requestData.urls; // Expect URLs to be sent in request body as JSON
    const apiUrl = 'https://api.speedyindex.com/v2/task/google/indexer/create';
    const taskTitle = `Issuu_Index_${Date.now()}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: taskTitle, urls: urls })
    });
    const data = await response.json();
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Error in handleIndexUrls Worker:", error);
    return new Response(JSON.stringify({ error: "Error processing indexing request." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}