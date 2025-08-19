// Healing Oscillator (standalone product page)
// Year
document.getElementById('year').textContent = new Date().getFullYear();

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
  if(osc) { osc.frequency.setValueAtTime(parseFloat(freq.value), ctx.currentTime); }
});
document.querySelectorAll('.preset').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    freq.value = btn.dataset.f;
    freqLabel.textContent = btn.dataset.f;
    if(osc) { osc.frequency.setValueAtTime(parseFloat(freq.value), ctx.currentTime); }
  });
});

clearCanvas();
