import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { getConfig } from "../shared/config";
import { buildCorsHeaders } from "../utils/cors";

app.http("health", {
  methods: ["GET","OPTIONS"],
  authLevel: "anonymous",
  route: "health",
  handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
    const cors = buildCorsHeaders(req);
    if (req.method === "OPTIONS") return { status: 204, headers: cors };
    const report: any = { ok: true, env: {}, config: {} };

    report.env = {
      node: process.version,
      key_vault_url_present: !!process.env.KEY_VAULT_URL,
      allowed_origins: process.env.ALLOWED_ORIGINS || null,
      api_versions: {
        chat: process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview",
        embeddings: process.env.AZURE_OPENAI_API_VERSION || "2023-05-15"
      }
    };

    async function probe(name: string, fallbacks: string[]) {
      try {
        const res = await getConfig(name, fallbacks);
        return { present: true, source: res.source };
      } catch (e: any) {
        return { present: false, error: e?.message || String(e) };
      }
    }

    report.config["AZURE-OPENAI-ENDPOINT"] = await probe("AZURE-OPENAI-ENDPOINT", ["AZURE_OPENAI_ENDPOINT"]);
    report.config["AZURE-OPENAI-KEY"] = await probe("AZURE-OPENAI-KEY", ["AZURE_OPENAI_KEY"]);
    report.config["AZURE-OPENAI-DEPLOYMENT"] = await probe("AZURE-OPENAI-DEPLOYMENT", ["AZURE_OPENAI_DEPLOYMENT"]);
    report.config["AZURE-EMBEDDINGS-DEPLOYMENT"] = await probe("AZURE-EMBEDDINGS-DEPLOYMENT", ["AZURE_EMBEDDINGS_DEPLOYMENT"]);

    return { status: 200, headers: cors, jsonBody: report };
  }
});