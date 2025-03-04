// functions/speedyindex-api.js

export async function onRequest({ request, env }) { // Single onRequest function
  const apiKey = env.speedyindex_api_key; // Use lowercase env variable name
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "SpeedyIndex API Key not set in environment variables (server-side)." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } // Added CORS header here too for error response
    });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action'); // Get 'action' query parameter

  let response;
  if (action === 'get-balance') {
    response = await handleGetBalance(apiKey); // Call separate balance handler
  } else if (action === 'index-urls') {
    response = await handleIndexUrls(request, apiKey); // Call separate index URLs handler
  } else if (action === 'list-tasks') { // New action for listing tasks
    response = await handleListTasks(apiKey); // New handler for listing tasks
  } else if (action === 'get-task-detail') { // New action for getting task detail
    response = await handleGetTaskDetail(request, apiKey); // New handler for getting task detail
  }
  else {
    response = new Response(JSON.stringify({ error: "Invalid action parameter." }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } // Added CORS header here too for invalid action
    });
  }

  // Add CORS headers to all responses
  response.headers.set('Access-Control-Allow-Origin', '*'); // Or your specific domain for better security in production
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type'); // Adjusted headers

  return response;
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
    return new Response(JSON.stringify({ balance: data.balance }), { headers: { 'Content-Type': 'application/json' } }); // Return full balance object in JSON
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
    const taskTitle = `Indexer_Task_${Date.now()}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: taskTitle, urls: urls })
    });
    if (!response.ok) {
      console.error("SpeedyIndex API - Index URLs failed:", response.status, response.statusText);
      return new Response(JSON.stringify({ error: "Error submitting URLs to SpeedyIndex API." }), { status: response.status, headers: { 'Content-Type': 'application/json' } });
    }
    const data = await response.json();
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Error in handleIndexUrls Worker:", error);
    return new Response(JSON.stringify({ error: "Error processing indexing request." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleListTasks(apiKey) { // New function to handle listing tasks
  const apiUrl = 'https://api.speedyindex.com/v2/task/google/indexer/list/0'; // Page 0
  try {
    const response = await fetch(apiUrl, {
        headers: {
            'Authorization': apiKey
        }
    });
    if (!response.ok) {
        console.error("SpeedyIndex API - List Tasks failed:", response.status, response.statusText);
        return new Response(JSON.stringify({ error: "Error fetching task list from SpeedyIndex API." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
    const data = await response.json();
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Error in handleListTasks:", error);
    return new Response(JSON.stringify({ error: "Error retrieving task list." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleGetTaskDetail(request, apiKey) { // New function to handle getting task detail
  if (request.method !== 'POST') {
      return new Response("Method Not Allowed", { status: 405 });
  }
  try {
      const requestData = await request.json();
      const taskIds = requestData.task_ids; // Expect task_ids in request body
      const apiUrl = 'https://api.speedyindex.com/v2/task/google/indexer/status';

      const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
              'Authorization': apiKey,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ task_ids: taskIds })
      });

      if (!response.ok) {
          console.error("SpeedyIndex API - Get Task Detail failed:", response.status, response.statusText);
          return new Response(JSON.stringify({ error: "Error fetching task detail from SpeedyIndex API." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      const data = await response.json();
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
      console.error("Error in handleGetTaskDetail:", error);
      return new Response(JSON.stringify({ error: "Error retrieving task detail." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}


export function onRequestOptions() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*'); // Or your specific domain
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type'); // Adjusted headers
  headers.set('Access-Control-Max-Age', '86400'); // Cache preflight response for 24 hours

  return new Response(null, {
    status: 204, // No Content
    headers: headers
  });
}