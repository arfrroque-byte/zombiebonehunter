let actx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicInterval: any = null;

export function initAudio() {
  if (!actx) {
    try {
      actx = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGain = actx.createGain();
      masterGain.gain.value = 0.5;
      const comp = actx.createDynamicsCompressor();
      comp.threshold.value = -18;
      masterGain.connect(comp);
      comp.connect(actx.destination);

      musicGain = actx.createGain();
      musicGain.gain.value = 0.12;
      musicGain.connect(masterGain);
    } catch (e) { actx = null; }
  }
  if (actx && actx.state === 'suspended') actx.resume();
}

export function playProceduralMusic(isPaused: () => boolean, isGameScreen: () => boolean) {
  if (!actx || musicInterval) return;
  let step = 0;
  musicInterval = setInterval(() => {
    if (isPaused() || !isGameScreen()) return;
    if (!actx || !musicGain) return;

    const t0 = actx.currentTime;

    // Bass Drum (Kick)
    const kick = actx.createOscillator(), kg = actx.createGain();
    kick.frequency.setValueAtTime(120, t0);
    kick.frequency.exponentialRampToValueAtTime(40, t0 + 0.15);
    kg.gain.setValueAtTime(0.3, t0);
    kg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
    kick.connect(kg); kg.connect(musicGain);
    kick.start(t0); kick.stop(t0 + 0.15);

    // Dark Synth Bass
    if (step % 2 === 0) {
      const bass = actx.createOscillator(), bg = actx.createGain();
      const notes = [40, 45, 30, 35];
      const freq = notes[Math.floor(step / 4) % notes.length];
      bass.type = 'sawtooth';
      bass.frequency.setValueAtTime(freq, t0);
      bg.gain.setValueAtTime(0.15, t0);
      bg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.4);
      bass.connect(bg); bg.connect(musicGain);
      bass.start(t0); bass.stop(t0 + 0.4);
    }

    step = (step + 1) % 16;
  }, 200);
}

export function stopMusic() {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
}

function noiseBuffer(dur: number) {
  if (!actx) return null;
  const len = Math.floor(actx.sampleRate * dur);
  const buf = actx.createBuffer(1, len, actx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  return buf;
}

export const sfx = {
  shot(weapon: string) {
    if (!actx || !masterGain) return;
    const shotgun = weapon === 'shotgun';
    const t0 = actx.currentTime;

    const src = actx.createBufferSource();
    const buf = noiseBuffer(shotgun ? 0.4 : 0.25);
    if(buf) src.buffer = buf;
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = shotgun ? 1200 : 3000;
    const g = actx.createGain();
    g.gain.setValueAtTime(shotgun ? 0.6 : 0.4, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + (shotgun ? 0.35 : 0.2));
    src.connect(lp); lp.connect(g); g.connect(masterGain); src.start(t0);

    const sub = actx.createOscillator(), subG = actx.createGain();
    sub.frequency.setValueAtTime(shotgun ? 80 : 130, t0);
    sub.frequency.exponentialRampToValueAtTime(30, t0 + 0.15);
    subG.gain.setValueAtTime(0.5, t0);
    subG.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
    sub.connect(subG); subG.connect(masterGain);
    sub.start(t0); sub.stop(t0 + 0.15);

    if (!shotgun) {
      const ring = actx.createOscillator(), rg = actx.createGain();
      ring.type = 'triangle'; ring.frequency.value = 800;
      rg.gain.setValueAtTime(0.05, t0);
      rg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.05);
      ring.connect(rg); rg.connect(masterGain);
      ring.start(t0); ring.stop(t0 + 0.05);
    }
  },
  hit(isCrit = false) {
    if (!actx || !masterGain) return;
    const t0 = actx.currentTime;

    // 1. Crispy Hit-Marker Snap (Filtered Noise Transient)
    const nSrc = actx.createBufferSource();
    const nBuf = noiseBuffer(0.045);
    if (nBuf) nSrc.buffer = nBuf;
    const bp = actx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(isCrit ? 3200 : 2500, t0);
    bp.Q.setValueAtTime(1.8, t0);
    const ng = actx.createGain();
    ng.gain.setValueAtTime(isCrit ? 0.42 : 0.3, t0);
    ng.gain.exponentialRampToValueAtTime(0.001, t0 + 0.04);
    nSrc.connect(bp); bp.connect(ng); ng.connect(masterGain);
    nSrc.start(t0);

    // 2. Meaty Body Thump (Low-Mid Punch)
    const body = actx.createOscillator(), bg = actx.createGain();
    body.type = 'triangle';
    body.frequency.setValueAtTime(isCrit ? 240 : 195, t0);
    body.frequency.exponentialRampToValueAtTime(48, t0 + 0.085);
    bg.gain.setValueAtTime(isCrit ? 0.36 : 0.26, t0);
    bg.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
    body.connect(bg); bg.connect(masterGain);
    body.start(t0); body.stop(t0 + 0.095);

    // 3. Juicy Hitmarker Tick / Crit Ping
    const ping = actx.createOscillator(), pg = actx.createGain();
    ping.type = isCrit ? 'sine' : 'triangle';
    ping.frequency.setValueAtTime(isCrit ? 1850 : 1320, t0);
    ping.frequency.exponentialRampToValueAtTime(isCrit ? 2400 : 880, t0 + (isCrit ? 0.07 : 0.035));
    pg.gain.setValueAtTime(isCrit ? 0.22 : 0.14, t0);
    pg.gain.exponentialRampToValueAtTime(0.001, t0 + (isCrit ? 0.075 : 0.04));
    ping.connect(pg); pg.connect(masterGain);
    ping.start(t0); ping.stop(t0 + (isCrit ? 0.08 : 0.045));
  },
  kill(isBoss = false, combo = 1) {
    if (!actx || !masterGain) return;
    const t0 = actx.currentTime;
    const pitchMul = Math.min(1.45, 1 + (combo - 1) * 0.04);

    // 1. Bone-Crunch Splat Noise
    const nSrc = actx.createBufferSource();
    const nBuf = noiseBuffer(isBoss ? 0.35 : 0.16);
    if (nBuf) nSrc.buffer = nBuf;
    const lp = actx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1600, t0);
    lp.frequency.exponentialRampToValueAtTime(320, t0 + (isBoss ? 0.32 : 0.15));
    const ng = actx.createGain();
    ng.gain.setValueAtTime(isBoss ? 0.5 : 0.34, t0);
    ng.gain.exponentialRampToValueAtTime(0.001, t0 + (isBoss ? 0.34 : 0.15));
    nSrc.connect(lp); lp.connect(ng); ng.connect(masterGain);
    nSrc.start(t0);

    // 2. Deep Sub-Bass Drop
    const sub = actx.createOscillator(), sg = actx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(isBoss ? 180 : 150, t0);
    sub.frequency.exponentialRampToValueAtTime(35, t0 + (isBoss ? 0.28 : 0.14));
    sg.gain.setValueAtTime(isBoss ? 0.5 : 0.35, t0);
    sg.gain.exponentialRampToValueAtTime(0.001, t0 + (isBoss ? 0.3 : 0.15));
    sub.connect(sg); sg.connect(masterGain);
    sub.start(t0); sub.stop(t0 + (isBoss ? 0.31 : 0.16));

    // 3. Satisfying Kill-Confirm Pop Chime (Pitch scales with Combo!)
    [540 * pitchMul, 810 * pitchMul].forEach((freq, i) => {
      if (!actx || !masterGain) return;
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'triangle';
      const start = t0 + i * 0.032;
      o.frequency.setValueAtTime(freq, start);
      o.frequency.exponentialRampToValueAtTime(freq * 1.18, start + 0.08);
      g.gain.setValueAtTime(0.2, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.09);
      o.connect(g); g.connect(masterGain);
      o.start(start); o.stop(start + 0.095);
    });
  },
  pickup() {
    if (!actx || !masterGain) return;
    const t0 = actx.currentTime;
    [620, 860, 1140].forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0.001, t0 + i * 0.04);
      g.gain.exponentialRampToValueAtTime(0.06, t0 + i * 0.04 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.04 + 0.12);
      o.connect(g); g.connect(masterGain); o.start(t0 + i * 0.04); o.stop(t0 + i * 0.04 + 0.14);
    });
  },
  ui() {
    if (!actx || !masterGain) return;
    const t0 = actx.currentTime;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(760, t0);
    o.frequency.exponentialRampToValueAtTime(520, t0 + 0.05);
    g.gain.setValueAtTime(0.001, t0);
    g.gain.exponentialRampToValueAtTime(0.04, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.06);
    o.connect(g); g.connect(masterGain); o.start(t0); o.stop(t0 + 0.07);
  },
  horn() {
    if (!actx || !masterGain) return;
    const t0 = actx.currentTime;
    [110, 148].forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t0 + i * 0.02);
      o.frequency.exponentialRampToValueAtTime(f * 1.6, t0 + i * 0.02 + 0.65);
      g.gain.setValueAtTime(0.001, t0 + i * 0.02);
      g.gain.exponentialRampToValueAtTime(0.08, t0 + i * 0.02 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.02 + 0.7);
      o.connect(g); g.connect(masterGain); o.start(t0 + i * 0.02); o.stop(t0 + i * 0.02 + 0.74);
    });
  },
  hurt() {
    if (!actx || !masterGain) return;
    const t0 = actx.currentTime;
    const src = actx.createBufferSource();
    const buf = noiseBuffer(0.17);
    if(buf) src.buffer = buf;
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    const g = actx.createGain();
    g.gain.setValueAtTime(0.14, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.17);
    src.connect(lp); lp.connect(g); g.connect(masterGain); src.start(t0);
  },
  gameOver() {
    if (!actx || !masterGain) return;
    const t0 = actx.currentTime;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(260, t0);
    o.frequency.exponentialRampToValueAtTime(36, t0 + 1.2);
    g.gain.setValueAtTime(0.001, t0);
    g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 1.24);
    o.connect(g); g.connect(masterGain); o.start(t0); o.stop(t0 + 1.28);
  }
};
