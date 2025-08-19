# Moe Wellness — uploaded site
This repo packages your last best working site for easy GitHub + Azure Static Web Apps deployment.

## Deploy
1. Push to GitHub (branch `main`).
2. In Azure Portal, connect this repo to your Static Web App **or** add secret `AZURE_STATIC_WEB_APS_TOKEN` and let the workflow deploy.
3. Paths: App `/` (no API).

> PWA note: `manifest.json` currently sets `start_url` to `/wellness_nir_site_v1/oscillator.html`. You may update to `/oscillator.html` if desired.
