import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { getConfig } from "../shared/config";
import { buildCorsHeaders } from "../utils/cors";

async function handler(request: HttpRequest): Promise<HttpResponseInit> {
  const cors = buildCorsHeaders(request);
  if (request.method === "OPTIONS") return { status: 204, headers: cors };
  try {
    const body = await request.json().catch(() => ({}));
    const input = body?.input ?? ["hello world"];

    const endpoint = (await getConfig("AZURE-OPENAI-ENDPOINT", ["AZURE_OPENAI_ENDPOINT"])).value;
    const apiKey = (await getConfig("AZURE-OPENAI-KEY", ["AZURE_OPENAI_KEY"])).value;
    const deployment = (await getConfig("AZURE-EMBEDDINGS-DEPLOYMENT", ["AZURE_EMBEDDINGS_DEPLOYMENT"])).value;

    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2023-05-15";
    const url = `${endpoint}/openai/deployments/${deployment}/embeddings?api-version=${apiVersion}`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify({ input })
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return { status: upstream.status, headers: cors, jsonBody: { error: text } };
    }

    const data = await upstream.json();
    return { status: 200, headers: cors, jsonBody: data };
  } catch (err: any) {
    return { status: 500, headers: cors, jsonBody: { error: err?.message || "Server error" } };
  }
}

app.http("embeddings", { methods: ["POST","OPTIONS"], authLevel: "anonymous", route: "embeddings", handler });