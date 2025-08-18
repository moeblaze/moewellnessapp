// ---- Configure this to your Function App base ----
const API_BASE = "https://moebucksfunctionsapp.azurewebsites.net"; // change if needed

// Chat
document.getElementById('chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const out = document.getElementById('chat-output');
  out.textContent = 'Thinking...';
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: input.value.trim() }],
        max_tokens: 500,
        temperature: 0.3
      })
    });
    const data = await res.json();
    out.textContent = data.reply || data.error || '(no response)';
  } catch (err) {
    out.textContent = 'Network error.';
  }
});

// Health
document.getElementById('health-load').addEventListener('click', async () => {
  const out = document.getElementById('health-output');
  out.textContent = 'Checking...';
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    out.textContent = 'Network error.';
  }
});

// NFL
document.getElementById('nfl-load').addEventListener('click', loadNFL);
async function loadNFL() {
  const list = document.getElementById('nfl-list');
  list.innerHTML = 'Loading...';
  const date = document.getElementById('nfl-date').value;
  const url = new URL(`${API_BASE}/api/nfl/scoreboard`);
  if (date) url.searchParams.set('date', date);
  try {
    const res = await fetch(url.toString());
    const data = await res.json();
    const games = data.games || [];
    if (!games.length) {
      list.innerHTML = '<p class="meta">No games found for that date.</p>';
      return;
    }
    list.innerHTML = games.map(g => `
      <div class="card">
        <div class="team">${g.away.abbrev} ${g.away.score ?? ''} @ ${g.home.abbrev} ${g.home.score ?? ''}</div>
        <div class="meta">${g.status} • ${g.start ? new Date(g.start).toLocaleString() : ''}</div>
      </div>
    `).join('');
  } catch (e) {
    list.innerHTML = '<p class="meta">Error loading games.</p>';
  }
}

// Default NFL date to today
(function initDate() {
  const input = document.getElementById('nfl-date');
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  input.value = `${y}-${m}-${d}`;
})();
