/* moe device advisor */
(() => {
  function html(strings, ...vals){ return strings.map((s,i)=>s+(vals[i]??'')).join(''); }

  function injectUI(){
    const div = document.createElement('div');
    div.id = 'moe-advisor';
    div.innerHTML = html`
      <button id="moe-advisor-toggle" class="btn fab secondary" aria-controls="moe-advisor-modal" aria-expanded="false">Find my device</button>
      <div id="moe-advisor-modal" class="modal hidden" role="dialog" aria-label="Device advisor">
        <div class="modal-card">
          <div class="modal-head">
            <div class="modal-title">Find my device</div>
            <button class="btn small" id="moe-advisor-close" aria-label="Close">×</button>
          </div>
          <form id="moe-advisor-form" class="grid grid-2" style="gap:10px">
            <label class="field"><span class="small">Goal</span>
              <select name="area">
                <option value="skin">Skin / Face</option>
                <option value="knee">Knee / Joint</option>
                <option value="back">Back / Core</option>
                <option value="full-body">Full body</option>
                <option value="recovery">Athletic recovery</option>
              </select>
            </label>
            <label class="field"><span class="small">Minimum irradiance (mW/cm²)</span>
              <input type="number" name="min_irr" min="0" step="5" placeholder="e.g., 60"/>
            </label>
            <fieldset class="field" style="grid-column:1/-1">
              <legend class="small">Preferred wavelengths</legend>
              <div class="chips" id="moe-waves"></div>
            </fieldset>
            <fieldset class="field" style="grid-column:1/-1">
              <legend class="small">Tags</legend>
              <div class="chips" id="moe-tags"></div>
            </fieldset>
            <div style="grid-column:1/-1;display:flex;gap:10px;flex-wrap:wrap">
              <button class="btn" type="submit">See recommendations</button>
              <button class="btn alt" id="moe-advisor-reset" type="button">Reset</button>
            </div>
          </form>
          <div id="moe-advisor-results" class="grid grid-2" style="margin-top:12px"></div>
          <div class="small" style="margin-top:8px">Educational only — not medical advice.</div>
        </div>
      </div>
    `;
    document.body.appendChild(div);
  }

  function createChip(label, value){
    const id = 'chip_'+value.replace(/\W+/g,'_');
    return `<label class="chip"><input type="checkbox" value="${value}" id="${id}"/> ${label}</label>`;
  }

  async function loadData(){
    try{
      const r = await fetch('data/products.json', {cache:'no-store'});
      return await r.json();
    }catch(e){ return []; }
  }

  function filterProducts(list, area, minIrr, waves, tags){
    const tagMap = {
      'skin': ['skin','face','collagen'],
      'knee': ['knee','joints'],
      'back': ['back','core','muscle'],
      'full-body': ['home','panels','pro'],
      'recovery': ['recovery','athletes','gym']
    };
    const wantTags = tagMap[area] || [];
    return list.filter(p => {
      const irrOk = !minIrr || (p.irradiance_mW_cm2||0) >= minIrr;
      const waveOk = waves.length ? waves.every(nm => (p.wavelengths||'').includes(nm)) : true;
      const areaOk = wantTags.length ? (p.tags||[]).some(t => wantTags.includes(t)) : true;
      const tagsOk = tags.length ? tags.every(t => (p.tags||[]).includes(t)) : true;
      return irrOk && waveOk && areaOk && tagsOk;
    });
  }

  function renderCards(target, list){
    target.innerHTML = '';
    if (list.length === 0) {
      target.innerHTML = '<div class="notice">No matches — try reducing filters.</div>';
      return;
    }
    list.forEach(p => {
      const card = document.createElement('div');
      card.className = 'card product';
      card.innerHTML = `
        <img src="${p.img}" alt="${p.name}"/>
        <div class="name">${p.name}</div>
        <div class="small" style="margin-top:4px">${p.wavelengths}${p.irradiance_mW_cm2 ? ' • '+p.irradiance_mW_cm2+' mW/cm²' : ''}</div>
        <div class="tags">${(p.tags||[]).map(t=>'<a class="tag" href="tags/view.html?tag='+encodeURIComponent(t)+'">#'+t+'</a>').join(' ')}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
          <span class="small">${p.price||''}</span>
          <a class="btn alt" href="${p.link||'#'}">Details</a>
        </div>
      `;
      target.appendChild(card);
    });
  }

  function init(){
    injectUI();
    const modal = document.getElementById('moe-advisor-modal');
    const toggle = document.getElementById('moe-advisor-toggle');
    const closeBtn = document.getElementById('moe-advisor-close');
    const form = document.getElementById('moe-advisor-form');
    const results = document.getElementById('moe-advisor-results');
    const resetBtn = document.getElementById('moe-advisor-reset');

    function open(){ modal.classList.remove('hidden'); toggle.setAttribute('aria-expanded','true'); }
    function close(){ modal.classList.add('hidden'); toggle.setAttribute('aria-expanded','false'); }
    toggle.addEventListener('click', () => modal.classList.contains('hidden') ? open() : close());
    closeBtn.addEventListener('click', close);

    const wavesDiv = document.getElementById('moe-waves');
    ['630','633','660','810','830','850','1064'].forEach(nm => wavesDiv.insertAdjacentHTML('beforeend', createChip(nm+' nm', nm)));
    const tagsDiv = document.getElementById('moe-tags');
    const defaultTags = ['skin','recovery','knee','back','panels','face','collagen','muscle','athletes','gym','home','pro','core'];
    defaultTags.forEach(t => tagsDiv.insertAdjacentHTML('beforeend', createChip('#'+t, t)));

    let products = [];
    loadData().then(list => products = list);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const area = data.get('area');
      const minIrr = parseFloat(data.get('min_irr') || '0');
      const waves = [...document.querySelectorAll('#moe-waves input:checked')].map(i=>i.value);
      const tags = [...document.querySelectorAll('#moe-tags input:checked')].map(i=>i.value);
      const out = filterProducts(products, area, minIrr, waves, tags);
      renderCards(results, out);
    });
    resetBtn.addEventListener('click', () => {
      form.reset();
      [...document.querySelectorAll('#moe-waves input,#moe-tags input')].forEach(i => i.checked = false);
      results.innerHTML = '';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
