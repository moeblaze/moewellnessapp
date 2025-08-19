
// AI Coach: Azure Functions HTTP Trigger
function cors(res){ 
  res.headers = Object.assign({}, res.headers||{}, {
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Methods':'POST, OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type'
  });
  return res;
}

module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') { context.res = cors({ status: 200 }); return; }

  const q = (req.query || {});
  let endpoint   = (q.endpoint || (req.body && req.body.endpoint) || process.env.AOAI_ENDPOINT || '').trim();
  const apiKey     = (q.key || (req.body && req.body.key) || process.env.AOAI_KEY || '').trim();
  let deployment = (q.deployment || (req.body && req.body.deployment) || process.env.AOAI_DEPLOYMENT || '').trim();
  let apiVersion = (q.apiVersion || (req.body && req.body.apiVersion) || process.env.AOAI_API_VERSION || '').trim();

  if (!endpoint || !apiKey || !deployment || !apiVersion) {
    context.res = cors({ status: 500, body: { error: "Configure API key in app settings." } });
    return;
  }

  let body = {};
  try { body = req.body || {}; } catch {}

  const userMsg = (body.prompt || "").toString().slice(0, 4000);
  const messages = body.messages && Array.isArray(body.messages) ? body.messages : [
    { role: "system", content: "You are Moe Wellness Coach. Be supportive, educational, and cautious. Do not provide medical advice or claim cures. Encourage safe use of sound tones and red/NIR light as educational information only." },
    { role: "user", content: userMsg || "Say hello." }
  ];

  endpoint = endpoint.replace(/\/+$/,''); 
  const chatUrl = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  const responsesUrl = `${endpoint}/openai/deployments/${deployment}/responses?api-version=${apiVersion}`;
  const preferResponses = /^o\d|^o(1|2|3|4)/i.test(deployment);

  // Helper to pick token param name for chat
  const useMaxOutput = /2024-(1[2-9]|[2-9]\d)|2025-/.test(apiVersion); // 2024-12+ or any 2025-
  const chatPayload = { messages, temperature: 0.4 };
  if (useMaxOutput) chatPayload.max_output_tokens = 500; else chatPayload.max_tokens = 500;

  async function callResponses() {
    const r = await fetch(responsesUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify({ input: messages, temperature: 0.4, max_output_tokens: 500 })
    });
    return r;
  }

  async function callChat() {
    const r = await fetch(chatUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify(chatPayload)
    });
    return r;
  }

  try {
    // Try preferred endpoint first
    let r = preferResponses ? await callResponses() : await callChat();
    if (!r.ok) {
      // If first attempt failed, try the other endpoint
      const alt = preferResponses ? await callChat() : await callResponses();
      if (alt.ok) {
        // Parse alt response
        if (preferResponses) {
          // we tried responses first (failed), now chat ok
          const data = await alt.json();
          const choice = (data.choices && data.choices[0]) || {};
          const reply = (choice.message && choice.message.content) || "";
          context.res = cors({ status: 200, headers: { "content-type": "application/json" }, body: {
            reply, model: data.model || deployment, usage: data.usage || null, via: "chat-fallback"
          }});
          return;
        } else {
          // we tried chat first (failed), now responses ok
          const data = await alt.json();
          const out = (data.output && data.output[0] && (data.output[0].content || data.output_text)) || data.output_text || "";
          context.res = cors({ status: 200, headers: { "content-type": "application/json" }, body: {
            reply: Array.isArray(out) ? (out[0] && out[0].text) : out,
            model: data.model || deployment, usage: data.usage || null, via: "responses-fallback"
          }});
          return;
        }
      }
      // Neither endpoint worked: return full error from first try
      const txt = await r.text().catch(()=> "");
      context.res = cors({ status: r.status, body: { error: "Upstream error", detail: txt, urls: { chat: chatUrl, responses: responsesUrl } } });
      return;
    }

    // First attempt succeeded: parse
    if (preferResponses) {
      const data = await r.json();
      const out = (data.output && data.output[0] && (data.output[0].content || data.output_text)) || data.output_text || "";
      context.res = cors({ status: 200, headers: { "content-type": "application/json" }, body: {
        reply: Array.isArray(out) ? (out[0] && out[0].text) : out,
        model: data.model || deployment, usage: data.usage || null, via: "responses"
      }});
      return;
    } else {
      const data = await r.json();
      const choice = (data.choices && data.choices[0]) || {};
      const reply = (choice.message && choice.message.content) || "";
      context.res = cors({ status: 200, headers: { "content-type": "application/json" }, body: {
        reply, model: data.model || deployment, usage: data.usage || null, via: "chat"
      }});
      return;
    }
  } catch (e) {
    context.log.error(e);
    context.res = cors({ status: 500, body: { error: "Request failed", detail: e.message } });
  }
};
