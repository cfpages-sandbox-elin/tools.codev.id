export async function onRequest({ request, env }) { // Single onRequest function
  const apiKey = env.speedyindex_api_key; // Use lowercase env variable name
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "SpeedyIndex API Key not set in environment variables (server-side)." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  let response;
  if (action === 'get-balance') {
    response = await handleGetBalance(apiKey);
  } else if (action === 'index-urls') {
    response = await handleIndexUrls(request, apiKey);
  } else if (action === 'list-tasks') {
    response = await handleListTasks(apiKey);
  } else if (action === 'get-task-report') { // Renamed action
    response = await handleGetTaskReport(request, apiKey); // New handler
  }
  else {
    response = new Response(JSON.stringify({ error: "Invalid action parameter." }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return response;
}


async function handleGetBalance(apiKey) {
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
    return new Response(JSON.stringify({ balance: data.balance }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Error in handleGetBalance:", error);
    return new Response(JSON.stringify({ error: "Error communicating with SpeedyIndex API." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

async function handleIndexUrls(request, apiKey) {
  if (request.method !== 'POST') {
    return new Response("Method Not Allowed", { status: 405 });
  }
  try {
    const requestData = await request.json();
    const urls = requestData.urls;
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

async function handleListTasks(apiKey) {
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

async function handleGetTaskReport(request, apiKey) { // Renamed and modified function
  if (request.method !== 'POST') {
      return new Response("Method Not Allowed", { status: 405 });
  }
  try {
      const requestData = await request.json();
      const taskId = requestData.task_id; // Expect task_id, not task_ids

      const apiUrl = `https://api.speedyindex.com/v2/task/google/indexer/report`; // Report endpoint

      const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
              'Authorization': apiKey,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ task_id: taskId }) // Send task_id in body
      });

      if (!response.ok) {
        console.error("SpeedyIndex API - Get Task Report failed:", response.status, response.statusText);
        return new Response(JSON.stringify({ error: "Error fetching task report from SpeedyIndex API." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      const data = await response.json();
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
      console.error("Error in handleGetTaskReport:", error);
      return new Response(JSON.stringify({ error: "Error retrieving task report." }), { status: 500, headers: { 'Content-Type': 'application/json' } });
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