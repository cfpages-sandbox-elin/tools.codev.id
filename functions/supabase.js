export async function onRequest(context) {
    return new Response(JSON.stringify({ 
        supabaseUrl: "https://izkhvitoxppvyssrlavq.supabase.co",
        supabaseKey: context.env.supabase_api_key 
    }), {
        headers: { "Content-Type": "application/json" }
    });
}