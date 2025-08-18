/* moe chat widget */
(() => {
  const SWA_API = '/api/chat';
  const STORAGE_KEY = 'moe_chat_history_v1';

  function loadHistory() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; } }
  function saveHistory(h) { localStorage.setItem(STORAGE_KEY, JSON.stringify(h.slice(-20))); }

  function createUI() {
    const wrap = document.createElement('div');
    wrap.id = 'moe-chat';
    wrap.innerHTML = `
      <button id="moe-chat-toggle" class="btn fab" aria-controls="moe-chat-panel" aria-expanded="false">Ask Moe</button>
      <div id="moe-chat-panel" class="chat hidden" role="dialog" aria-label="Ask Moe Coach">
        <div class="chat-head">
          <div class="chat-title">Moe Coach</div>
          <button id="moe-chat-close" class="btn small" aria-label="Close">×</button>
        </div>
        <div class="chat-body" id="moe-chat-log" aria-live="polite"></div>
        <form class="chat-input-row" id="moe-chat-form">
          <input id="moe-chat-input" type="text" placeholder="Ask about NIR, red light, tones..." aria-label="Message to Moe Coach" autocomplete="off"/>
          <button class="btn" id="moe-chat-send" type="submit">Send</button>
        </form>
        <div class="chat-note small">Educational only — not medical advice.</div>
      </div>
    `;
    document.body.appendChild(wrap);
  }

  function mdEscape(s){ return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

  function appendMsg(el, role, text) {
    const div = document.createElement('div');
    div.className = 'msg ' + (role === 'user' ? 'user' : 'assistant');
    div.innerHTML = `<div class="bubble">${mdEscape(text)}</div>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
  }

  async function streamChat(messages, onDelta) {
    const r = await fetch(SWA_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages })
    });
    if (!r.ok || !r.body) throw new Error('Network error');
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\\n\\n'); buffer = chunks.pop();
      for (const chunk of chunks) {
        const rows = chunk.trim().split('\\n').filter(Boolean);
        for (const row of rows) {
          if (row.startsWith('data:')) {
            const payload = row.slice(5).trim();
            if (payload === '[DONE]') continue;
            try {
              const obj = JSON.parse(payload);
              const delta = obj.choices && obj.choices[0] && (obj.choices[0].delta?.content || obj.choices[0].text || '');
              if (delta) onDelta(delta);
            } catch {}
          }
        }
      }
    }
  }

  function init() {
    createUI();
    const panel = document.getElementById('moe-chat-panel');
    const toggle = document.getElementById('moe-chat-toggle');
    const closeBtn = document.getElementById('moe-chat-close');
    const log = document.getElementById('moe-chat-log');
    const form = document.getElementById('moe-chat-form');
    const input = document.getElementById('moe-chat-input');

    function open() { panel.classList.remove('hidden'); toggle.setAttribute('aria-expanded','true'); input.focus(); }
    function close(){ panel.classList.add('hidden'); toggle.setAttribute('aria-expanded','false'); }
    toggle.addEventListener('click', () => panel.classList.contains('hidden') ? open() : close());
    closeBtn.addEventListener('click', close);

    const history = loadHistory();
    if (history.length === 0) {
      appendMsg(log, 'assistant', 'Hi! Ask me about near‑infrared, red light, or sound tones. (Educational only, not medical advice.)');
    } else {
      history.forEach(m => appendMsg(log, m.role, m.content));
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim(); if (!text) return;
      input.value = '';
      appendMsg(log, 'user', text);
      history.push({ role: 'user', content: text });
      saveHistory(history);

      const div = document.createElement('div');
      div.className = 'msg assistant';
      const bubble = document.createElement('div');
      bubble.className = 'bubble'; bubble.textContent = '...';
      div.appendChild(bubble); log.appendChild(div); log.scrollTop = log.scrollHeight;

      const convo = [
        { role: 'system', content: 'You are Moe Community Wellness Coach. Educational only — not medical advice. Keep answers concise, suggest safe use (distance, time, eye safety), and cite site sections when relevant.' },
        ...history.slice(-10)
      ];

      let accum = '';
      try {
        await streamChat(convo, (delta) => { accum += delta; bubble.textContent = accum; log.scrollTop = log.scrollHeight; });
      } catch (err) { accum = 'Sorry, I had trouble reaching the coach API.'; bubble.textContent = accum; }
      history.push({ role: 'assistant', content: accum });
      saveHistory(history);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
