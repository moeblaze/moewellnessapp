/* Moe Oscillator — Value Pack (Single / Binaural / Isochronic) */
let ctx, master, limiter, lfo, lfoGain, noiseNode, noiseGain;
const layers = [];
const MAX_LAYERS = 3;
const $ = (id) => document.getElementById(id);
const now = () => ctx.currentTime;

const Presets = {
  library: [
    { name: "174 Hz (Solfeggio)", engine:"Single", wave:"sine", freq:174, beat:0, lfoRate:0, lfoDepth:0 },
    { name: "285 Hz (Solfeggio)", engine:"Single", wave:"sine", freq:285, beat:0, lfoRate:0, lfoDepth:0 },
    { name: "396 Hz (Solfeggio)", engine:"Single", wave:"sine", freq:396, beat:0, lfoRate:0, lfoDepth:0 },
    { name: "417 Hz (Solfeggio)", engine:"Single", wave:"sine", freq:417, beat:0, lfoRate:0, lfoDepth:0 },
    { name: "432 Hz (A=432)",     engine:"Single", wave:"sine", freq:432, beat:0, lfoRate:0, lfoDepth:0 },
    { name: "528 Hz (Solfeggio)", engine:"Single", wave:"sine", freq:528, beat:0, lfoRate:0, lfoDepth:0 },
    { name: "639 Hz (Solfeggio)", engine:"Single", wave:"sine", freq:639, beat:0, lfoRate:0, lfoDepth:0 },
    { name: "741 Hz (Solfeggio)", engine:"Single", wave:"sine", freq:741, beat:0, lfoRate:0, lfoDepth:0 },
    { name: "852 Hz (Solfeggio)", engine:"Single", wave:"sine", freq:852, beat:0, lfoRate:0, lfoDepth:0 },
    { name: "963 Hz (Solfeggio)", engine:"Single", wave:"sine", freq:963, beat:0, lfoRate:0, lfoDepth:0 },

    { name: "Focus (Alpha 10 Hz)", engine:"Binaural", wave:"sine", freq:220, beat:10, lfoRate:0.2, lfoDepth:0.01 },
    { name: "Calm (Theta 6 Hz)",  engine:"Binaural", wave:"sine", freq:200, beat:6,  lfoRate:0.2, lfoDepth:0.01 },
    { name: "Sleep (Delta 3 Hz)", engine:"Binaural", wave:"sine", freq:120, beat:3,  lfoRate:0.1, lfoDepth:0.02 },
    { name: "Isochronic 7.5 Hz",  engine:"Isochronic", wave:"sine", freq:432, beat:7.5, lfoRate:0, lfoDepth:0 },
  ],
};

const userPresetsKey = "moe_user_presets";
function getUserPresets(){ try{ return JSON.parse(localStorage.getItem(userPresetsKey)||"[]"); }catch{ return []; } }
function setUserPresets(list){ localStorage.setItem(userPresetsKey, JSON.stringify(list)); }

const historyKey = "moe_session_history";
function logSession(entry){
  const list = JSON.parse(localStorage.getItem(historyKey)||"[]");
  list.unshift({ t: new Date().toISOString(), ...entry });
  localStorage.setItem(historyKey, JSON.stringify(list.slice(0,50)));
  renderHistory();
}
function renderHistory(){
  const list = JSON.parse(localStorage.getItem(historyKey)||"[]");
  if(!list.length){ $("history").textContent = "No sessions yet."; return; }
  $("history").innerHTML = list.map(x =>
    `<div>• ${new Date(x.t).toLocaleString()} — ${x.engine} ${x.freq}Hz ${x.beat?`(±${x.beat}Hz)`:''}, ${x.minutes} min</div>`
  ).join("");
}

function ensureContext(){
  if(ctx) return;
  ctx = new (window.AudioContext||window.webkitAudioContext)();

  limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -6; limiter.knee.value = 0; limiter.ratio.value = 10;
  limiter.attack.value = 0.003; limiter.release.value = 0.25;

  master = ctx.createGain(); master.gain.value = parseFloat($("vol").value || "0.12");
  limiter.connect(master).connect(ctx.destination);

  lfo = ctx.createOscillator(); lfo.frequency.value = 0;
  lfoGain = ctx.createGain(); lfoGain.gain.value = 0;
  lfo.connect(lfoGain); lfo.start();
}

function setMasterVolume(val, t=0.01){
  if(!master) return;
  master.gain.cancelScheduledValues(now());
  master.gain.linearRampToValueAtTime(val, now()+t);
}

function createNoise(type){
  const bufferSize = 2 * ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  if(type === "white"){
    for(let i=0;i<bufferSize;i++) data[i] = Math.random()*2-1;
  }else if(type === "pink"){
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for(let i=0;i<bufferSize;i++){
      const white = Math.random()*2-1;
      b0 = 0.99886*b0 + white*0.0555179;
      b1 = 0.99332*b1 + white*0.0750759;
      b2 = 0.96900*b2 + white*0.1538520;
      b3 = 0.86650*b3 + white*0.3104856;
      b4 = 0.55000*b4 + white*0.5329522;
      b5 = -0.7616*b5 - white*0.0168980;
      data[i] = (b0+b1+b2+b3+b4+b5+b6+white*0.5362)*0.11;
      b6 = white*0.115926;
    }
  }else{
    let last=0;
    for(let i=0;i<bufferSize;i++){
      const white = Math.random()*2-1;
      last = (last + 0.02*white) / 1.02;
      data[i] = last*3.5;
    }
  }
  const node = ctx.createBufferSource();
  node.buffer = buffer; node.loop = true;
  return node;
}

function connectNoise(){
  const type = $("noiseType").value;
  const level = parseFloat($("noiseLevel").value||"0");
  if(noiseNode){ try{noiseNode.stop()}catch{}; noiseNode.disconnect(); noiseNode=null; }
  if(noiseGain){ noiseGain.disconnect(); noiseGain=null; }
  if(!type || level<=0) return;
  noiseNode = createNoise(type);
  noiseGain = ctx.createGain(); noiseGain.gain.value = level;
  noiseNode.connect(noiseGain).connect(master);
  noiseNode.start();
}

function createLayer(engine, wave, freq, beat){
  const gain = ctx.createGain(); gain.gain.value = 0;
  let oscL = ctx.createOscillator(); oscL.type = wave; oscL.frequency.value = freq;
  let oscR = null, ampLFO = null;

  if(engine === "Single"){
    oscR = ctx.createOscillator(); oscR.type = wave; oscR.frequency.value = freq;
  } else if(engine === "Binaural"){
    oscR = ctx.createOscillator(); oscR.type = wave; oscR.frequency.value = freq + Math.max(0, beat||0);
  } else if(engine === "Isochronic"){
    oscR = ctx.createOscillator(); oscR.type = wave; oscR.frequency.value = freq;
    ampLFO = ctx.createOscillator(); ampLFO.frequency.value = Math.max(0, beat||0);
    const amp = ctx.createGain(); amp.gain.value = 0.5;
    const ampDepth = ctx.createGain(); ampDepth.gain.value = 0.5;
    ampLFO.connect(ampDepth); ampDepth.connect(amp.gain);
    oscL.connect(amp).connect(gain);
    oscR.connect(amp);
    gain.connect(master);
    ampLFO.start();
    ampLFO._ampNode = amp;
  }

  if(engine !== "Isochronic"){
    const pL = new StereoPannerNode(ctx, { pan: -0.2 });
    const pR = new StereoPannerNode(ctx, { pan:  0.2 });
    oscL.connect(pL).connect(gain);
    oscR.connect(pR).connect(gain);
    gain.connect(master);
  }

  const rate = parseFloat($("lfoRate").value||"0");
  const depth = parseFloat($("lfoDepth").value||"0");
  lfo.frequency.value = rate; lfoGain.gain.value = depth;
  lfoGain.disconnect();
  if(rate>0 && depth>0){
    lfoGain.connect(oscL.frequency);
    if(oscR) lfoGain.connect(oscR.frequency);
  }

  oscL.start(); if(oscR) oscR.start();
  return { oscL, oscR, gain, engine, ampLFO };
}

async function fade(node, target, sec){
  try {
    node.gain.cancelScheduledValues(now());
    node.gain.linearRampToValueAtTime(target, now()+sec);
    await new Promise(r=>setTimeout(r, sec*1000));
  } catch {}
}

function stopAll(fadeSec=0){
  const toStop = layers.splice(0, layers.length);
  const promises = [];
  toStop.forEach(L=>{
    promises.push(fade(L.gain, 0, fadeSec).catch(()=>{}));
    setTimeout(()=>{
      try{ L.oscL.stop(); }catch{}
      try{ L.oscR && L.oscR.stop(); }catch{}
      try{ L.ampLFO && L.ampLFO.stop(); }catch{}
      try{ L.gain.disconnect(); }catch{}
      if(L.ampLFO && L.ampLFO._ampNode){ try{L.ampLFO._ampNode.disconnect();}catch{} }
    }, Math.max(10, fadeSec*1000+20));
  });
  if(noiseNode){ try{noiseNode.stop()}catch{}; noiseNode.disconnect(); noiseNode=null; }
  if(noiseGain){ noiseGain.disconnect(); noiseGain=null; }
  return Promise.all(promises);
}

function currentSettings(){
  return {
    engine: $("engine").value,
    wave: $("wave").value,
    freq: parseFloat($("freq").value),
    beat: parseFloat($("beat").value||"0"),
    lfoRate: parseFloat($("lfoRate").value||"0"),
    lfoDepth: parseFloat($("lfoDepth").value||"0"),
    minutes: parseInt($("minutes").value||"0",10),
    fade: parseFloat($("fade").value||"0"),
  };
}

async function play(){
  ensureContext();
  const p = currentSettings();
  setMasterVolume(parseFloat($("vol").value||"0.12"), 0.01);
  connectNoise();
  if(layers.length >= MAX_LAYERS){ $("status").textContent = `Max ${MAX_LAYERS} layers reached.`; return; }
  const L = createLayer(p.engine, p.wave, p.freq, p.beat);
  layers.push(L);
  const fadeSec = Math.max(0, p.fade);
  L.gain.gain.value = 0; L.gain.connect(master);
  await fade(L.gain, 0.8 / Math.max(1, layers.length), fadeSec);
  $("status").textContent = `Playing ${p.engine} — ${p.freq} Hz ${p.beat?`(±${p.beat} Hz)`:''}`;
  if(p.minutes>0){
    setTimeout(async ()=>{ await stopAll(fadeSec); $("status").textContent = "Stopped (timer)"; }, p.minutes*60*1000);
  }
  logSession({ engine:p.engine, freq:p.freq, beat:p.beat, minutes:p.minutes||0 });
}

$("play").addEventListener("click", play);
$("stop").addEventListener("click", async ()=>{
  const p = currentSettings();
  await stopAll(Math.max(0, p.fade));
  $("status").textContent = "Stopped";
});

$("vol").addEventListener("input", e => setMasterVolume(parseFloat(e.target.value||"0.12"), 0.05));
$("noiseType").addEventListener("change", ()=>{ if(ctx) connectNoise(); });
$("noiseLevel").addEventListener("input", ()=>{ if(ctx) connectNoise(); });

function renderLayers(){
  const el = $("layers"); el.innerHTML = "";
  for(let i=0;i<layers.length;i++){
    const row = document.createElement("div");
    row.className = "card"; row.style.marginTop = "8px";
    row.innerHTML = `
      <div class="small">Layer ${i+1}</div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:6px">
        <label class="small">Vol
          <input type="range" min="0" max="1" step="0.01" value="${layers[i].gain.gain.value}">
        </label>
        <button class="btn" data-kill="${i}">Remove</button>
      </div>`;
    el.appendChild(row);
    const range = row.querySelector("input[type=range]");
    range.addEventListener("input", e=>{
      const v = parseFloat(e.target.value||"0.2");
      layers[i].gain.gain.setTargetAtTime(v, now(), 0.03);
    });
    row.querySelector("[data-kill]").addEventListener("click", async ()=>{
      const fadeSec = Math.max(0, parseFloat($("fade").value||"0"));
      const L = layers.splice(i,1)[0];
      await fade(L.gain, 0, fadeSec);
      try{ L.oscL.stop(); }catch{}
      try{ L.oscR && L.oscR.stop(); }catch{}
      try{ L.ampLFO && L.ampLFO.stop(); }catch{}
      renderLayers();
    });
  }
}
const _obs = new MutationObserver(renderLayers);
_obs.observe($("status"), { childList:true });

$("addLayer").addEventListener("click", play);

function populatePresets(){
  $("preset").innerHTML = Presets.library.map((p,i)=>`<option value="${i}">${p.name}</option>`).join("");
  const mine = getUserPresets();
  $("userPreset").innerHTML = mine.length ? mine.map((p,i)=>`<option value="${i}">${p.name}</option>`).join("") : "<option value=''>—</option>";
}
function applyPreset(p){
  $("engine").value = p.engine; $("wave").value = p.wave;
  $("freq").value = p.freq; $("beat").value = p.beat||0;
  $("lfoRate").value = p.lfoRate||0; $("lfoDepth").value = p.lfoDepth||0;
}
$("loadPreset").addEventListener("click", ()=>{
  const idx = $("preset").value;
  if(idx !== "") applyPreset(Presets.library[parseInt(idx,10)]);
});
$("savePreset").addEventListener("click", ()=>{
  const name = prompt("Preset name?"); if(!name) return;
  const mine = getUserPresets();
  mine.unshift({ name, ...currentSettings() });
  setUserPresets(mine.slice(0,50)); populatePresets();
});
$("deletePreset").addEventListener("click", ()=>{
  const idx = $("userPreset").value; if(idx === "" || idx == null) return;
  const mine = getUserPresets(); mine.splice(parseInt(idx,10),1);
  setUserPresets(mine); populatePresets();
});
$("exportPresets").addEventListener("click", ()=>{
  const mine = getUserPresets();
  const blob = new Blob([JSON.stringify(mine,null,2)], {type:"application/json"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "moe-presets.json"; a.click();
});
$("importPresets").addEventListener("click", ()=> $("importFile").click());
$("importFile").addEventListener("change", async (e)=>{
  const f = e.target.files?.[0]; if(!f) return;
  const text = await f.text();
  try{ const data = JSON.parse(text); if(Array.isArray(data)){ setUserPresets(data); populatePresets(); } }catch{}
});

$("clearHistory").addEventListener("click", ()=>{ localStorage.removeItem("moe_session_history"); renderHistory(); });

// ---- Pack loader (buttons with data-pack="name") ----
async function loadPack(name){
  try{
    const r = await fetch(`presets/${name}.json`);
    if(!r.ok) throw new Error("pack not found");
    const data = await r.json();
    if(Array.isArray(data)){
      const mine = getUserPresets();
      setUserPresets((data || []).concat(mine).slice(0,200));
      populatePresets();
      alert(`Loaded ${data.length} presets from ${name}`);
    }
  }catch(e){ alert("Could not load pack."); }
}
document.querySelectorAll("[data-pack]").forEach(btn => {
  btn.addEventListener("click", ()=> loadPack(btn.getAttribute("data-pack")));
});

// Init UI
populatePresets();
renderHistory();
