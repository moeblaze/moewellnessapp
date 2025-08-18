# SWA Fix Pack

You pasted a workflow that failed with:
- "Could not detect any platform"
- "Failed to find a default file ... index.html"

That happens when SWA doesn't know how to build your site and/or can't find `index.html` in the output folder.

## What to do
1) **Delete your old SWA workflow** from `.github/workflows/` (the one that had `api_location: "api"`).
2) Pick ONE of the files in this pack and add it to `.github/workflows/`:
   - `azure-static-web-apps-react-vite.yml` → for Vite/React (output folder `dist`)
   - `azure-static-web-apps-cra.yml` → for Create React App (output folder `build`)
   - `azure-static-web-apps-static.yml` → for a pure static site with an `index.html` (no build)
3) Adjust paths if your app is in a subfolder (e.g., set `app_location: "/web"` and `output_location: "web/dist"`).
4) Make sure `api_location` is **empty** — your API deploys separately via Azure Functions.
5) Commit to `main`.

## Minimal test (optional)
If you need a placeholder page so SWA has something to deploy, upload `web-sample/index.html` to your repo root (or your `app_location`) until your real build is wired.
