export async function onRequestGet({ env }) {
  return Response.json({
    status: "ok",
    version: "0.1.0",
    providersConfigured: {
      gemini: Boolean(env.GEMINI_API_KEY),
      openrouter: Boolean(env.OPENROUTER_API_KEY)
    },
    paidCalls: false
  }, { headers: corsHeaders() });
}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type"}}
