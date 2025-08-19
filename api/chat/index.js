
// Azure Function: /api/chat -> Azure OpenAI Chat Completions proxy
// Config via App Settings:
//  - AZURE_OPENAI_ENDPOINT (e.g., https://moebucksfunctionsapp-openai-8538.openai.azure.com/)
//  - AZURE_OPENAI_API_KEY
//  - AZURE_OPENAI_DEPLOYMENT (chat model deployment name, e.g., gpt-4o-mini | gpt-35-turbo)
const API_VERSION = process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";

function cors(res){
  res.headers = Object.assign({}, res.headers||{}, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  return res;
}
module.exports = async function (context, req) {
  if (req.method === "OPTIONS") { context.res = cors({ status: 200 }); return; }

  const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || "https://moebucksfunctionsapp-openai-8538.openai.azure.com/").replace(/\/+$/,"");
  const key = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o-mini";

  if (!key) {
    context.res = cors({ status: 500, body: { error: "Server is not configured (missing AZURE_OPENAI_API_KEY)." } });
    return;
  }
  try {
    const body = req.body || {};
    const user = (body.user || "").toString().slice(0,64) || "moe_client";
    const systemPrompt = (body.system || `You are Moe Wellness' AI Coach. 
Provide short, friendly guidance for using a web audio oscillator for educational sound exploration (no medical claims). 
When appropriate, include a suggested preset in a JSON object with keys:
{ "preset": { "engine":"Single|Binaural|Isochronic", "wave":"sine|triangle|square|sawtooth", "freq": number, "beat": number, "lfoRate": number, "lfoDepth": number, "minutes": number, "fade": number }, "explain": "one-paragraph note" } 
Return normal text first, then the JSON in a fenced code block: \`\`\`json ... \`\`\`.`).slice(0,4000);

    const messages = Array.isArray(body.messages) ? body.messages : [{ role:"user", content: (body.prompt||"Suggest a calm 10‑minute session.") }];

    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${API_VERSION}`;
    const payload = {
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: typeof body.temperature === "number" ? body.temperature : 0.7,
      top_p: 0.95,
      max_tokens: typeof body.max_tokens === "number" ? body.max_tokens : 500,
      user
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type":"application/json", "api-key": key },
      body: JSON.stringify(payload)
    });
    if (!r.ok) {
      const txt = await r.text();
      context.res = cors({ status: r.status, body: { error: "Upstream error", detail: txt.slice(0,4000) } });
      return;
    }
    const data = await r.json();
    const choice = data.choices && data.choices[0];
    const text = choice?.message?.content || "";
    context.res = cors({ status: 200, headers: { "content-type":"application/json" }, body: { text } });
  } catch (e) {
    context.log.error(e);
    context.res = cors({ status: 500, body: { error: e.message } });
  }
}
