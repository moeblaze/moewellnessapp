
Moe Wellness — Chat + Advisor Drop‑in Kit
=========================================

Files:
- chat-widget.js   → floating “Ask Moe” chat, streams from /api/chat
- advisor.js       → “Find my device” modal; filters data/products.json client-side
- styles-extra.css → CSS additions for both widgets
- install-snippet.html → copy/paste script tags + CSS instructions

How to install:
1) Copy `chat-widget.js` and `advisor.js` into your site root.
2) Open each page (e.g., index.html, oscillator.html, blog, resources, compare, explore, tags):
   Add **right before `</body>`**:
     <script src="/chat-widget.js"></script>
     <script src="/advisor.js"></script>
3) Open your `styles.css` and append the contents of `styles-extra.css` (at the end is fine).
4) Ensure your Azure Functions proxy is live at `/api/chat` and that SWA app settings include:
   - AOAI_ENDPOINT = https://moebucksfunctionsapp-openai-8538.openai.azure.com/
   - AOAI_KEY = (your Azure OpenAI key)
5) Deploy. You should see:
   - “Ask Moe” button (bottom-right)
   - “Find my device” button (above it)
   - Chat responses streaming; advisor shows product cards based on filters

Notes:
- The chat history persists locally (last ~20 turns) using localStorage.
- The advisor pulls from `/data/products.json`. Update that file to change results.
- Both components inherit your site’s visual style (buttons, cards) and avoid clipping.
