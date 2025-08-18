import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { getConfig } from "../shared/config";
import { buildCorsHeaders } from "../utils/cors";

async function handler(request: HttpRequest): Promise<HttpResponseInit> {
  const cors = buildCorsHeaders(request);
  if (request.method === "OPTIONS") return { status: 204, headers: cors };
  try {
    const body = await request.json().catch(() => ({}));
    const messages = body?.messages ?? [{ role: "user", content: "Hello Moe AI" }];
    const temperature = (typeof body?.temperature === "number") ? body.temperature : 0.25;
    const max_tokens = (typeof body?.max_tokens === "number") ? body.max_tokens : 800;

    const endpoint = (await getConfig("AZURE-OPENAI-ENDPOINT", ["AZURE_OPENAI_ENDPOINT"])).value;
    const apiKey = (await getConfig("AZURE-OPENAI-KEY", ["AZURE_OPENAI_KEY"])).value;
    const deployment = (await getConfig("AZURE-OPENAI-DEPLOYMENT", ["AZURE_OPENAI_DEPLOYMENT"])).value;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";
    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify({ messages, temperature, max_tokens })
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return { status: upstream.status, headers: cors, jsonBody: { error: text } };
    }

    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";
    return { status: 200, headers: cors, jsonBody: { reply } };
  } catch (err: any) {
    return { status: 500, headers: cors, jsonBody: { error: err?.message || "Server error" } };
  }
}

app.http("chat", { methods: ["POST","OPTIONS"], authLevel: "anonymous", route: "chat", handler });