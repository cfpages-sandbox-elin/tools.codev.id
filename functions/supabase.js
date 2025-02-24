export async function onRequest(context) {
    return new Response(JSON.stringify({ 
        supabaseUrl: context.env.supabase_url,
        supabaseKey: context.env.supabase_api_key 
    }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin }
    });
}