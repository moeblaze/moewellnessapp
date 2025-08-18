
module.exports = async function (context, req) {
  if (req.method === 'OPTIONS') {
    context.res = { status: 200, headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }};
    return;
  }
  const endpoint = process.env.AOAI_ENDPOINT;
  const apiKey   = process.env.AOAI_KEY;
  const deployment = (req.query.deployment || (req.body && req.body.deployment)) || "gpt-4o-mini";
  const apiVersion = (req.query["api-version"] || "2024-06-01");

  if (!endpoint || !apiKey) {
    context.res = { status: 500, body: { error: "Missing AOAI_ENDPOINT or AOAI_KEY" } };
    return;
  }
  const messages = (req.body && req.body.messages) || [
    { role: "system", content: "You are Moe Community Wellness Coach. Not medical advice." },
    { role: "user", content: "Hello!" }
  ];
  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify({ stream: true, temperature: 0.2, messages })
    });
    context.res = {
      status: 200,
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Access-Control-Allow-Origin": "*" },
      body: r.body
    };
  } catch (e) {
    context.log.error(e);
    context.res = { status: 500, body: { error: e.message } };
  }
};
