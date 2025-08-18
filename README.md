# moewellnessapp

Static site + Azure Functions proxy for Azure OpenAI.

## Repo layout
- `/` — site (HTML/CSS/JS)
- `/api` — Azure Functions backend (chat proxy at `/api/chat`)
- `.github/workflows/azure-static-web-apps.yml` — CI/CD to Azure Static Web Apps

## Deploy (once)
1. Create GitHub repo **moewellnessapp** and push this code.
2. In Azure Portal, create **Static Web App** (Standard) named **moewellnessapp**, connect to this repo.
   - App location: `/`
   - API location: `api`
   - Output location: `/`
3. In SWA → **Configuration**, set:
   - `AOAI_ENDPOINT` = your Azure OpenAI endpoint
   - `AOAI_KEY` = your Azure OpenAI key

## Use the chat proxy
POST `/api/chat` with:
```json
{ "messages":[
  { "role":"system", "content":"You are Moe Community Wellness Coach. Not medical advice." },
  { "role":"user", "content":"What wavelengths are common for NIR?" }
]}
```

## Notes
- Keep secrets in SWA Configuration (not client-side).
- Add more functions under `/api/*` as needed.
