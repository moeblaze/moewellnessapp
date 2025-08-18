import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { buildCorsHeaders } from "../utils/cors";

async function handler(request: HttpRequest): Promise<HttpResponseInit> {
  const cors = buildCorsHeaders(request);
  if (request.method === "OPTIONS") return { status: 204, headers: cors };
  try {
    const body = await request.json().catch(() => ({}));
    const { player = "Player", prop = "points", line = 20.5 } = body;
    const reply = `AI lean for ${player} ${prop} at line ${line}: Over (confidence 62%).`;
    return { status: 200, headers: cors, jsonBody: { pick: reply } };
  } catch (err: any) {
    return { status: 500, headers: cors, jsonBody: { error: err?.message || "Server error" } };
  }
}

app.http("picks", { methods: ["POST","OPTIONS"], authLevel: "anonymous", route: "picks", handler });