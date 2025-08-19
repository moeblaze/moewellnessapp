
// Azure Functions HTTP Trigger for AI Coach (Azure OpenAI)
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

  const endpoint   = process.env.AOAI_ENDPOINT;
  const apiKey     = process.env.AOAI_KEY;
  const deployment = process.env.AOAI_DEPLOYMENT;
  const apiVersion = process.env.AOAI_API_VERSION;

  if (!endpoint || !apiKey || !deployment || !apiVersion) {
    context.res = cors({ status: 500, body: { error: "Configure API key in app settings." } });
    return;
  }

  let body = {};
  try { body = req.body || {}; } catch {}
  const userMsg = (body.prompt || "").toString().slice(0, 4000);
  const messages = body.messages && Array.isArray(body.messages) ? body.messages : [
    { role: "system", content: "You are Moe Wellness Coach. Be supportive, educational, and cautious. Do not provide medical advice or claim cures. Encourage safe use of red/NIR light as educational information only." },
    { role: "user", content: userMsg || "Say hello." }
  ];

  const url = `${endpoint.replace(/\/+$/,'')}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify({
        messages,
        temperature: 0.4,
        max_tokens: 500
      })
    });

    if (!r.ok) {
      const txt = await r.text().catch(()=> "");
      context.res = cors({ status: r.status, body: { error: "Upstream error", detail: txt } });
      return;
    }

    const data = await r.json();
    const choice = (data.choices && data.choices[0]) || {};
    const reply = (choice.message && choice.message.content) || "";

    context.res = cors({ status: 200, headers: { "content-type": "application/json" }, body: {
      reply, model: data.model || deployment, usage: data.usage || null
    }});
  } catch (e) {
    context.log.error(e);
    context.res = cors({ status: 500, body: { error: "Request failed", detail: e.message } });
  }
}
