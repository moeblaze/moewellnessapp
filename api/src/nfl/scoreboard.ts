import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { buildCorsHeaders } from "../utils/cors";
import { toYYYYMMDD, getJSON } from "./shared";

type GameLite = {
  id: string;
  status: string;
  start: string | null;
  season: number | null;
  week: number | null;
  home: { id: string; abbrev: string; name: string; score: number | null };
  away: { id: string; abbrev: string; name: string; score: number | null };
};

function simplifyScoreboard(sb: any): GameLite[] {
  const events = sb?.events ?? [];
  return events.map((e: any) => {
    const comp = e?.competitions?.[0] ?? {};
    const status = comp?.status?.type?.name ?? e?.status?.type?.name ?? "UNKNOWN";
    const start = comp?.date ?? e?.date ?? null;
    const season = e?.season?.year ?? null;
    const week = e?.week?.number ?? null;
    const competitors = comp?.competitors || [];
    const homeObj = competitors.find((c: any) => c?.homeAway === "home") || {};
    const awayObj = competitors.find((c: any) => c?.homeAway === "away") || {};
    function t(o: any) {
      return {
        id: String(o?.team?.id ?? ""),
        abbrev: String(o?.team?.abbreviation ?? ""),
        name: String(o?.team?.displayName ?? o?.team?.name ?? ""),
        score: (o?.score != null ? Number(o.score) : null)
      };
    }
    return {
      id: String(e?.id ?? comp?.id ?? ""),
      status,
      start,
      season,
      week,
      home: t(homeObj),
      away: t(awayObj)
    };
  });
}

app.http("nfl-scoreboard", {
  methods: ["GET","OPTIONS"],
  authLevel: "anonymous",
  route: "nfl/scoreboard",
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    const cors = buildCorsHeaders(req);
    if (req.method === "OPTIONS") return { status: 204, headers: cors };
    try {
      const url = new URL(req.url);
      const dateParam = url.searchParams.get("date");
      const week = url.searchParams.get("week");
      const seasontype = url.searchParams.get("seasontype");
      const season = url.searchParams.get("season");
      let upstream = "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard";
      const params: string[] = [];
      if (dateParam) {
        const ymd = toYYYYMMDD(dateParam);
        if (!ymd) return { status: 400, headers: cors, jsonBody: { error: "Invalid date format. Use YYYYMMDD or YYYY-MM-DD" } };
        params.push(`dates=${ymd}`);
      }
      if (season) params.push(`seasontype=${seasontype || "2"}`);
      if (seasontype) params.push(`seasontype=${seasontype}`);
      if (week) params.push(`week=${week}`);
      if (params.length) upstream += "?" + params.join("&");
      const data = await getJSON<any>(upstream);
      const games = simplifyScoreboard(data);
      return { status: 200, headers: cors, jsonBody: { source: "espn-scoreboard", upstream, count: games.length, games } };
    } catch (e: any) {
      return { status: 502, headers: cors, jsonBody: { error: e?.message || String(e) } };
    }
  }
});