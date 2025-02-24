export async function onRequest(context) {
    const allowedOrigins = ["https://tools.codev.id"];

    const origin = context.request.headers.get("Origin");
    if (!allowedOrigins.includes(origin)) {
        return new Response("Forbidden", { status: 403 });
    }

    return new Response(JSON.stringify({ 
        supabaseUrl: "https://izkhvitoxppvyssrlavq.supabase.co",
        supabaseKey: context.env.supabase_api_key 
    }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin }
    });
}