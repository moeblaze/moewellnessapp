# Moe Healing Oscillator — Reseller Kit

## What you can do
- Resell the Healing Oscillator under your own brand.
- Set your own price and keep 100% of profits.
- Use included images and copy in your listings.

## What you cannot do
- Do not redistribute source files to create new resellers.
- Do not claim medical treatment or cures (informational wellness tool).

## Quick Start
1) Replace the PayPal client ID and Stripe Payment Link in `payments.config.json`.
2) Upload to your site or sell via your storefront.
3) Optional: make it installable (PWA) — manifest and service worker included.

## Marketing Tips
- Lead with benefits: calm, focus, sleep, wellness routines.
- Bundle with guided meditations or breathwork.
- Offer a 30‑day satisfaction guarantee.


## Value Pack (Oscillator Pro)
- New engines: Single • Binaural • Isochronic
- Waveforms, LFO vibrato/tremolo, layers (up to 3), noise bed
- Timer + fade, session history
- Preset Packs in `/presets` (click buttons on Oscillator to load; works offline if cached)


## Azure OpenAI (AI Coach) Setup

This build includes an Azure Functions endpoint at **/api/chat** that proxies to Azure OpenAI Chat Completions.

Set these **Application Settings** in the Static Web App (Functions):
- `AZURE_OPENAI_ENDPOINT` = your endpoint (e.g., https://moebucksfunctionsapp-openai-8538.openai.azure.com/)
- `AZURE_OPENAI_API_KEY`  = your Azure OpenAI API key
- `AZURE_OPENAI_DEPLOYMENT` = your chat model deployment name (e.g., gpt-4o-mini or gpt-35-turbo)

Optional:
- `AZURE_OPENAI_API_VERSION` = 2024-02-15-preview (default if not set)

**Test locally**: Open `/oscillator.html`, type a goal in **AI Coach**, and click **Ask AI**.
