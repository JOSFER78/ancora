const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  return new Response(JSON.stringify({ hello: "pure-deno" }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
});
