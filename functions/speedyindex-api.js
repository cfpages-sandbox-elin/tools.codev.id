  export async function onRequestGetBalance({ request, env }) { // Dedicated function for balance
    const apiKey = env.speedyindex_api_key;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "SpeedyIndex API Key not set in environment variables (server-side)." }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
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
      console.error("Error in getSpeedyIndexBalance Worker:", error);
      return new Response(JSON.stringify({ error: "Error communicating with SpeedyIndex API." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }

  export async function onRequestIndexUrls({ request, env }) { // Dedicated function for indexing
    if (request.method !== 'POST') {
      return new Response("Method Not Allowed", { status: 405 });
    }
    const apiKey = env.speedyindex_api_key;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "SpeedyIndex API Key not set in environment variables (server-side)." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
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
      // ... (rest of indexUrlsWithSpeedyIndex logic - adapt to return appropriate JSON response to client) ...
      const data = await response.json(); // Example: return SpeedyIndex API response data back to client
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  
    } catch (error) {
      console.error("Error in indexUrlsWithSpeedyIndex Worker:", error);
      return new Response(JSON.stringify({ error: "Error processing indexing request." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
  }