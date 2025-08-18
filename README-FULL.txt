# moecommunitycloud — Full Pack (v9)

**Important: do not upload the zip file to the repo.**  
Unzip locally and commit the folders so GitHub can see `.github/workflows/deploy.yml`.

## Upload steps (GitHub web UI)
1) Download & unzip this pack.
2) In your repo → **Add file → Upload files**.
3) Drag **both** of these to the upload area:
   - the `api` folder
   - the `.github` folder (on Windows you may need to enable "show hidden items").
   If you cannot drag `.github`, create it manually:
   - **Add file → Create new file**
   - File name: `.github/workflows/deploy.yml`
   - Paste the content from `deploy.yml` in this pack.
4) Commit to **main**.

## Required repo secret (pick one method)
- **Preferred:** `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` (paste XML from Azure Function App → Overview → Get publish profile)
- **Or OIDC:** `AZUREAPPSERVICE_CLIENTID_...`, `AZUREAPPSERVICE_TENANTID_...`, `AZUREAPPSERVICE_SUBSCRIPTIONID_...`

## Function App settings
```
AZURE_OPENAI_ENDPOINT = https://<your-ai>.openai.azure.com
AZURE_OPENAI_KEY = <key>
AZURE_OPENAI_DEPLOYMENT = <chat-deployment-name>
ALLOWED_ORIGINS = https://www.moecommunitycloud.com,https://moecommunitycloud.com
```
(optional) `AZURE_EMBEDDINGS_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`, `KEY_VAULT_URL`

## Endpoints
- `GET /api/health`
- `POST /api/chat`
- `POST /api/embeddings`
- `POST /api/picks`
