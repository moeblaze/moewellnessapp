import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { buildCorsHeaders } from "../utils/cors";
import { getJSON } from "./shared";

app.http("nfl-season-events", {
  methods: ["GET","OPTIONS"],
  authLevel: "anonymous",
  route: "nfl/season-events",
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    const cors = buildCorsHeaders(req);
    if (req.method === "OPTIONS") return { status: 204, headers: cors };
    try {
      const url = new URL(req.url);
      const season = url.searchParams.get("season") || String(new Date().getUTCFullYear());
      const type = url.searchParams.get("type") || "2"; // 1=pre,2=reg,3=post
      const limit = url.searchParams.get("limit") || "1000";
      const upstream = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${season}/types/${type}/events?limit=${limit}`;
      const data = await getJSON<any>(upstream);
      return { status: 200, headers: cors, jsonBody: { source: "espn-core", upstream, total: data?.count ?? null, items: data?.items ?? [] } };
    } catch (e: any) {
      return { status: 502, headers: cors, jsonBody: { error: e?.message || String(e) } };
    }
  }
});