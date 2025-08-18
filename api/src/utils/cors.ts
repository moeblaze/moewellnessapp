import { HttpRequest } from "@azure/functions";

export function buildCorsHeaders(req: HttpRequest) {
  const allowList = (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  const origin = req.headers.get("origin") || "";
  const allowedOrigin = allowList.includes(origin) ? origin : (allowList[0] || "*");
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type,authorization",
    "Vary": "Origin"
  };
}