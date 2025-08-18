# Moe Community Cloud — Complete Pack (v10)

This pack includes **everything** to get your site and API working with two clean workflows.

## What’s inside
- `.github/workflows/azure-static-web-apps-polite-tree-03e9ee20f.yml` — deploys the static site (root folder). **Does not touch the API.**
- `.github/workflows/deploy.yml` — deploys `/api` to **moebucksfunctionsapp**.
- `/api` — Azure Functions (TypeScript, Node 18) with endpoints:
  - `GET /api/health`
  - `POST /api/chat`
  - `POST /api/embeddings`
  - `POST /api/picks`
  - `GET /api/nfl/scoreboard`
  - `GET /api/nfl/season-events`
- Static site files at repo root: `index.html`, `styles.css`, `script.js`.

## Required repo secrets
- **SWA:** `AZURE_STATIC_WEB_APPS_API_TOKEN_POLITE_TREE_03E9EE20F`
- **Functions (choose one):**
  - `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` (recommended), or
  - OIDC trio: `AZUREAPPSERVICE_CLIENTID_*`, `AZUREAPPSERVICE_TENANTID_*`, `AZUREAPPSERVICE_SUBSCRIPTIONID_*`

## Function App settings (Configuration → Application settings)
Set these (underscores are fine; code also supports Key Vault later):
```
AZURE_OPENAI_ENDPOINT = https://<your-ai>.openai.azure.com
AZURE_OPENAI_KEY = <key>
AZURE_OPENAI_DEPLOYMENT = <chat-deployment-name>
AZURE_OPENAI_API_VERSION = 2024-02-15-preview   # optional
AZURE_EMBEDDINGS_DEPLOYMENT = <emb-deployment>  # optional
ALLOWED_ORIGINS = https://www.moecommunitycloud.com,https://moecommunitycloud.com,https://polite-tree-03e9ee20f.2.azurestaticapps.net
# optional for Key Vault mode:
KEY_VAULT_URL = https://<your-vault>.vault.azure.net
```

## How to use
1. **Delete** any old workflows under `.github/workflows/` to avoid duplicates.
2. Upload this pack’s folders to your repo (root), commit to **main**.
3. Add the required **secrets** above.
4. SWA will deploy the site; the Functions workflow will deploy `/api` when `api/**` changes.
5. In `script.js`, update `API_BASE` if your Function App host differs.

## Test
- Open your site: https://polite-tree-03e9ee20f.2.azurestaticapps.net
- Click **API Health** → shows JSON including where config was loaded from.
- Try **Assistant** → sends to `/api/chat`.
- Try **NFL Scoreboard** → loads today’s games (ESPN public JSON).

*Generated: 2025-08-18T23:28:19.147738Z*
