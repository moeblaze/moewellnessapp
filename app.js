
// Year
document.getElementById('year').textContent = new Date().getFullYear();

// ===== Healing Oscillator with Web Audio API =====
let ctx, osc, gain, analyser, viz, vctx, rafId, stopTimerId;
const freq = document.getElementById('freq');
const freqLabel = document.getElementById('freqLabel');
const wave = document.getElementById('wave');
const vol = document.getElementById('vol');
const minutes = document.getElementById('minutes');
viz = document.getElementById('viz');
vctx = viz.getContext('2d');

function setupAudio(){
  if(!ctx){
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    gain = ctx.createGain();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    gain.gain.value = parseFloat(vol.value);
    gain.connect(analyser);
    analyser.connect(ctx.destination);
  }
}

function startTone(){
  setupAudio();
  stopTone();
  osc = ctx.createOscillator();
  osc.type = wave.value;
  osc.frequency.value = parseFloat(freq.value);
  osc.connect(gain);
  osc.start();
  draw();
  const mins = parseInt(minutes.value, 10);
  if(mins > 0){
    clearTimeout(stopTimerId);
    stopTimerId = setTimeout(stopTone, mins*60*1000);
  }
}

function stopTone(){
  if(osc){
    try{ osc.stop(); } catch(e){}
    try{ osc.disconnect(); } catch(e){}
    osc = null;
  }
  cancelAnimationFrame(rafId);
  clearCanvas();
}

function draw(){
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  function loop(){
    rafId = requestAnimationFrame(loop);
    analyser.getByteTimeDomainData(dataArray);
    vctx.fillStyle = '#0d0c0f';
    vctx.fillRect(0,0,viz.width,viz.height);
    // Gold grid
    vctx.strokeStyle='rgba(231,198,92,0.15)';
    vctx.lineWidth=1;
    for(let x=0;x<viz.width;x+=40){vctx.beginPath();vctx.moveTo(x,0);vctx.lineTo(x,viz.height);vctx.stroke();}
    for(let y=0;y<viz.height;y+=40){vctx.beginPath();vctx.moveTo(0,y);vctx.lineTo(viz.width,y);vctx.stroke();}
    // Waveform
    vctx.lineWidth=3;
    vctx.strokeStyle='#E7C65C';
    vctx.beginPath();
    const sliceWidth = viz.width * 1.0 / bufferLength;
    let x=0;
    for(let i=0;i<bufferLength;i++){
      const v = dataArray[i]/128.0;
      const y = v * viz.height/2;
      if(i===0) vctx.moveTo(x,y); else vctx.lineTo(x,y);
      x += sliceWidth;
    }
    vctx.stroke();
  }
  loop();
}
function clearCanvas(){
  vctx.fillStyle = '#0d0c0f';
  vctx.fillRect(0,0,viz.width,viz.height);
}

document.getElementById('play').addEventListener('click', startTone);
document.getElementById('stop').addEventListener('click', stopTone);
vol.addEventListener('input', e=>{ if(gain) gain.gain.value = parseFloat(vol.value); });
wave.addEventListener('change', e=>{ if(osc) { stopTone(); startTone(); } });
freq.addEventListener('input', e=>{
  freqLabel.textContent = freq.value;
  if(osc) osc.frequency.setValueAtTime(parseFloat(freq.value), ctx.currentTime);
});
document.querySelectorAll('.preset').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    freq.value = btn.dataset.f;
    freqLabel.textContent = btn.dataset.f;
    if(osc) { osc.frequency.setValueAtTime(parseFloat(freq.value), ctx.currentTime); }
  });
});

clearCanvas();

// ===== Devices grid (placeholder data) =====
const products = [
  {
    name: "Red/NIR LED Face Mask",
    img: "assets/images/mask.svg",
    wavelengths: "633 nm + 830 nm",
    tags: ["Face", "Skin", "Collagen"],
    price: "$349 (placeholder)",
    link: "#"
  },
  {
    name: "NIR Knee Brace",
    img: "assets/images/knee.svg",
    wavelengths: "660 nm + 850 nm",
    tags: ["Knee", "Joints", "Athletes"],
    price: "$119 (placeholder)",
    link: "#"
  },
  {
    name: "NIR Wrap Belt (Core/Back)",
    img: "assets/images/belt.svg",
    wavelengths: "660 nm + 850 nm",
    tags: ["Waist", "Back", "Muscle"],
    price: "$95 (placeholder)",
    link: "#"
  },
  {
    name: "Athletic Recovery Lamp",
    img: "assets/images/athletic.svg",
    wavelengths: "810 nm + 850 nm",
    tags: ["Recovery", "Gym", "Performance"],
    price: "$—",
    link: "#"
  }
];

const grid = document.getElementById('productGrid');
products.forEach(p => {
  const card = document.createElement('div');
  card.className = 'card product';
  card.innerHTML = `
    <img src="${p.img}" alt="${p.name}"/>
    <div class="name">${p.name}</div>
    <div class="small" style="margin-top:4px">${p.wavelengths}</div>
    <div class="tags">${p.tags.map(t=>`<span class="tag">${t}</span>`).join('')}</div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px">
      <span class="small">${p.price}</span>
      <a class="btn alt" href="${p.link}">Details</a>
    </div>
  `;
  grid.appendChild(card);
});

// ===== Placeholder: OpenAI integration hooks (to be implemented later) =====
/*
async function askAssistant(prompt){
  // TODO: Integrate OpenAI/Vertex when ready
  return "Coming soon…";
}
*/
