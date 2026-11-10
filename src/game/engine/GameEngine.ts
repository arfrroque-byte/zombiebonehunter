
// @ts-nocheck
import * as THREE from 'three';
import { getCompanionStats, CompanionId } from '../systems/CompanionConfig';

export class GameEngine {
  container: any;
  callbacks: any;
  runState: any;

  constructor(container: any, callbacks: any) {
    this.container = container;
    this.callbacks = callbacks;
  }
  
  startGame() { window.postMessage('startGame', '*'); }
  resumeGame() { window.postMessage('resumeGame', '*'); }
  pauseGame() { window.postMessage('pauseGame', '*'); }
  quitToMenu() { window.postMessage('quitToMenu', '*'); }

  init() {
  const _this = this;
  (window as any).ZombieEngine = _this;
  this.startGame = () => { meta = loadMeta(); startGame(); };
  this.pauseGame = () => { togglePause(true); };
  this.resumeGame = () => { togglePause(false); };
  this.togglePause = () => { togglePause(); };
  this.isPaused = () => paused;
  this.triggerGameOver = () => { gameOver(); };
  this.updateAudioVolumes = () => { meta = loadMeta(); initAudio(); };
  this.quitToMenu = () => { meta = loadMeta(); stopMusic(); disposeCompanion(); screen = 'menu'; run = null; _this.callbacks.onStateChange('menu'); };
  this.getRunStats = () => run;
  this.fireWeapon = () => { touch.fire = true; };
  this.stopFire = () => { touch.fire = false; };
  this.swapWeapon = () => {
    if (!player) return;
    meta = loadMeta();
    const owned = getOwnedWeapons(meta);
    const curIdx = owned.indexOf(player.weapon);
    const nextWep = owned[(curIdx + 1) % owned.length] || 'carbine';
    player.weapon = nextWep;
    meta.equippedWeapon = nextWep;
    saveMeta();
    player.maxAmmo = weapons[player.weapon]?.maxAmmo || 30;
    player.ammo = player.maxAmmo;
    player.reloadCd = 0;
    player.reloadTotal = 0;
    player.minigunSpin = 0;
    updatePlayerWeapon();
    updateHUD();
    sfx.pickup();
  };
  this.throwGrenade = () => {
    if (!player || screen !== 'game' || paused) return;
    meta = loadMeta();
    if (!meta || (meta.grenadesCount || 0) <= 0 || meta.equippedGrenades === false) return;
    meta.grenadesCount = Math.max(0, (meta.grenadesCount || 0) - 1);
    saveMeta();
    try { if (navigator.vibrate) navigator.vibrate(35); } catch (e) {}

    const gMesh = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0x2c4a24, roughness: 0.5, metalness: 0.4 })
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.02, 6, 12),
      new THREE.MeshBasicMaterial({ color: 0xffd86e })
    );
    ring.position.y = 0.18;
    gMesh.add(body);
    gMesh.add(ring);

    const startX = player.root.position.x + Math.sin(player.angle) * 0.6;
    const startZ = player.root.position.z + Math.cos(player.angle) * 0.6;
    gMesh.position.set(startX, 1.35, startZ);
    scene.add(gMesh);

    const throwDist = 7.5;
    const dirX = Math.sin(player.angle);
    const dirZ = Math.cos(player.angle);

    thrownGrenades.push({
      mesh: gMesh,
      vx: dirX * (throwDist / 0.65),
      vy: 5.2,
      vz: dirZ * (throwDist / 0.65),
      timer: 0.65
    });

    sfx.pickup();
    updateHUD();
  };
  this.revivePlayer = () => {
    if (!player || !run) return;
    run.revivedOnce = true;
    player.hp = player.maxHp;
    if (meta?.hasKevlar && meta?.equippedGear === 'kevlar') {
      player.shield = player.maxShield;
    }
    player.hurtTimer = 2.5;
    // Push back and damage nearby zombies on revive
    for (let i = zombies.length - 1; i >= 0; i--) {
      const z = zombies[i];
      const d = dist2(player.root.position.x, player.root.position.z, z.root.position.x, z.root.position.z);
      if (d < 8) {
        if (z.type !== 'boss' && !z.isMiniBoss) {
          killZombie(i);
        } else {
          z.root.position.x += Math.sin(z.root.rotation.y + Math.PI) * 6;
          z.root.position.z += Math.cos(z.root.rotation.y + Math.PI) * 6;
        }
      }
    }
    spawnBurst(player.root.position.x, player.root.position.z, 0x39ff14, 30, 1.5, 6.0);
    screen = 'game';
    paused = false;
    _this.callbacks.onStateChange('game');
    showBanner('SURVIVOR REVIVED!', 'Full HP Restored & Area Cleared');
    updateHUD();
  };
  this.refreshPlayerSkin = () => {
    meta = loadMeta();
    applyPlayerSkin();
    if (player && meta?.equippedWeapon && weapons[meta.equippedWeapon]) {
      player.weapon = meta.equippedWeapon;
      updatePlayerWeapon();
      updateHUD();
    }
  };
  this.reloadWeapon = () => {
    if (!player || screen !== 'game' || paused) return;
    triggerReload();
  };
  this.setJoystick = (nx, ny) => {
    joystick.active = (nx !== 0 || ny !== 0);
    joystick.dx = nx;
    joystick.dy = ny;
    const jKnob = document.getElementById('joystickKnob');
    if (jKnob) {
      if (joystick.active) {
        jKnob.style.transform = `translate(calc(-50% + ${nx * 33}px), calc(-50% + ${ny * 33}px))`;
      } else {
        jKnob.style.transform = 'translate(-50%, -50%)';
      }
    }
  };

'use strict';

if (typeof THREE === 'undefined') {
  document.body.innerHTML = '<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#020911;color:#eafcff;font-family:Segoe UI,Arial,sans-serif;padding:24px;text-align:center">Unable to load the 3D engine. Check your internet connection and reload the page.</div>';
  return;
}

const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const dist2 = (ax, az, bx, bz) => Math.hypot(bx - ax, bz - az);
const TAU = Math.PI * 2;
const IS_TOUCH = matchMedia('(hover:none),(pointer:coarse)').matches || 'ontouchstart' in window;

/* DOM */
const dom = { game: document.getElementById('game') };

/* UI state */
let screen = 'menu'; // menu | game | over
let paused = false;

/* Input */
const keys = {};
const touch = { up: false, down: false, left: false, right: false, fire: false };
const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, nx: 0, ny: 0, down: false, active: false };

/* Persistence */
const STORAGE_KEY = 'neon_deadlands_3d_meta';
const MAX_EQUIPPED_GRENADES = 3; // Maximum grenades the player can carry / have equipped in the pouch
let meta = loadMeta();
const missionDefs = [
  { id: 'kill_100', title: 'Purge 100 Zombies', desc: 'Kill 100 zombies across all runs.', target: 100, reward: 140, key: 'totalKills' },
  { id: 'wave_6', title: 'Reach Wave 6', desc: 'Push any run to wave 6.', target: 6, reward: 170, key: 'bestWave' },
  { id: 'bones_450', title: 'Collector', desc: 'Collect 450 total bones.', target: 450, reward: 180, key: 'totalBonesCollected' },
  { id: 'runner_40', title: 'Runner Hunter', desc: 'Kill 40 Runners.', target: 40, reward: 150, key: 'runnerKills' },
  { id: 'brute_20', title: 'Brute Breaker', desc: 'Kill 20 Brutes.', target: 20, reward: 220, key: 'bruteKills' },
  { id: 'spitter_28', title: 'Acid Cleanup', desc: 'Kill 28 Spitters.', target: 28, reward: 170, key: 'spitterKills' }
];

function loadMeta() {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) {}
  const m = Object.assign({
    bankBones: 289,
    totalBonesCollected: 0,
    bestWave: 1,
    bestScore: 207516,
    totalKills: 40,
    runnerKills: 0,
    bruteKills: 0,
    spitterKills: 0,
    hasAssaultRifle: true,
    hasShotgun: false,
    hasSniper: false,
    hasMinigun: false,
    hasRocket: false,
    hasPlasma: false,
    hasKevlar: false,
    hasGuardDog: false,
    hasDrone: false,
    hasRobot: false,
    hasMedic: false,
    hasSkinCyber: false,
    hasSkinHazmat: false,
    carbineLevel: 1,
    shotgunLevel: 1,
    sniperLevel: 1,
    minigunLevel: 1,
    rocketLevel: 1,
    plasmaLevel: 1,
    kevlarLevel: 1,
    dogLevel: 1,
    droneLevel: 1,
    robotLevel: 1,
    medicLevel: 1,
    equippedWeapon: 'carbine',
    equippedCompanion: 'none',
    equippedGear: 'none',
    equippedSkin: 'default',
    equippedGrenades: true,
    grenadesCount: 3,
    claimed: {},
    sessions: 0
  }, data || {});
  m.hasAssaultRifle = true;
  const validWeapons = ['carbine', 'shotgun', 'sniper', 'minigun', 'rocket'];
  if (!validWeapons.includes(m.equippedWeapon)) m.equippedWeapon = 'carbine';
  if (m.equippedWeapon === 'shotgun' && !m.hasShotgun) m.equippedWeapon = 'carbine';
  if (m.equippedWeapon === 'sniper' && !m.hasSniper) m.equippedWeapon = 'carbine';
  if (m.equippedWeapon === 'minigun' && !m.hasMinigun) m.equippedWeapon = 'carbine';
  if (m.equippedWeapon === 'rocket' && !m.hasRocket) m.equippedWeapon = 'carbine';

  const validCompanions = ['none', 'dog', 'drone', 'robot', 'medic'];
  if (!validCompanions.includes(m.equippedCompanion)) m.equippedCompanion = 'none';
  if (m.equippedCompanion === 'dog' && !m.hasGuardDog) m.equippedCompanion = 'none';
  if (m.equippedCompanion === 'drone' && !m.hasDrone) m.equippedCompanion = 'none';
  if (m.equippedCompanion === 'robot' && !m.hasRobot) m.equippedCompanion = 'none';
  if (m.equippedCompanion === 'medic' && !m.hasMedic) m.equippedCompanion = 'none';
  m.grenadesCount = clamp(Math.floor(Number(m.grenadesCount) || 0), 0, MAX_EQUIPPED_GRENADES);
  return m;
}

function getOwnedWeapons(m = meta): string[] {
  const list = ['carbine'];
  if (m?.hasShotgun) list.push('shotgun');
  if (m?.hasSniper) list.push('sniper');
  if (m?.hasMinigun) list.push('minigun');
  if (m?.hasRocket) list.push('rocket');
  return list;
}

function getWeaponLevel(wepKey: string, m = meta): number {
  if (wepKey === 'shotgun') return clamp(m?.shotgunLevel || 1, 1, 5);
  if (wepKey === 'sniper') return clamp(m?.sniperLevel || 1, 1, 5);
  if (wepKey === 'minigun') return clamp(m?.minigunLevel || 1, 1, 5);
  if (wepKey === 'rocket') return clamp(m?.rocketLevel || 1, 1, 5);
  return clamp(m?.carbineLevel || 1, 1, 5);
}

function getActiveCompanionId(m = meta): CompanionId | 'none' {
  if (m?.equippedCompanion === 'dog' && m?.hasGuardDog) return 'dog';
  if (m?.equippedCompanion === 'drone' && m?.hasDrone) return 'drone';
  if (m?.equippedCompanion === 'robot' && m?.hasRobot) return 'robot';
  if (m?.equippedCompanion === 'medic' && m?.hasMedic) return 'medic';
  return 'none';
}

function getCompanionLevel(id: CompanionId, m = meta): number {
  if (id === 'dog') return clamp(m?.dogLevel || 1, 1, 5);
  if (id === 'drone') return clamp(m?.droneLevel || 1, 1, 5);
  if (id === 'robot') return clamp(m?.robotLevel || 1, 1, 5);
  if (id === 'medic') return clamp(m?.medicLevel || 1, 1, 5);
  return 1;
}
function saveMeta() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(meta)); } catch (e) {}
}
function metaMax(key, v) {
  meta = loadMeta();
  const numV = Number(v);
  if (!Number.isFinite(numV)) return;
  const cur = Number(meta[key]) || 0;
  if (numV > cur) { meta[key] = numV; saveMeta(); }
}
function metaAdd(key, v) {
  meta = loadMeta();
  meta[key] = (meta[key] || 0) + v;
  saveMeta();
}

/* Audio Engine */
let actx = null, masterGain = null, musicGain = null;
let musicInterval = null;
let menuMusicInterval = null;
let menuDroneOsc = null, menuDroneGain = null;
let zombieGroanCd = 0;

function initAudio() {
  if (!actx) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      actx = new AudioCtx({ latencyHint: 'interactive' });
      const comp = actx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-14, actx.currentTime);
      comp.knee.setValueAtTime(24, actx.currentTime);
      comp.ratio.setValueAtTime(6, actx.currentTime);
      comp.attack.setValueAtTime(0.005, actx.currentTime);
      comp.release.setValueAtTime(0.18, actx.currentTime);

      masterGain = actx.createGain();
      const targetMaster = meta?.masterMuted ? 0.0001 : Math.max(0.0001, (meta?.masterVolume ?? 80) / 100 * 0.48);
      masterGain.gain.setValueAtTime(targetMaster, actx.currentTime);
      masterGain.connect(comp);
      comp.connect(actx.destination);

      musicGain = actx.createGain();
      const targetMusic = meta?.musicMuted ? 0.0001 : Math.max(0.0001, (meta?.musicVolume ?? 60) / 100 * 0.22);
      musicGain.gain.setValueAtTime(targetMusic, actx.currentTime);
      musicGain.connect(masterGain);
    } catch (e) { actx = null; }
  }
  if (actx && actx.state === 'suspended') {
    actx.resume().catch(() => {});
  }

  // Smooth volume transitions without step-jump crackling
  if (actx && masterGain) {
    const targetMaster = meta?.masterMuted ? 0.0001 : Math.max(0.0001, (meta?.masterVolume ?? 80) / 100 * 0.48);
    masterGain.gain.setTargetAtTime(targetMaster, actx.currentTime, 0.04);
  }
  if (actx && musicGain) {
    const targetMusic = meta?.musicMuted ? 0.0001 : Math.max(0.0001, (meta?.musicVolume ?? 60) / 100 * 0.22);
    musicGain.gain.setTargetAtTime(targetMusic, actx.currentTime, 0.04);
  }

  playSuspenseBGM();
}

function playSuspenseBGM() {
  if (!actx || meta?.musicMuted || meta?.masterMuted) return;
  if (menuMusicInterval) return;

  const t0 = actx.currentTime;

  // Warm Smooth Sub-Bass Pad Drone (Triangle wave + lowpass to prevent sawtooth buzzing/crackling)
  try {
    menuDroneOsc = actx.createOscillator();
    const filter = actx.createBiquadFilter();
    menuDroneGain = actx.createGain();

    menuDroneOsc.type = 'triangle';
    menuDroneOsc.frequency.setValueAtTime(55, t0); // Deep A1

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(135, t0);
    filter.Q.setValueAtTime(0.7, t0);

    menuDroneGain.gain.setValueAtTime(0.0001, t0);
    menuDroneGain.gain.linearRampToValueAtTime(0.24, t0 + 1.8);

    menuDroneOsc.connect(filter);
    filter.connect(menuDroneGain);
    menuDroneGain.connect(musicGain);
    menuDroneOsc.start(t0);
  } catch (e) {}

  let step = 0;
  menuMusicInterval = setInterval(() => {
    if (!actx || meta?.musicMuted || meta?.masterMuted) {
      stopSuspenseBGM();
      return;
    }
    if (actx.state === 'suspended') {
      actx.resume().catch(() => {});
      return;
    }
    const now = actx.currentTime + 0.015; // Small lookahead prevents buffer underrun clicks

    // Smooth Heartbeat Sub-Pulse (Zero-click attack & release envelope)
    if (step % 8 === 0 || step % 8 === 2) {
      try {
        const hb = actx.createOscillator(), hbg = actx.createGain();
        hb.type = 'sine';
        hb.frequency.setValueAtTime(68, now);
        hb.frequency.exponentialRampToValueAtTime(32, now + 0.22);
        hbg.gain.setValueAtTime(0.0001, now);
        hbg.gain.linearRampToValueAtTime(step % 8 === 0 ? 0.26 : 0.18, now + 0.025);
        hbg.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
        hb.connect(hbg);
        hbg.connect(musicGain);
        hb.start(now);
        hb.stop(now + 0.27);
        hb.onended = () => { try { hb.disconnect(); hbg.disconnect(); } catch (e) {} };
      } catch (e) {}
    }

    // Dark Post-Apocalyptic Minor Synth Pad Notes (Smooth fade-in & fade-out)
    if (step % 4 === 1) {
      try {
        const notes = [220, 233.08, 196.00, 174.61, 164.81]; // A3, Bb3, G3, F3, E3
        const freq = notes[(step >> 2) % notes.length];
        const p = actx.createOscillator(), lp = actx.createBiquadFilter(), pg = actx.createGain();
        p.type = 'sine';
        p.frequency.setValueAtTime(freq, now);
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(620, now);
        pg.gain.setValueAtTime(0.0001, now);
        pg.gain.linearRampToValueAtTime(0.09, now + 0.08);
        pg.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
        p.connect(lp);
        lp.connect(pg);
        pg.connect(musicGain);
        p.start(now);
        p.stop(now + 1.4);
        p.onended = () => { try { p.disconnect(); lp.disconnect(); pg.disconnect(); } catch (e) {} };
      } catch (e) {}
    }

    step = (step + 1) % 16;
  }, 480);
}

function stopSuspenseBGM() {
  if (menuMusicInterval) {
    clearInterval(menuMusicInterval);
    menuMusicInterval = null;
  }
  if (menuDroneOsc && actx) {
    try {
      const now = actx.currentTime;
      if (menuDroneGain) {
        menuDroneGain.gain.setTargetAtTime(0.0001, now, 0.05);
      }
      const oscRef = menuDroneOsc;
      setTimeout(() => {
        try { oscRef.stop(); oscRef.disconnect(); } catch (e) {}
      }, 150);
    } catch (e) {}
    menuDroneOsc = null;
  }
}

function playProceduralMusic() {
  playSuspenseBGM();
}

function stopMusic() {
  stopSuspenseBGM();
}

function noiseBuffer(dur) {
  const len = Math.floor(actx.sampleRate * dur);
  const buf = actx.createBuffer(1, len, actx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  return buf;
}

const sfx = {
  shot(weapon) {
    if (!actx) return;
    const t0 = actx.currentTime;
    const isShotgun = weapon === 'shotgun';
    const isSniper = weapon === 'sniper';
    const isMinigun = weapon === 'minigun';
    const isRocket = weapon === 'rocket';

    // 1. Noise Transient / Blast Layer
    const src = actx.createBufferSource();
    const dur = isRocket ? 0.48 : isShotgun ? 0.38 : isSniper ? 0.32 : isMinigun ? 0.14 : 0.22;
    src.buffer = noiseBuffer(dur);
    const lp = actx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = isRocket ? 950 : isShotgun ? 1250 : isSniper ? 3800 : isMinigun ? 2600 : 3000;
    const g = actx.createGain();
    const peakGain = isRocket ? 0.65 : isShotgun ? 0.58 : isSniper ? 0.55 : isMinigun ? 0.32 : 0.40;
    g.gain.setValueAtTime(peakGain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur * 0.9);
    src.connect(lp); lp.connect(g); g.connect(masterGain); src.start(t0);

    // 2. Sub-bass Punch Layer
    const sub = actx.createOscillator(), subG = actx.createGain();
    const startFreq = isRocket ? 68 : isShotgun ? 82 : isSniper ? 160 : isMinigun ? 145 : 130;
    const subDur = isRocket ? 0.28 : isSniper ? 0.18 : 0.14;
    sub.frequency.setValueAtTime(startFreq, t0);
    sub.frequency.exponentialRampToValueAtTime(28, t0 + subDur);
    subG.gain.setValueAtTime(isRocket ? 0.6 : 0.48, t0);
    subG.gain.exponentialRampToValueAtTime(0.001, t0 + subDur);
    sub.connect(subG); subG.connect(masterGain);
    sub.start(t0); sub.stop(t0 + subDur);

    // 3. Metallic / Supersonic Crack Layer
    if (!isShotgun) {
      const ring = actx.createOscillator(), rg = actx.createGain();
      ring.type = isSniper ? 'sawtooth' : 'triangle';
      ring.frequency.setValueAtTime(isSniper ? 1350 : isRocket ? 420 : 820, t0);
      if (isSniper) ring.frequency.exponentialRampToValueAtTime(340, t0 + 0.08);
      rg.gain.setValueAtTime(isSniper ? 0.12 : 0.05, t0);
      rg.gain.exponentialRampToValueAtTime(0.001, t0 + (isSniper ? 0.08 : 0.05));
      ring.connect(rg); rg.connect(masterGain);
      ring.start(t0); ring.stop(t0 + (isSniper ? 0.08 : 0.05));
    }
  },
  hit(isCrit = false) {
    if (!actx) return;
    const t0 = actx.currentTime;

    // 1. Crispy Hit-Marker Snap (Filtered Noise Transient)
    const nSrc = actx.createBufferSource();
    nSrc.buffer = noiseBuffer(0.045);
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
    if (!actx) return;
    const t0 = actx.currentTime;
    const pitchMul = Math.min(1.45, 1 + (combo - 1) * 0.04);

    // 1. Bone-Crunch Splat Noise
    const nSrc = actx.createBufferSource();
    nSrc.buffer = noiseBuffer(isBoss ? 0.35 : 0.16);
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
    if (!actx) return;
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
    if (!actx) return;
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
  reload() {
    if (!actx) return;
    const t0 = actx.currentTime;
    [400, 750, 920].forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(0.001, t0 + i * 0.08);
      g.gain.exponentialRampToValueAtTime(0.08, t0 + i * 0.08 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.08 + 0.07);
      o.connect(g); g.connect(masterGain); o.start(t0 + i * 0.08); o.stop(t0 + i * 0.08 + 0.08);
    });
  },
  hurt() {
    if (!actx) return;
    const t0 = actx.currentTime;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(140, t0);
    o.frequency.exponentialRampToValueAtTime(45, t0 + 0.2);
    g.gain.setValueAtTime(0.3, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
    o.connect(g); g.connect(masterGain); o.start(t0); o.stop(t0 + 0.22);
  },
  horn() {
    if (!actx) return;
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
  gameOver() {
    if (!actx) return;
    const t0 = actx.currentTime;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(260, t0);
    o.frequency.exponentialRampToValueAtTime(36, t0 + 1.2);
    g.gain.setValueAtTime(0.001, t0);
    g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 1.24);
    o.connect(g); g.connect(masterGain); o.start(t0); o.stop(t0 + 1.28);
  },
  zombieGroan(type = 'walker', sourceZombie: any = null) {
    if (sourceZombie && !sourceZombie.dead) {
      playZombieSpatialGroan(sourceZombie);
      return;
    }
    const nearZ = nearestZombie(MAX_GROAN_HEARING_DIST);
    if (nearZ) {
      playZombieSpatialGroan(nearZ);
    }
  }
};

/* ═════════════════════════════════════════════════════════════════════
   DYNAMIC 3D SPATIAL AUDIO SYSTEM FOR ZOMBIES
   ═════════════════════════════════════════════════════════════════════ */
const MAX_GROAN_HEARING_DIST = 28.0;
const MAX_SIMULTANEOUS_GROANS = 4;
let activeZombieGroans: any[] = [];
let lastZombieGroanTime = 0;

function cleanupGroanRecord(g: any) {
  if (!g) return;
  try {
    if (g.sources) {
      g.sources.forEach((s: any) => {
        try { s.stop?.(); } catch (e) {}
        try { s.disconnect?.(); } catch (e) {}
      });
    }
    if (g.nodes) {
      g.nodes.forEach((n: any) => {
        try { n.disconnect?.(); } catch (e) {}
      });
    }
  } catch (e) {}
  if (g.zombie && g.zombie.activeGroans) {
    const idx = g.zombie.activeGroans.indexOf(g);
    if (idx !== -1) g.zombie.activeGroans.splice(idx, 1);
  }
}

function stopZombieGroan(z: any) {
  if (!z || !z.activeGroans) return;
  for (let i = z.activeGroans.length - 1; i >= 0; i--) {
    const g = z.activeGroans[i];
    cleanupGroanRecord(g);
    const idx = activeZombieGroans.indexOf(g);
    if (idx !== -1) activeZombieGroans.splice(idx, 1);
  }
  z.activeGroans = [];
}

function stopAllZombieGroans() {
  for (let i = activeZombieGroans.length - 1; i >= 0; i--) {
    cleanupGroanRecord(activeZombieGroans[i]);
  }
  activeZombieGroans = [];
}

function playZombieSpatialGroan(z: any) {
  // 1. Integration in SFX Category: Strictly respect masterVolume and masterMuted
  if (!actx || !masterGain || meta?.masterMuted || (meta?.masterVolume ?? 80) <= 0) return;
  if (!player || !player.root || !z || !z.root || z.dead) return;

  const t0 = actx.currentTime + 0.005;

  // 2. 3D Coordinates & Distance Check (Do not play audio beyond max hearing distance)
  const px = player.root.position.x;
  const pz = player.root.position.z;
  const zx = z.root.position.x;
  const zz = z.root.position.z;
  const dx = zx - px;
  const dz = zz - pz;
  const dist = Math.hypot(dx, dz);

  if (dist > MAX_GROAN_HEARING_DIST) return;

  // 3. Concurrency limiter to prevent audio clutter / cacophony
  if (actx.currentTime - lastZombieGroanTime < 0.16) {
    z.groanTimer = rand(0.2, 0.45);
    return;
  }
  if (activeZombieGroans.length >= MAX_SIMULTANEOUS_GROANS) {
    z.groanTimer = rand(0.3, 0.65);
    return;
  }
  lastZombieGroanTime = actx.currentTime;

  // 4. Initial Spatial Positioning:
  // Stereo pan: -1.0 (far left) to +1.0 (far right)
  const initialPan = Math.max(-1, Math.min(1, dx / Math.max(dist, 2.5)));

  // Smooth distance volume attenuation (drops to 0 at max distance)
  const distFactor = Math.max(0, 1 - dist / MAX_GROAN_HEARING_DIST);
  const isHeavy = z.type === 'brute' || z.type === 'boss' || z.type === 'armored';
  const isFast = z.type === 'runner' || z.type === 'spitter' || z.type === 'toxic' || z.type === 'crawler';
  const baseVol = isHeavy ? 0.32 : isFast ? 0.20 : 0.24;

  let initialVol = Math.pow(distFactor, 1.25) * baseVol;
  // Acoustic cue for rear sounds (slightly lower volume behind player)
  if (dz < 0) initialVol *= 0.82;

  // Front/Back Acoustic Lowpass Filter (pinna / head shadow simulation):
  // When in front (dz >= 0): cutoff up to ~4500Hz (crisp, present)
  // When behind (dz < 0): cutoff down to ~1200Hz (muffled, unmistakably behind listener)
  const frontRatio = Math.max(-1, Math.min(1, dz / Math.max(dist, 1.0)));
  const initialCutoff = 1200 + ((frontRatio + 1) / 2) * 3300;

  // 5. Construct Web Audio Nodes
  let pannerNode: any = null;
  if ((actx as any).createStereoPanner) {
    pannerNode = (actx as any).createStereoPanner();
    pannerNode.pan.setValueAtTime(initialPan, t0);
  }

  const distGain = actx.createGain();
  distGain.gain.setValueAtTime(initialVol, t0);

  const frontBackFilter = actx.createBiquadFilter();
  frontBackFilter.type = 'lowpass';
  frontBackFilter.frequency.setValueAtTime(initialCutoff, t0);
  frontBackFilter.Q.setValueAtTime(0.7, t0);

  // Wire spatial processing chain to masterGain (SFX bus)
  if (pannerNode) {
    frontBackFilter.connect(pannerNode);
    pannerNode.connect(distGain);
    distGain.connect(masterGain);
  } else {
    frontBackFilter.connect(distGain);
    distGain.connect(masterGain);
  }

  // 6. Vocal Synthesis with Organic Variations (pitch, duration, formant timbre)
  const baseDur = isHeavy ? 0.68 : isFast ? 0.38 : 0.52;
  const dur = baseDur * rand(0.88, 1.18);
  const pitchMod = (z.groanPitchMod || 1.0) * rand(0.92, 1.08);
  const baseFreq = (isHeavy ? rand(50, 68) : isFast ? rand(112, 145) : rand(75, 102)) * pitchMod;

  // Vocal Cord Formant (Dual detuned oscillators through vocal bandpass filter)
  const o1 = actx.createOscillator();
  const o2 = actx.createOscillator();
  const formant = actx.createBiquadFilter();
  const vg = actx.createGain();

  o1.type = 'sawtooth';
  o2.type = 'triangle';

  o1.frequency.setValueAtTime(baseFreq, t0);
  o1.frequency.linearRampToValueAtTime(baseFreq * rand(1.08, 1.20), t0 + dur * 0.35);
  o1.frequency.exponentialRampToValueAtTime(baseFreq * rand(0.70, 0.82), t0 + dur);

  o2.frequency.setValueAtTime(baseFreq * rand(1.02, 1.05), t0);
  o2.frequency.linearRampToValueAtTime(baseFreq * rand(1.12, 1.25), t0 + dur * 0.35);
  o2.frequency.exponentialRampToValueAtTime(baseFreq * rand(0.68, 0.78), t0 + dur);

  formant.type = 'bandpass';
  const startF = (isHeavy ? 260 : isFast ? 440 : 360) * rand(0.9, 1.15);
  const endF = (isHeavy ? 150 : isFast ? 280 : 220) * rand(0.85, 1.1);
  formant.frequency.setValueAtTime(startF, t0);
  formant.frequency.exponentialRampToValueAtTime(endF, t0 + dur);
  formant.Q.setValueAtTime(rand(2.0, 2.9), t0);

  vg.gain.setValueAtTime(0.0001, t0);
  vg.gain.linearRampToValueAtTime(isHeavy ? 0.35 : 0.22, t0 + rand(0.04, 0.08));
  vg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  o1.connect(formant);
  o2.connect(formant);
  formant.connect(vg);
  vg.connect(frontBackFilter);

  // Raspy Breathing / Snarl Noise Layer
  const nSrc = actx.createBufferSource();
  const nBuf = noiseBuffer(dur);
  if (nBuf) nSrc.buffer = nBuf;
  const nBp = actx.createBiquadFilter();
  nBp.type = 'bandpass';
  nBp.frequency.setValueAtTime((isHeavy ? 520 : 780) * rand(0.9, 1.15), t0);
  nBp.Q.setValueAtTime(1.8, t0);
  const ng = actx.createGain();
  ng.gain.setValueAtTime(0.0001, t0);
  ng.gain.linearRampToValueAtTime(isHeavy ? 0.14 : 0.09, t0 + 0.04);
  ng.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  nSrc.connect(nBp);
  nBp.connect(ng);
  ng.connect(frontBackFilter);

  o1.start(t0); o2.start(t0); nSrc.start(t0);
  o1.stop(t0 + dur + 0.05); o2.stop(t0 + dur + 0.05); nSrc.stop(t0 + dur + 0.05);

  // 7. Register Active Groan for Continuous Real-Time Tracking in 3D Space
  const groanRecord = {
    zombie: z,
    pannerNode,
    distGain,
    frontBackFilter,
    baseVol,
    sources: [o1, o2, nSrc],
    nodes: [formant, vg, nBp, ng, frontBackFilter, pannerNode, distGain].filter(Boolean),
    endTime: t0 + dur + 0.06
  };

  activeZombieGroans.push(groanRecord);
  z.activeGroans = z.activeGroans || [];
  z.activeGroans.push(groanRecord);
}

function updateActiveZombieGroans(dt: number) {
  if (!actx || activeZombieGroans.length === 0) return;
  const now = actx.currentTime;

  for (let i = activeZombieGroans.length - 1; i >= 0; i--) {
    const g = activeZombieGroans[i];
    const z = g.zombie;

    // Check if audio finished, or zombie died / was removed
    if (!z || z.dead || !z.root || now >= g.endTime) {
      cleanupGroanRecord(g);
      activeZombieGroans.splice(i, 1);
      continue;
    }

    // Follow moving zombie in real-time coordinates:
    const dx = z.root.position.x - player.root.position.x;
    const dz = z.root.position.z - player.root.position.z;
    const dist = Math.hypot(dx, dz);

    // Update real-time stereo pan
    if (g.pannerNode) {
      const pan = Math.max(-1, Math.min(1, dx / Math.max(dist, 2.5)));
      g.pannerNode.pan.setTargetAtTime(pan, now, 0.04);
    }

    // Update real-time distance volume
    const distFactor = Math.max(0, 1 - dist / MAX_GROAN_HEARING_DIST);
    let vol = Math.pow(distFactor, 1.25) * g.baseVol;
    if (dz < 0) vol *= 0.82;
    g.distGain.gain.setTargetAtTime(vol, now, 0.04);

    // Update real-time front/back acoustic filtering
    const frontRatio = Math.max(-1, Math.min(1, dz / Math.max(dist, 1.0)));
    const cutoff = 1200 + ((frontRatio + 1) / 2) * 3300;
    g.frontBackFilter.frequency.setTargetAtTime(cutoff, now, 0.04);
  }
}

/* 3D scene */
let scene, camera, renderer, clock, raycaster, groundPlane;
let player = null;
let chunks = new Map();
let activeChunkKeys = [];
let activeObstacles = [];
let zombies = [], bullets = [], enemyBullets = [], particles = [], pickups = [], thrownGrenades = [], shockwaves = [];
let toxicPools = [], dyingZombies = [];
let muzzleLight = null;
let playerAuraLight = null;
let flashlight = null, flashlightTarget = null, flashlightCone = null;
let menuPivot = null;
let stars = null;
let aimPoint = new THREE.Vector3(0, 0, 10);
let pointerRayPoint = new THREE.Vector3();
const _screenProjVec = new THREE.Vector3();
let shake = 0, screenFlash = 0;
let hurtVignette = 0, hurtVignetteEl = null; // red edge vignette shown when the player takes damage
let hitStopTimer = 0;
let run = null;

/* Companion state (Phase 7: Dog, Drone, Robot, Medic) */
let companion = null;
let companionPushList = [];
const _compTmpVec = new THREE.Vector3();
let _compLaserMat = null;
let _compRingGeo = null;
let _compBubbleGeo = null;
const COMPANION_AI_TICK = 0.12; // 8 Hz AI / targeting evaluation

const CHUNK_SIZE = 52;
const VIEW_RADIUS = 2;
const PLAYER_RADIUS = 0.65;
const PLAYER_SPEED = 7.5;
const FLASHLIGHT_DISTANCE = 65;
const FLASHLIGHT_ANGLE = Math.PI / 4.2;

const weapons: Record<string, any> = {
  carbine: { name: 'Assault Rifle',   slot: 'PRIMARY', fireRate: 0.12,  damage: 22,  spread: 0.030,  speed: 40, pellets: 1, range: 45, maxAmmo: 30, reloadTime: 2.0, recoil: 1.00 },
  shotgun: { name: 'Heavy Shotgun',   slot: 'PRIMARY', fireRate: 0.50,  damage: 17,  spread: 0.0875, speed: 33, pellets: 6, range: 25, maxAmmo: 6,  reloadTime: 2.0, recoil: 1.55, falloffStart: 10 },
  sniper:  { name: 'Sniper Rifle',    slot: 'PRIMARY', fireRate: 0.68,  damage: 135, spread: 0.004,  speed: 62, pellets: 1, range: 62, maxAmmo: 1,  reloadTime: 1.0, recoil: 1.65, critBonus: 0.40, pierce: 1 },
  minigun: { name: 'Minigun',         slot: 'PRIMARY', fireRate: 0.116, damage: 14,  spread: 0.068,  speed: 42, pellets: 1, range: 40, maxAmmo: 50, reloadTime: 3.0, recoil: 0.82, spinUpTime: 0.55 },
  rocket:  { name: 'Rocket Launcher', slot: 'PRIMARY', fireRate: 0.92,  damage: 165, spread: 0.012,  speed: 25, pellets: 1, range: 46, maxAmmo: 1,  reloadTime: 2.2, recoil: 1.85, explosionRadius: 1.4 }
};
const zombieTypes: Record<string, any> = {
  walker:  { hp: 60,  speed: 2.65, damage: 10, reward: 3,  score: 36,  scale: 1.00, hit: PLAYER_RADIUS, atkRange: 1.65, atkCd: 0.70, detectRange: 48, armorResist: 0.00, headshotMult: 1.75, animSpeed: 5.3, deathTime: 0.36 },
  runner:  { hp: 40,  speed: 4.45, damage: 8,  reward: 3,  score: 46,  scale: 0.88, hit: PLAYER_RADIUS, atkRange: 1.50, atkCd: 0.45, detectRange: 52, armorResist: 0.00, headshotMult: 1.75, animSpeed: 8.8, deathTime: 0.30 },
  armored: { hp: 125, speed: 2.15, damage: 14, reward: 6,  score: 82,  scale: 1.08, hit: PLAYER_RADIUS, atkRange: 1.70, atkCd: 0.80, detectRange: 46, armorResist: 0.55, headshotMult: 2.10, animSpeed: 4.6, deathTime: 0.42 },
  brute:   { hp: 220, speed: 2.05, damage: 24, reward: 9,  score: 115, scale: 2.10, hit: 1.35,          atkRange: 2.30, atkCd: 1.05, detectRange: 50, armorResist: 0.15, headshotMult: 1.60, animSpeed: 4.4, deathTime: 0.50, smashRadius: 4.2, smashDamage: 28, smashWindup: 0.65, smashCd: 5.5 },
  toxic:   { hp: 65,  speed: 2.45, damage: 10, reward: 5,  score: 72,  scale: 0.94, hit: PLAYER_RADIUS, atkRange: 1.65, atkCd: 0.75, detectRange: 48, armorResist: 0.00, headshotMult: 1.75, animSpeed: 5.1, deathTime: 0.35, poolRadius: 2.1, poolDuration: 4.5, poolDmg: 5, poolInterval: 0.6, explodeRadius: 3.2, explodeDmg: 16 },
  crawler: { hp: 28,  speed: 3.45, damage: 7,  reward: 2,  score: 42,  scale: 0.72, hit: PLAYER_RADIUS, atkRange: 1.35, atkCd: 0.55, detectRange: 45, armorResist: 0.00, headshotMult: 1.85, animSpeed: 7.4, deathTime: 0.30, pounceRange: 3.6, pounceSpeedMult: 1.85 },
  spitter: { hp: 65,  speed: 2.45, damage: 10, reward: 5,  score: 72,  scale: 0.94, hit: PLAYER_RADIUS, atkRange: 1.65, atkCd: 0.75, detectRange: 48, armorResist: 0.00, headshotMult: 1.75, animSpeed: 5.1, deathTime: 0.35, poolRadius: 2.1, poolDuration: 4.5, poolDmg: 5, poolInterval: 0.6, explodeRadius: 3.2, explodeDmg: 16 },
  boss:    { hp: 850, speed: 2.10, damage: 35, reward: 50, score: 650, scale: 2.45, hit: 1.75,          atkRange: 2.75, atkCd: 0.85, detectRange: 65, armorResist: 0.10, headshotMult: 1.50, animSpeed: 4.2, deathTime: 0.60 }
};

/* Shared geometry/material helpers */
const particleGeo = new THREE.SphereGeometry(0.06, 6, 6);
const bulletGeo = new THREE.BoxGeometry(0.06, 0.06, 1.4); // Tracer comprido
const sniperBulletGeo = new THREE.BoxGeometry(0.07, 0.07, 2.2);
const rocketProjGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.55, 8);
rocketProjGeo.rotateX(Math.PI / 2);
const bulletMats: Record<string, any> = {
  carbine: new THREE.MeshBasicMaterial({ color: 0xfff066, transparent: true, opacity: 0.92 }),
  shotgun: new THREE.MeshBasicMaterial({ color: 0xffb74d, transparent: true, opacity: 0.92 }),
  sniper:  new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.96 }),
  minigun: new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.92 }),
  rocket:  new THREE.MeshBasicMaterial({ color: 0xff5722, transparent: true, opacity: 0.98 })
};
const enemyBulletGeo = new THREE.SphereGeometry(0.14, 10, 10);
const circleShadowGeo = new THREE.CircleGeometry(0.38, 18);
const toxicPoolGeo = new THREE.CircleGeometry(1.0, 20);
const smashWarnRingGeo = new THREE.RingGeometry(0.82, 1.0, 24);
const smashWarnMat = new THREE.MeshBasicMaterial({ color: 0xff2222, transparent: true, opacity: 0.65, side: THREE.DoubleSide, depthWrite: false });
const bossAuraRingGeo = new THREE.RingGeometry(0.66, 0.80, 24);
const bossAuraMats: Record<string, any> = {
  mini:    new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.52, side: THREE.DoubleSide, depthWrite: false }),
  brute:   new THREE.MeshBasicMaterial({ color: 0xff2244, transparent: true, opacity: 0.58, side: THREE.DoubleSide, depthWrite: false }),
  toxic:   new THREE.MeshBasicMaterial({ color: 0x39ff14, transparent: true, opacity: 0.58, side: THREE.DoubleSide, depthWrite: false }),
  armored: new THREE.MeshBasicMaterial({ color: 0x38b6ff, transparent: true, opacity: 0.58, side: THREE.DoubleSide, depthWrite: false }),
  mutated: new THREE.MeshBasicMaterial({ color: 0xc724ff, transparent: true, opacity: 0.58, side: THREE.DoubleSide, depthWrite: false })
};
const shockwaveGeo = new THREE.RingGeometry(0.82, 1.0, 24);
shockwaveGeo.rotateX(-Math.PI / 2);
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false });
const boneMat = new THREE.MeshLambertMaterial({ color: 0xf7f0dd, emissive: 0x473f22 });
const medMat = new THREE.MeshLambertMaterial({ color: 0x15bf77, emissive: 0x003c21 });
const medWhite = new THREE.MeshBasicMaterial({ color: 0xffffff });
const rockMat = new THREE.MeshStandardMaterial({ color: 0x536169, roughness: 1 });
const graveMat = new THREE.MeshStandardMaterial({ color: 0x798892, roughness: 1 });
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4b3424, roughness: 1 });
const leavesMat = new THREE.MeshLambertMaterial({ color: 0x203a23 });
const deadTrunkMat = new THREE.MeshStandardMaterial({ color: 0x5b4331, roughness: 1 });
const wreckMat = new THREE.MeshStandardMaterial({ color: 0x3e4e5f, roughness: 0.82, metalness: 0.28 });
const carMats = [
  wreckMat,
  new THREE.MeshStandardMaterial({ color: 0x5c2323, roughness: 0.78, metalness: 0.3 }),
  new THREE.MeshStandardMaterial({ color: 0x283c52, roughness: 0.78, metalness: 0.3 }),
  new THREE.MeshStandardMaterial({ color: 0x384531, roughness: 0.85, metalness: 0.25 }),
  new THREE.MeshStandardMaterial({ color: 0x6b5826, roughness: 0.82, metalness: 0.28 }),
  new THREE.MeshStandardMaterial({ color: 0x2b2d30, roughness: 0.80, metalness: 0.35 })
];
const grassMat1 = new THREE.MeshLambertMaterial({ color: 0x1e4b24 });
const grassMat2 = new THREE.MeshLambertMaterial({ color: 0x2d6632 });
const grassMat3 = new THREE.MeshLambertMaterial({ color: 0x16381b });
const grassBladeGeo1 = new THREE.ConeGeometry(0.08, 0.45, 4);
const grassBladeGeo2 = new THREE.ConeGeometry(0.09, 0.62, 4);
const grassBladeGeo3 = new THREE.ConeGeometry(0.07, 0.34, 4);
function makeFacadeTexture(baseHex, brickHex) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = baseHex;
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = brickHex;
  for (let y = 0; y < 256; y += 16) {
    const offset = (y / 16) % 2 === 0 ? 0 : 16;
    for (let x = -16; x < 256; x += 32) {
      g.fillRect(x + offset + 1, y + 1, 29, 13);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.encoding = THREE.sRGBEncoding;
  return tex;
}

const houseWallMat = new THREE.MeshStandardMaterial({ map: makeFacadeTexture('#343b42', '#475058'), roughness: 0.92 });
const houseWallDarkMat = new THREE.MeshStandardMaterial({ map: makeFacadeTexture('#22282d', '#313940'), roughness: 0.94 });
const houseWallBrickMat = new THREE.MeshStandardMaterial({ map: makeFacadeTexture('#36221e', '#52342e'), roughness: 0.92 });
const houseRoofMat = new THREE.MeshStandardMaterial({ map: makeFacadeTexture('#1a1412', '#29201c'), roughness: 0.90 });
const plankMat = new THREE.MeshStandardMaterial({ color: 0x5c4228, roughness: 0.95 });
const winGlowMat = new THREE.MeshBasicMaterial({ color: 0xffaa44, transparent: true, opacity: 0.42 });
const lampMetalMat = new THREE.MeshStandardMaterial({ color: 0x2a3238, roughness: 0.6, metalness: 0.5 });
const lampBulbMat = new THREE.MeshBasicMaterial({ color: 0xffe082 });
const barrelToxicMat = new THREE.MeshStandardMaterial({ color: 0x2d4c2b, roughness: 0.6, metalness: 0.4, emissive: 0x1b5e20, emissiveIntensity: 0.5 });

function initScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x010305);
  scene.fog = new THREE.FogExp2(0x010305, 0.030);

  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 18, -16);

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  dom.game.appendChild(renderer.domElement);

  clock = new THREE.Clock();
  raycaster = new THREE.Raycaster();
  groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  // Darkened ambient lighting: the flashlight is now essential to see the world
  scene.add(new THREE.HemisphereLight(0x4a6a96, 0x040806, 0.09));
  const moon = new THREE.DirectionalLight(0x6c8fc4, 0.20);
  moon.position.set(32, 60, -28);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.camera.left = -50;
  moon.shadow.camera.right = 50;
  moon.shadow.camera.top = 50;
  moon.shadow.camera.bottom = -50;
  moon.shadow.camera.far = 140;
  moon.shadow.bias = -0.0015;
  scene.add(moon);

  const moonSphere = new THREE.Mesh(
    new THREE.SphereGeometry(7, 20, 20),
    new THREE.MeshBasicMaterial({ color: 0xe9f5ff, fog: false })
  );
  moonSphere.position.set(-90, 90, -170);
  scene.add(moonSphere);

  const starPositions = [];
  for (let i = 0; i < 420; i++) {
    const a = Math.random() * TAU;
    const d = rand(60, 220);
    starPositions.push(Math.cos(a) * d, rand(18, 150), Math.sin(a) * d);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xd6ecff, size: 0.6, transparent: true, opacity: 0.85, fog: false }));
  scene.add(stars);

  // Pure White Flashlight SpotLight (only light emitted onto the world, no 3D cone mesh)
  flashlight = new THREE.SpotLight(0xffffff, 9.6, FLASHLIGHT_DISTANCE, FLASHLIGHT_ANGLE, 0.48, 1.0);
  flashlight.castShadow = false;
  flashlightTarget = new THREE.Object3D();
  scene.add(flashlight);
  scene.add(flashlightTarget);
  flashlight.target = flashlightTarget;
  flashlightCone = null;

  playerAuraLight = new THREE.PointLight(0xffffff, 0.55, 6);
  scene.add(playerAuraLight);

  muzzleLight = new THREE.PointLight(0xfff4d6, 0, 10);
  scene.add(muzzleLight);

  menuPivot = new THREE.Object3D();
  scene.add(menuPivot);

  createPlayer();
  refreshChunks();
  updateFlashlight();

  // Damage feedback overlay (red edge vignette), driven by hurtVignette in animate()
  hurtVignetteEl = document.createElement('div');
  hurtVignetteEl.className = 'zbh-hurt-vignette';
  hurtVignetteEl.style.opacity = '0';
  document.body.appendChild(hurtVignetteEl);

  window.addEventListener('resize', onResize);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/* Procedural helpers */
const seed = 93117;
function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 17.31) * 43758.5453;
  return s - Math.floor(s);
}
function noise2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const a = hash2(ix, iy), b = hash2(ix + 1, iy), c = hash2(ix, iy + 1), d = hash2(ix + 1, iy + 1);
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}
function fbm(x, y) {
  let v = 0, a = 0.5, f = 0.02;
  for (let i = 0; i < 4; i++) {
    v += noise2(x * f, y * f) * a;
    f *= 2; a *= 0.5;
  }
  return v;
}
function seeded(cx, cz) {
  let s = (((cx * 73856093) ^ (cz * 19349663) ^ (seed * 83492791)) >>> 0) || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
function chunkKey(cx, cz) { return cx + ',' + cz; }

function makeGroundTexture(cx, cz) {
  const RES = 512;
  const c = document.createElement('canvas');
  c.width = c.height = RES;
  const g = c.getContext('2d');
  const rng = seeded(cx, cz);

  // High-resolution nocturnal grass & overgrown soil
  const step = 8;
  for (let y = 0; y < RES; y += step) {
    for (let x = 0; x < RES; x += step) {
      const wx = cx * CHUNK_SIZE + x * (CHUNK_SIZE / RES);
      const wz = cz * CHUNK_SIZE + y * (CHUNK_SIZE / RES);
      const n = fbm(wx + 90, wz - 40);
      const m = fbm(wx - 300, wz + 700);
      let r = 20, gr = 44, b = 24;
      if (n < 0.35) { r = 26; gr = 56; b = 29; }
      else if (n < 0.60) { r = 22; gr = 47; b = 25; }
      else if (n < 0.78) { r = 17; gr = 37; b = 20; }
      else { r = 19; gr = 31; b = 19; }
      const dust = (m - 0.5) * 22;
      g.fillStyle = `rgb(${clamp((r + dust) | 0, 0, 255)},${clamp((gr + dust) | 0, 0, 255)},${clamp((b + dust) | 0, 0, 255)})`;
      g.fillRect(x, y, step, step);
    }
  }

  // Fine high-res grass blade strokes across the lawn
  g.globalAlpha = 0.24;
  for (let i = 0; i < 4200; i++) {
    g.fillStyle = rng() > 0.32 ? '#4ca85b' : '#102414';
    const gx = rng() * RES;
    const gy = rng() * RES;
    g.fillRect(gx, gy, 1.5, 3.5);
  }
  g.globalAlpha = 1;

  // High-Resolution Suburban Road Network (Asphalt + Concrete Sidewalk Tiles + Curbs + Markings)
  const roadCenter = RES / 2; // 256
  const roadHalf = 48;        // 96px wide asphalt
  const sidewalkHalf = 62;    // 14px sidewalk on each side

  // Concrete sidewalks with expansion joint grid lines
  g.fillStyle = '#3b4248';
  g.fillRect(0, roadCenter - sidewalkHalf, RES, sidewalkHalf * 2);
  g.fillRect(roadCenter - sidewalkHalf, 0, sidewalkHalf * 2, RES);

  // Sidewalk concrete tile joints
  g.strokeStyle = 'rgba(18, 22, 26, 0.45)';
  g.lineWidth = 1;
  for (let t = 0; t < RES; t += 16) {
    g.beginPath();
    g.moveTo(t, roadCenter - sidewalkHalf);
    g.lineTo(t, roadCenter + sidewalkHalf);
    g.moveTo(roadCenter - sidewalkHalf, t);
    g.lineTo(roadCenter + sidewalkHalf, t);
    g.stroke();
  }

  // Curb edge highlight
  g.fillStyle = '#525b63';
  g.fillRect(0, roadCenter - roadHalf - 2, RES, roadHalf * 2 + 4);
  g.fillRect(roadCenter - roadHalf - 2, 0, roadHalf * 2 + 4, RES);

  // Dark weathered asphalt road
  g.fillStyle = '#171b1f';
  g.fillRect(0, roadCenter - roadHalf, RES, roadHalf * 2);
  g.fillRect(roadCenter - roadHalf, 0, roadHalf * 2, RES);

  // Fine asphalt aggregate grain
  g.globalAlpha = 0.22;
  for (let i = 0; i < 1800; i++) {
    const rx = rng() * RES;
    const ry = roadCenter - roadHalf + rng() * (roadHalf * 2);
    g.fillStyle = rng() > 0.5 ? '#2d343b' : '#0b0e11';
    if (rng() > 0.5) g.fillRect(rx, ry, 2, 2);
    else g.fillRect(ry, rx, 2, 2);
  }
  g.globalAlpha = 1;

  // Crisp outer white road shoulder lines
  g.fillStyle = 'rgba(190, 200, 210, 0.42)';
  g.fillRect(0, roadCenter - roadHalf + 4, RES, 2);
  g.fillRect(0, roadCenter + roadHalf - 6, RES, 2);
  g.fillRect(roadCenter - roadHalf + 4, 0, 2, RES);
  g.fillRect(roadCenter + roadHalf - 6, 0, 2, RES);
  // Clear intersection center for shoulder lines
  g.fillStyle = '#171b1f';
  g.fillRect(roadCenter - roadHalf, roadCenter - roadHalf, roadHalf * 2, roadHalf * 2);

  // Dashed yellow center lane markings
  g.fillStyle = '#d4a73f';
  for (let p = 14; p < RES; p += 40) {
    if (Math.abs(p - roadCenter) > roadHalf + 10) {
      g.fillRect(p, roadCenter - 2, 20, 4);
      g.fillRect(roadCenter - 2, p, 4, 20);
    }
  }

  // Crisp crosswalk stripes at intersection
  g.fillStyle = 'rgba(220, 228, 235, 0.55)';
  for (let s = -roadHalf + 8; s <= roadHalf - 12; s += 12) {
    g.fillRect(roadCenter - sidewalkHalf - 12, roadCenter + s, 10, 6);
    g.fillRect(roadCenter + sidewalkHalf + 2, roadCenter + s, 10, 6);
    g.fillRect(roadCenter + s, roadCenter - sidewalkHalf - 12, 6, 10);
    g.fillRect(roadCenter + s, roadCenter + sidewalkHalf + 2, 6, 10);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  if (renderer && renderer.capabilities) {
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }
  tex.needsUpdate = true;
  return tex;
}

function createTree(rng) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 2.6, 7), trunkMat);
  trunk.position.y = 1.3;
  trunk.castShadow = true;
  g.add(trunk);
  const c1 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.9, 7), leavesMat);
  c1.position.y = 3.0; c1.castShadow = true; g.add(c1);
  const c2 = new THREE.Mesh(new THREE.ConeGeometry(0.95, 1.55, 7), leavesMat);
  c2.position.y = 4.0; c2.castShadow = true; g.add(c2);
  g.rotation.y = rng() * TAU;
  return { object: g, radius: 0.55 }; // Collision based on trunk size so players and zombies can pass under foliage
}
function createDeadTree(rng) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 2.8, 6), deadTrunkMat);
  trunk.position.y = 1.4; trunk.castShadow = true; g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 1.2, 5), deadTrunkMat);
    br.position.set(rand(-0.2, 0.2), rand(2.0, 2.5), rand(-0.2, 0.2));
    br.rotation.set(rand(-1, 1), rand(0, TAU), rand(-1, 1));
    br.castShadow = true;
    g.add(br);
  }
  g.rotation.y = rng() * TAU;
  return { object: g, radius: 0.45 }; // Trunk collision radius
}
function createGrave(rng) {
  const g = new THREE.Group();
  const stone = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.25, 0.26), graveMat);
  stone.position.y = 0.63; stone.castShadow = true; g.add(stone);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.5, 0.28), graveMat);
  top.position.set(0, 1.26, 0); top.castShadow = true; g.add(top);
  const cross = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.28), graveMat);
  cross.position.set(0, 1.33, 0); cross.castShadow = true; g.add(cross);
  const mound = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.18, 1.9), new THREE.MeshStandardMaterial({ color: 0x352819, roughness: 1 }));
  mound.position.set(0, 0.09, 1.4); g.add(mound);
  g.rotation.y = rng() * TAU;
  return { object: g, radius: 0.95 };
}
function createRock(rng) {
  const s = rand(0.7, 1.35);
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
  rock.scale.y = rand(0.65, 0.95);
  rock.position.y = s * 0.42;
  rock.rotation.set(rng() * 3, rng() * 3, rng() * 3);
  rock.castShadow = true;
  return { object: rock, radius: s * 0.9 };
}
function createWreck(rng, alignAngle?: number) {
  const g = new THREE.Group();
  const bodyMat = carMats[Math.floor(rng() * carMats.length)];
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.72, 3.2), bodyMat);
  base.position.y = 0.44; base.castShadow = true; base.receiveShadow = true; g.add(base);
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.52, 1.65), bodyMat);
  top.position.set(0, 0.98, -0.12); top.castShadow = true; g.add(top);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.36, 1.72), new THREE.MeshBasicMaterial({ color: 0x68b5e8, transparent: true, opacity: 0.24 }));
  glass.position.set(0, 0.98, -0.12); g.add(glass);
  // Bumpers
  const bumperMat = new THREE.MeshStandardMaterial({ color: 0x1a1e24, roughness: 0.8 });
  const fb = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.22, 0.18), bumperMat);
  fb.position.set(0, 0.28, 1.62); g.add(fb);
  const rb = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.22, 0.18), bumperMat);
  rb.position.set(0, 0.28, -1.62); g.add(rb);
  // 4 Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.24, 10);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x121518, roughness: 0.95 });
  [[-0.95, 0.3, 1.0], [0.95, 0.3, 1.0], [-0.95, 0.3, -1.0], [0.95, 0.3, -1.0]].forEach(([wx, wy, wz]) => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.position.set(wx, wy, wz);
    g.add(w);
  });
  g.rotation.y = typeof alignAngle === 'number' ? alignAngle + (rng() - 0.5) * 0.22 : rng() * TAU;
  return { object: g, radius: 1.65 };
}

function createGrassPatch(rng) {
  const g = new THREE.Group();
  const blades = 6 + Math.floor(rng() * 5);
  for (let i = 0; i < blades; i++) {
    const r = rng();
    const geo = r < 0.35 ? grassBladeGeo1 : r < 0.75 ? grassBladeGeo2 : grassBladeGeo3;
    const mat = r < 0.45 ? grassMat1 : r < 0.82 ? grassMat2 : grassMat3;
    const blade = new THREE.Mesh(geo, mat);
    blade.position.set((rng() - 0.5) * 0.95, 0.24, (rng() - 0.5) * 0.95);
    blade.rotation.set((rng() - 0.5) * 0.42, rng() * TAU, (rng() - 0.5) * 0.42);
    g.add(blade);
  }
  return g;
}

function createRuinedHouse(rng, facingAngle?: number) {
  const g = new THREE.Group();
  const w = 5.4 + rng() * 1.8;
  const d = 4.8 + rng() * 1.6;
  const h = 3.3 + rng() * 0.7;

  const wallRoll = rng();
  const wallMat = wallRoll < 0.38 ? houseWallMat : wallRoll < 0.72 ? houseWallDarkMat : houseWallBrickMat;

  // Main Weathered Structure
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Foundation / Porch Step
  const step = new THREE.Mesh(new THREE.BoxGeometry(w + 0.35, 0.22, d + 0.35), rockMat);
  step.position.y = 0.11;
  g.add(step);

  // Pitched Roof (4-sided pyramid/cone or gabled prism)
  const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.78, 1.75, 4), houseRoofMat);
  roof.position.y = h + 0.85;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);

  // Brick Chimney
  const chim = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.6, 0.55), deadTrunkMat);
  chim.position.set(w * 0.28, h + 0.75, -d * 0.22);
  chim.castShadow = true;
  g.add(chim);

  // Dark Abandoned Doorway
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.85, 0.12), new THREE.MeshBasicMaterial({ color: 0x050709 }));
  door.position.set(0, 0.95, d / 2 + 0.02);
  g.add(door);

  // Boarded-up Door Planks
  for (let p = 0; p < 2; p++) {
    const pl = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.14, 0.16), plankMat);
    pl.position.set(0, 0.75 + p * 0.55, d / 2 + 0.05);
    pl.rotation.z = (rng() - 0.5) * 0.28;
    g.add(pl);
  }

  // Eerie Boarded Windows on Front & Sides
  const winPositions = [
    [-w * 0.3, h * 0.58, d / 2 + 0.02, 0],
    [w * 0.3, h * 0.58, d / 2 + 0.02, 0],
    [w / 2 + 0.02, h * 0.58, 0, Math.PI / 2],
    [-w / 2 - 0.02, h * 0.58, 0, Math.PI / 2]
  ];
  winPositions.forEach(([wx, wy, wz, ry]) => {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.08), rng() > 0.35 ? winGlowMat : new THREE.MeshBasicMaterial({ color: 0x080c10 }));
    win.position.set(wx, wy, wz);
    win.rotation.y = ry;
    g.add(win);

    // Wooden Barricade Plank over Window
    const plank = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.12, 0.12), plankMat);
    plank.position.set(wx, wy, wz);
    plank.rotation.y = ry;
    plank.rotation.z = (rng() - 0.5) * 0.4;
    g.add(plank);
  });

  const rotY = typeof facingAngle === 'number' ? facingAngle : Math.floor(rng() * 4) * (Math.PI / 2);
  g.rotation.y = rotY;

  // Box dimensions aligned to world axes
  const isQuarterTurn = Math.abs(Math.sin(rotY)) > 0.5;
  const houseW = isQuarterTurn ? d : w;
  const houseD = isQuarterTurn ? w : d;
  const hw = houseW / 2;
  const hd = houseD / 2;
  const radius = Math.hypot(hw, hd);

  return { object: g, radius, hw, hd };
}

function createStreetLight(rng) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.11, 4.4, 7), lampMetalMat);
  pole.position.y = 2.2;
  pole.rotation.z = (rng() - 0.5) * 0.14; // slightly bent post-apocalyptic pole
  pole.castShadow = true;
  g.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.08), lampMetalMat);
  arm.position.set(0.45, 4.3, 0);
  g.add(arm);

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), lampBulbMat);
  bulb.position.set(0.9, 4.2, 0);
  g.add(bulb);

  g.rotation.y = rng() * TAU;
  return { object: g, radius: 0.45 };
}

function createBarricade(rng) {
  const g = new THREE.Group();
  // Concrete jersey barrier + toxic barrel
  const wall = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.85, 0.55), rockMat);
  wall.position.y = 0.42;
  wall.castShadow = true;
  g.add(wall);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.92, 10), barrelToxicMat);
  barrel.position.set(1.35, 0.46, 0.25);
  barrel.castShadow = true;
  g.add(barrel);

  g.rotation.y = rng() * TAU;
  return { object: g, radius: 1.35 };
}

function createChunk(cx, cz) {
  const key = chunkKey(cx, cz);
  if (chunks.has(key)) return chunks.get(key);

  const group = new THREE.Group();
  const tex = makeGroundTexture(cx, cz);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.94, color: 0xb8ccb6 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  const centerX = cx * CHUNK_SIZE + CHUNK_SIZE / 2;
  const centerZ = cz * CHUNK_SIZE + CHUNK_SIZE / 2;
  ground.position.set(centerX, 0, centerZ);
  group.add(ground);

  const rng = seeded(cx, cz);
  const obstacles = [];

  // 1. Dense Lush 3D Grass across all lawns & sidewalk borders (Walkable, no collision)
  const grassCount = 95 + Math.floor(rng() * 30);
  for (let i = 0; i < grassCount; i++) {
    const lx = (rng() - 0.5) * (CHUNK_SIZE - 2);
    const lz = (rng() - 0.5) * (CHUNK_SIZE - 2);
    // Avoid middle of asphalt roads unless growing in sidewalk cracks
    if (Math.abs(lx) < 4.4 || Math.abs(lz) < 4.4) continue;
    const patch = createGrassPatch(rng);
    patch.position.set(centerX + lx, 0, centerZ + lz);
    group.add(patch);
  }

  // 2. Neighborhood Blocks: 4 Residential Quadrants per Chunk with Houses & Yard Trees
  const quadrants = [
    [-1, -1, 0],
    [1, -1, 0],
    [-1, 1, Math.PI],
    [1, 1, Math.PI]
  ];
  for (const [qx, qz, faceAngle] of quadrants) {
    // Main House on the corner lot
    if (rng() < 0.88) {
      const hx = centerX + qx * (14.5 + rng() * 3.5);
      const hz = centerZ + qz * (14.0 + rng() * 3.5);
      if (Math.hypot(hx, hz) > 9.5) {
        const face = faceAngle + (rng() > 0.5 ? 0 : (qx > 0 ? -Math.PI / 2 : Math.PI / 2));
        const house = createRuinedHouse(rng, face);
        house.object.position.set(hx, 0, hz);
        group.add(house.object);
        obstacles.push({ x: hx, z: hz, r: house.radius, hw: house.hw, hd: house.hd });
      }
    }

    // Secondary Neighboring House in the same block for dense neighborhood feel
    if (rng() < 0.58) {
      const hx2 = centerX + qx * (21.5 + rng() * 2.0);
      const hz2 = centerZ + qz * (10.5 + rng() * 2.5);
      if (Math.hypot(hx2, hz2) > 9.5) {
        const house2 = createRuinedHouse(rng, faceAngle);
        house2.object.position.set(hx2, 0, hz2);
        group.add(house2.object);
        obstacles.push({ x: hx2, z: hz2, r: house2.radius, hw: house2.hw, hd: house2.hd });
      }
    }

    // Yard Trees & Shrubs around each house
    const yardProps = 2 + Math.floor(rng() * 3);
    for (let t = 0; t < yardProps; t++) {
      const tx = centerX + qx * (9.5 + rng() * 14);
      const tz = centerZ + qz * (9.5 + rng() * 14);
      if (Math.hypot(tx, tz) < 8.0) continue;
      // Don't overlap existing obstacles
      if (obstacles.some(o => Math.hypot(o.x - tx, o.z - tz) < o.r + 1.8)) continue;
      const prop = rng() < 0.68 ? createTree(rng) : rng() < 0.85 ? createDeadTree(rng) : createRock(rng);
      prop.object.position.set(tx, 0, tz);
      group.add(prop.object);
      obstacles.push({ x: tx, z: tz, r: prop.radius });
    }
  }

  // 3. Parked & Abandoned Cars along the Streets
  const carSlots = [
    [-16, -3.2, Math.PI / 2],
    [15, 3.2, -Math.PI / 2],
    [-3.2, 16, 0],
    [3.2, -15, Math.PI],
    [-22, 3.1, -Math.PI / 2],
    [3.1, 21, 0]
  ];
  for (const [ox, oz, cAngle] of carSlots) {
    if (rng() < 0.68) {
      const wx = centerX + ox + (rng() - 0.5) * 2.4;
      const wz = centerZ + oz + (rng() - 0.5) * 2.4;
      if (Math.hypot(wx, wz) < 8.5) continue;
      if (obstacles.some(o => Math.hypot(o.x - wx, o.z - wz) < o.r + 2.0)) continue;
      const car = createWreck(rng, cAngle);
      car.object.position.set(wx, 0, wz);
      group.add(car.object);
      obstacles.push({ x: wx, z: wz, r: car.radius });
    }
  }

  // 4. Sidewalk Streetlights & Road Barricades
  const lampCorners = [[-6.4, -6.4], [6.4, -6.4], [-6.4, 6.4], [6.4, 6.4]];
  for (const [lx, lz] of lampCorners) {
    if (rng() < 0.75) {
      const sx = centerX + lx;
      const sz = centerZ + lz;
      if (Math.hypot(sx, sz) < 7.5) continue;
      const lamp = createStreetLight(rng);
      lamp.object.position.set(sx, 0, sz);
      group.add(lamp.object);
      obstacles.push({ x: sx, z: sz, r: lamp.radius });
    }
  }

  if (rng() < 0.55) {
    const bx = centerX + (rng() > 0.5 ? 11 : -11);
    const bz = centerZ + (rng() - 0.5) * 3.0;
    if (Math.hypot(bx, bz) > 8.5 && !obstacles.some(o => Math.hypot(o.x - bx, o.z - bz) < o.r + 1.8)) {
      const bar = createBarricade(rng);
      bar.object.position.set(bx, 0, bz);
      group.add(bar.object);
      obstacles.push({ x: bx, z: bz, r: bar.radius });
    }
  }

  const chunk = { key, cx, cz, group, obstacles };
  chunks.set(key, chunk);
  scene.add(group);
  return chunk;
}

function refreshChunks() {
  const px = Math.floor(player.root.position.x / CHUNK_SIZE);
  const pz = Math.floor(player.root.position.z / CHUNK_SIZE);
  const needed = new Set();
  activeObstacles = [];
  activeChunkKeys = [];

  for (let cz = pz - VIEW_RADIUS; cz <= pz + VIEW_RADIUS; cz++) {
    for (let cx = px - VIEW_RADIUS; cx <= px + VIEW_RADIUS; cx++) {
      const chunk = createChunk(cx, cz);
      needed.add(chunk.key);
      activeChunkKeys.push(chunk.key);
      for (const o of chunk.obstacles) {
        // Guarantee house box half-extents
        if (o.r > 2.0 && !o.hw) {
          o.hw = o.r * 0.72;
          o.hd = o.r * 0.68;
        }
        activeObstacles.push(o);
      }
    }
  }

  for (const [key, chunk] of chunks.entries()) {
    if (!needed.has(key)) {
      scene.remove(chunk.group);
      chunk.group.traverse(obj => {
        if (obj.material && obj.material.map) obj.material.map.dispose?.();
        if (obj.material) obj.material.dispose?.();
        obj.geometry?.dispose?.();
      });
      chunks.delete(key);
    }
  }
}

/* Canvas textures for sprites and gun */
/* ══════════════════════════════════════════════
   3D CHARACTER BUILDER  — pure Three.js geometry
   ══════════════════════════════════════════════ */

const B  = THREE.BoxGeometry;
const CY = THREE.CylinderGeometry;
const SP = THREE.SphereGeometry;

const _geoCache = new Map<string, any>();
const _matCache = new Map<string, any>();

function mat(col, rough=0.82, metal=0, emit=0x000000, emitI=0){
  const key = `${col}_${rough}_${metal}_${emit}_${emitI}`;
  let m = _matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({color:col,roughness:rough,metalness:metal,emissive:emit,emissiveIntensity:emitI});
    _matCache.set(key, m);
  }
  return m;
}
function box(w,h,d,m,px=0,py=0,pz=0,parent=null){
  const key = `b_${w}_${h}_${d}`;
  let g = _geoCache.get(key);
  if (!g) { g = new B(w,h,d); _geoCache.set(key, g); }
  const mesh=new THREE.Mesh(g,m);
  mesh.position.set(px,py,pz);
  if(parent) parent.add(mesh);
  return mesh;
}
function cyl(rt,rb,h,seg,m,px=0,py=0,pz=0,parent=null){
  const key = `c_${rt}_${rb}_${h}_${seg}`;
  let g = _geoCache.get(key);
  if (!g) { g = new CY(rt,rb,h,seg); _geoCache.set(key, g); }
  const mesh=new THREE.Mesh(g,m);
  mesh.position.set(px,py,pz);
  if(parent) parent.add(mesh);
  return mesh;
}
function sph(r,ws,hs,m,px=0,py=0,pz=0,parent=null){
  const key = `s_${r}_${ws}_${hs}`;
  let g = _geoCache.get(key);
  if (!g) { g = new SP(r,ws,hs); _geoCache.set(key, g); }
  const mesh=new THREE.Mesh(g,m);
  mesh.position.set(px,py,pz);
  if(parent) parent.add(mesh);
  return mesh;
}

/* ── PROCEDURAL WEAPON TEXTURES & DETAILED 3D GUN MODELS ── */
function makeWeaponTexture(kind) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');

  if (kind === 'wood') {
    g.fillStyle = '#6e4726';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#4e3016';
    for (let y = 0; y < 128; y += 4) {
      g.fillRect(0, y, 128, 1.5);
    }
    g.fillStyle = '#855831';
    for (let i = 0; i < 40; i++) {
      g.fillRect((i * 19) % 128, (i * 7) % 128, 24, 2);
    }
  } else if (kind === 'shotgun_metal') {
    g.fillStyle = '#38434d';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#1f262c';
    for (let x = 8; x < 128; x += 12) {
      g.fillRect(x, 12, 5, 22); // Receiver serrations & vents
    }
    g.fillStyle = '#8b99a6';
    g.fillRect(28, 48, 42, 18); // Chrome bolt ejection port
  } else if (kind === 'pistol_slide') {
    g.fillStyle = '#5c6b78';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#252c33';
    for (let x = 14; x < 64; x += 7) {
      g.fillRect(x, 16, 3, 96); // Slide serrations
    }
    g.fillStyle = '#181c20';
    g.fillRect(74, 28, 30, 44); // Ejection port
  } else {
    // Carbine Tactical Receiver & Rail Texture
    g.fillStyle = '#2f3942';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#161b20';
    for (let x = 6; x < 128; x += 10) {
      g.fillRect(x, 6, 5, 18);  // Picatinny top rail slots
      g.fillRect(x, 52, 6, 22); // Barrel handguard cooling vents
    }
    g.fillStyle = '#4f5d6b';
    g.fillRect(10, 84, 108, 12); // Lower receiver trim
  }

  const tex = new THREE.CanvasTexture(c);
  tex.encoding = THREE.sRGBEncoding;
  tex.needsUpdate = true;
  return tex;
}

const carbineTexMat = new THREE.MeshStandardMaterial({ map: makeWeaponTexture('carbine'), roughness: 0.38, metalness: 0.72 });
const shotgunMetalTexMat = new THREE.MeshStandardMaterial({ map: makeWeaponTexture('shotgun_metal'), roughness: 0.35, metalness: 0.78 });
const shotgunWoodTexMat = new THREE.MeshStandardMaterial({ map: makeWeaponTexture('wood'), roughness: 0.85, metalness: 0.08 });
const pistolSlideTexMat = new THREE.MeshStandardMaterial({ map: makeWeaponTexture('pistol_slide'), roughness: 0.32, metalness: 0.82 });

function createGunModel(kind) {
  const g = new THREE.Group();
  const steel = mat(0x566675, 0.32, 0.78);
  const dark  = mat(0x1a2026, 0.55, 0.45);
  const olive = mat(0x3a4d39, 0.62, 0.28);
  const hazard = mat(0xffb300, 0.45, 0.2);
  const warheadRed = mat(0xd32f2f, 0.35, 0.3, 0xff1744, 0.35);
  const sightGlow = mat(0x39ff14, 0.1, 0, 0x39ff14, 1.4);
  const cyanGlow = mat(0x00e5ff, 0.1, 0, 0x00e5ff, 1.5);
  const flashMat = new THREE.MeshBasicMaterial({ color: 0xfff3a1, transparent: true, opacity: 0.92 });

  let slideMesh = null;
  let muzzleMesh = null;
  let barrelGroup = null;

  if (kind === 'shotgun') {
    // 1. HEAVY SHOTGUN: Pump-Action with Walnut Wood Stock & Pump Forend + Textured Receiver
    box(0.56, 0.11, 0.11, shotgunMetalTexMat, 0.10, 0.04, 0, g);       // Textured Steel Receiver
    box(0.68, 0.055, 0.055, steel, 0.62, 0.068, 0, g);                 // Top Heavy Barrel
    box(0.58, 0.048, 0.048, dark, 0.56, 0.015, 0, g);                  // Under-barrel Shell Tube
    box(0.36, 0.12, 0.10, shotgunWoodTexMat, -0.30, 0.01, 0, g);       // Wooden Buttstock
    box(0.11, 0.22, 0.09, shotgunWoodTexMat, -0.10, -0.09, 0, g);      // Textured Grip
    slideMesh = box(0.26, 0.085, 0.095, shotgunWoodTexMat, 0.52, -0.005, 0, g); // Pump Forend
    box(0.04, 0.04, 0.04, sightGlow, 0.92, 0.105, 0, g);               // Front Fiber Sight
    muzzleMesh = sph(0.14, 7, 7, flashMat, 1.02, 0.068, 0, g);
  } else if (kind === 'sniper') {
    // 3. SNIPER RIFLE: Long-Range Precision Chassis, Telescopic Optic & Heavy Muzzle Brake
    box(0.64, 0.095, 0.095, olive, 0.14, 0.04, 0, g);                  // Olive Tactical Chassis
    box(0.84, 0.042, 0.042, steel, 0.82, 0.052, 0, g);                 // Extra-Long Free-Float Barrel
    box(0.14, 0.065, 0.075, dark, 1.24, 0.052, 0, g);                  // Heavy Fluted Muzzle Brake
    box(0.36, 0.11, 0.085, dark, -0.30, 0.025, 0, g);                  // Precision Cheek-Rest Stock
    box(0.11, 0.22, 0.085, dark, -0.04, -0.09, 0, g);                  // Ergonomic Grip
    box(0.14, 0.18, 0.075, steel, 0.20, -0.08, 0, g);                  // High-Caliber Box Magazine
    // Long Telescopic Scope with Glowing Cyan Objective Lens
    box(0.38, 0.065, 0.065, dark, 0.14, 0.135, 0, g);
    box(0.03, 0.075, 0.075, cyanGlow, 0.34, 0.135, 0, g);
    slideMesh = box(0.18, 0.045, 0.105, steel, 0.12, 0.055, 0, g);     // Bolt Handle / Carrier
    muzzleMesh = sph(0.15, 7, 7, flashMat, 1.34, 0.052, 0, g);
  } else if (kind === 'minigun') {
    // 4. MINIGUN: Rotary 6-Barrel Cannon, Motor Housing, Top Handle & Ammo Box
    box(0.46, 0.18, 0.18, carbineTexMat, 0.06, 0.02, 0, g);            // Heavy Rotary Motor Housing
    box(0.24, 0.12, 0.12, dark, -0.24, 0.02, 0, g);                    // Rear Support Stock
    box(0.11, 0.22, 0.09, dark, -0.06, -0.10, 0, g);                   // Rear Trigger Grip
    box(0.08, 0.16, 0.22, dark, 0.22, 0.14, 0, g);                     // Top Stabilizer Handlebar
    box(0.22, 0.22, 0.16, olive, 0.10, -0.14, 0.12, g);                // Side Belt-Feed Ammo Drum
    // Rotating 6-Barrel Cluster (rotates around X axis when firing!)
    barrelGroup = new THREE.Group();
    barrelGroup.position.set(0.62, 0.02, 0);
    g.add(barrelGroup);
    for (let b = 0; b < 6; b++) {
      const ang = (b / 6) * TAU;
      const by = Math.cos(ang) * 0.052;
      const bz = Math.sin(ang) * 0.052;
      box(0.68, 0.024, 0.024, steel, 0, by, bz, barrelGroup);
    }
    box(0.06, 0.15, 0.15, dark, 0.16, 0, 0, barrelGroup);              // Mid Barrel Clamp Disc
    box(0.06, 0.15, 0.15, dark, 0.28, 0, 0, barrelGroup);              // Muzzle Barrel Clamp Disc
    muzzleMesh = sph(0.16, 7, 7, flashMat, 1.02, 0.02, 0, g);
  } else if (kind === 'rocket') {
    // 5. ROCKET LAUNCHER: Heavy Shoulder/Hand Launch Tube, Exhaust Cone & Armed Warhead
    box(0.96, 0.16, 0.16, olive, 0.22, 0.06, 0, g);                    // Heavy Launch Tube
    box(0.18, 0.22, 0.22, dark, -0.32, 0.06, 0, g);                    // Rear Venturi Exhaust Bell
    box(0.08, 0.17, 0.17, hazard, 0.56, 0.06, 0, g);                   // Yellow Hazard Stripe Band
    box(0.11, 0.22, 0.085, dark, -0.02, -0.09, 0, g);                  // Primary Firing Grip
    box(0.09, 0.18, 0.08, dark, 0.38, -0.08, 0, g);                    // Forward Support Grip
    box(0.16, 0.08, 0.09, dark, 0.18, 0.17, 0, g);                     // Optical Rangefinder Sight
    box(0.03, 0.05, 0.06, sightGlow, 0.25, 0.17, 0, g);
    // Visible Warhead Nosecone in Tube Muzzle (slides back when launched)
    slideMesh = box(0.22, 0.13, 0.13, warheadRed, 0.74, 0.06, 0, g);
    muzzleMesh = sph(0.20, 8, 8, flashMat, 0.88, 0.06, 0, g);
  } else {
    // 2. ASSAULT RIFLE (carbine): Tactical Receiver, Scope, Curved Mag & Moving Bolt
    box(0.62, 0.10, 0.10, carbineTexMat, 0.14, 0.04, 0, g);            // Textured Receiver & Handguard
    box(0.48, 0.048, 0.048, steel, 0.62, 0.045, 0, g);                 // Precision Rifle Barrel
    box(0.10, 0.068, 0.068, dark, 0.86, 0.045, 0, g);                  // Tactical Muzzle Brake
    box(0.28, 0.10, 0.09, dark, -0.26, 0.03, 0, g);                    // Adjustable Tactical Stock
    box(0.11, 0.22, 0.085, dark, -0.04, -0.09, 0, g);                  // Pistol Grip (held by right hand)
    box(0.12, 0.24, 0.075, dark, 0.22, -0.10, 0, g);                   // 30-Round Magazine
    box(0.08, 0.14, 0.07, dark, 0.42, -0.06, 0, g);                    // Vertical Foregrip (held by left hand)
    // Holographic Optic Sight
    box(0.16, 0.065, 0.075, dark, 0.12, 0.11, 0, g);
    box(0.02, 0.04, 0.05, sightGlow, 0.12, 0.115, 0, g);
    // Reciprocating Bolt Carrier (kicks back when firing!)
    slideMesh = box(0.18, 0.05, 0.11, steel, 0.14, 0.055, 0, g);
    muzzleMesh = sph(0.12, 7, 7, flashMat, 0.95, 0.045, 0, g);
  }

  if (muzzleMesh) {
    muzzleMesh.scale.set(1.8, 0.8, 0.8);
    muzzleMesh.visible = false;
  }

  (g as any).slideMesh = slideMesh;
  (g as any).slideBaseX = slideMesh ? slideMesh.position.x : 0;
  (g as any).muzzleMesh = muzzleMesh;
  (g as any).barrelGroup = barrelGroup;
  return g;
}

/* ── PLAYER 3D MODEL (Rigged Tactical Survivor Holding Weapon in Hands) ── */
function createPlayerModel(){
  const root=new THREE.Group();

  const armorM  = mat(0x1a3d5c, 0.72, 0.12);
  const armorHi = mat(0x254f78, 0.65, 0.15);
  const pantsM  = mat(0x1e2832, 0.90);
  const bootM   = mat(0x111820, 0.55, 0.1);
  const visorM  = mat(0x3ab8e0, 0.1, 0.0, 0x3ab8e0, 0.8);
  const gloveM  = mat(0x222a32, 0.8);
  const darkM   = mat(0x0d1218, 0.9);

  // — Torso Pivot at Hips —
  const torso = new THREE.Group(); torso.position.y = 1.1; root.add(torso);

  // Tactical Vest & Chest Armor
  box(0.58, 0.72, 0.34, armorM, 0, 0, 0, torso); // Chest Plate
  box(0.62, 0.08, 0.38, armorHi, 0, 0.38, 0, torso); // Shoulder Plate
  box(0.42, 0.12, 0.36, armorHi, 0, -0.32, 0, torso); // Tactical Belt
  box(0.14, 0.10, 0.14, armorM, 0.0, 0.34, 0.18, torso); // Chest Badge
  box(0.06, 0.06, 0.06, mat(0x39ff14, 0.1, 0, 0x39ff14, 1.2), 0, 0.34, 0.19, torso); // LED Status Indicator

  // Ammo Pouches & Side Holster
  box(0.12, 0.14, 0.08, darkM, -0.18, -0.32, 0.19, torso); // Pouch 1
  box(0.12, 0.14, 0.08, darkM,  0.00, -0.32, 0.19, torso); // Pouch 2
  box(0.12, 0.14, 0.08, darkM,  0.18, -0.32, 0.19, torso); // Pouch 3
  box(0.12, 0.22, 0.10, darkM,  0.28, -0.30, 0.02, torso); // Pistol Holster

  // — Neck & Low-Poly Survivor Head (Brown Hair & Face matching Portrait) —
  const skinM = mat(0xd4956a, 0.82);
  const hairM = mat(0x4a2e1b, 0.92);
  const eyeDarkM = mat(0x14181e, 0.5);
  const eyeWhiteM = mat(0xf2f6fa, 0.5);

  const headPiv = new THREE.Group(); headPiv.position.y = 0.42; torso.add(headPiv);
  cyl(0.09, 0.10, 0.18, 8, mat(0xb87e56, 0.85), 0, 0.09, 0, headPiv); // Neck
  const head = new THREE.Group(); head.position.y = 0.26; headPiv.add(head);
  box(0.38, 0.38, 0.38, skinM, 0, 0, 0, head);                        // Low-poly blocky face
  box(0.41, 0.13, 0.41, hairM, 0, 0.16, -0.01, head);                 // Top hair
  box(0.41, 0.26, 0.16, hairM, 0, 0.04, -0.13, head);                 // Back hair
  box(0.06, 0.18, 0.28, hairM, -0.18, 0.06, -0.02, head);             // Left sideburn
  box(0.06, 0.18, 0.28, hairM,  0.18, 0.06, -0.02, head);             // Right sideburn
  box(0.14, 0.06, 0.05, hairM, -0.08, 0.11, 0.19, head);              // Front hair fringe
  // Eyes & Brows
  box(0.08, 0.03, 0.03, hairM, -0.09, 0.05, 0.19, head);
  box(0.08, 0.03, 0.03, hairM,  0.09, 0.05, 0.19, head);
  box(0.07, 0.05, 0.02, eyeWhiteM, -0.09, 0.0, 0.19, head);
  box(0.07, 0.05, 0.02, eyeWhiteM,  0.09, 0.0, 0.19, head);
  box(0.04, 0.05, 0.03, eyeDarkM, -0.08, 0.0, 0.195, head);
  box(0.04, 0.05, 0.03, eyeDarkM,  0.08, 0.0, 0.195, head);
  box(0.10, 0.03, 0.02, mat(0x8c5638, 0.9), 0, -0.10, 0.19, head);    // Mouth

  // — Detailed Arms & Tactical Gloves (Rigged to Hold Weapon Directly in Hands) —
  function makeArm(side) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.34, 0.28, 0.04);
    torso.add(pivot);

    const upper = new THREE.Group(); pivot.add(upper);
    box(0.17, 0.36, 0.17, armorM,  0, -0.18, 0, upper); // Upper Arm
    box(0.20, 0.06, 0.20, armorHi, 0, -0.01, 0, upper); // Shoulder Pauldron

    const lowerPiv = new THREE.Group(); lowerPiv.position.y = -0.36; upper.add(lowerPiv);
    box(0.14, 0.34, 0.14, mat(0x142d45, 0.88), 0, -0.17, 0, lowerPiv); // Forearm

    // Detailed Tactical Hand with Fingers Wrapped Around Weapon Grip
    const handGroup = new THREE.Group(); handGroup.position.set(0, -0.34, 0.02); lowerPiv.add(handGroup);
    box(0.12, 0.11, 0.14, gloveM, 0, 0, 0, handGroup); // Tactical Glove Palm

    for (let f = -1; f <= 1; f++) {
      box(0.032, 0.08, 0.035, gloveM, f * 0.035, -0.05, 0.05, handGroup); // Fingers gripping weapon
    }
    box(0.035, 0.07, 0.035, gloveM, side * 0.055, 0.01, 0.02, handGroup); // Thumb

    return { pivot, upper, lowerPiv, handGroup };
  }
  const armL = makeArm(-1);
  const armR = makeArm(1);

  // — Legs & Combat Boots —
  function makeLeg(side) {
    const hipPiv = new THREE.Group(); hipPiv.position.set(side * 0.16, -0.36, 0); torso.add(hipPiv);
    box(0.22, 0.50, 0.22, pantsM, 0, -0.25, 0, hipPiv); // Thigh
    box(0.24, 0.12, 0.24, armorHi, 0, -0.22, 0.02, hipPiv); // Knee Pad

    const kneePiv = new THREE.Group(); kneePiv.position.y = -0.52; hipPiv.add(kneePiv);
    box(0.20, 0.46, 0.20, pantsM, 0, -0.23, 0, kneePiv); // Shin
    box(0.22, 0.12, 0.32, bootM,  0, -0.48, 0.04, kneePiv); // Combat Boot
    return { hipPiv, kneePiv };
  }
  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  // — Weapon Socket Mounted Directly in the Character's Hands (Aligned with Torso) —
  const gunGroup = new THREE.Group();
  gunGroup.position.set(0.10, 0.06, 0.44);
  gunGroup.rotation.y = -Math.PI * 0.5;
  torso.add(gunGroup);
  const initialGun = createGunModel('carbine');
  gunGroup.add(initialGun);

  // Shadow
  const shadow = new THREE.Mesh(circleShadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01; shadow.scale.setScalar(1.2);
  root.add(shadow);

  scene.add(root);

  player = {
    root, torso, headPiv, armL, armR, legL, legR,
    gunGroup, activeGunModel: initialGun, shadow,
    armorM, armorHi, visorM,
    hp: 100, maxHp: 100,
    shield: 0, maxShield: 100,
    vx: 0, vz: 0,
    angle: 0, moveBob: 0,
    hurtTimer: 0, shootCd: 0, reloadCd: 0, reloadTotal: 0,
    recoilImpulse: 0,
    weapon: 'carbine', ammo: 30, maxAmmo: 30, muzzle: 0
  };
  applyPlayerSkin();
}

function applyPlayerSkin() {
  if (!player || !player.armorM) return;
  const skin = meta?.equippedSkin || 'default';
  if (skin === 'cyber' && meta?.hasSkinCyber) {
    player.armorM.color.setHex(0x880e4f);
    player.armorM.emissive.setHex(0xff007f);
    player.armorM.emissiveIntensity = 0.35;
    player.armorHi.color.setHex(0x00e5ff);
    player.visorM.color.setHex(0x00e5ff);
    player.visorM.emissive.setHex(0x00e5ff);
  } else if (skin === 'hazmat' && meta?.hasSkinHazmat) {
    player.armorM.color.setHex(0xd4a000);
    player.armorM.emissive.setHex(0x332800);
    player.armorM.emissiveIntensity = 0.2;
    player.armorHi.color.setHex(0x212121);
    player.visorM.color.setHex(0x76ff03);
    player.visorM.emissive.setHex(0x76ff03);
  } else {
    player.armorM.color.setHex(0x1a3d5c);
    player.armorM.emissive.setHex(0x000000);
    player.armorM.emissiveIntensity = 0;
    player.armorHi.color.setHex(0x254f78);
    player.visorM.color.setHex(0x3ab8e0);
    player.visorM.emissive.setHex(0x3ab8e0);
  }
}

function updatePlayerWeapon(){
  while(player.gunGroup.children.length) player.gunGroup.remove(player.gunGroup.children[0]);
  const model = createGunModel(player.weapon);
  player.gunGroup.add(model);
  player.activeGunModel = model;
}

// alias kept for compat
function createPlayer(){ createPlayerModel(); }

/* ── STAGE 3: ZOMBIE SKIN ARCHITECTURE, RARITY & ANTI-REPETITION SPAWNER ── */
const ZOMBIE_SKIN_RARITIES: Record<string, number> = {
  common: 50,
  uncommon: 28,
  rare: 13,
  epic: 6.5,
  legendary: 2.5
};

interface ZombieSkinDef {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  types: string[];
  skin: number;
  shirt: number;
  pants: number;
  boot: number;
  eye: number;
  hair: number;
  armor?: number;
  armorTrim?: number;
  stripe?: number;
  sac1?: number;
  sac2?: number;
  skinRough?: number;
  skinMetal?: number;
  skinEmit?: number;
  skinEmitI?: number;
  hat?: 'police_cap' | 'hardhat' | 'bandage' | 'military_helmet' | 'headband' | 'spikes' | 'crown_horns' | 'gas_mask' | 'riot_visor';
  accessory?: 'blood' | 'hivis_vest' | 'hospital_gown' | 'webbing' | 'embers' | 'mutated_spines' | 'athlete_stripes' | 'tac_visor' | 'brute_armor' | 'toxic_blisters' | 'bloated_belly' | 'skeleton_ribs' | 'ice_crystals' | 'heavy_pauldrons' | 'bio_blisters' | 'chest_plate' | 'back_spines';
}

const ZOMBIE_SKINS: ZombieSkinDef[] = [
  // ── 1. WALKER SKINS (7) ──
  { id: 'walker_classic',      name: 'Classic Green Zombie',       rarity: 'common',   types: ['walker'], skin: 0x7a9e88, shirt: 0x3d3428, pants: 0x2a3038, boot: 0x8a7a6a, eye: 0xff3c3c, hair: 0x1a1612 },
  { id: 'walker_bloodied',     name: 'Bloodied Zombie',            rarity: 'common',   types: ['walker'], skin: 0x829988, shirt: 0x4a2024, pants: 0x262b32, boot: 0x5c4a42, eye: 0xff1e1e, hair: 0x1c1412, accessory: 'blood' },
  { id: 'walker_police',       name: 'Police Zombie',              rarity: 'uncommon', types: ['walker'], skin: 0x749682, shirt: 0x182b49, pants: 0x122038, boot: 0x181c22, eye: 0xff3c3c, hair: 0x1a1612, hat: 'police_cap' },
  { id: 'walker_construction', name: 'Construction Worker Zombie', rarity: 'uncommon', types: ['walker'], skin: 0x789984, shirt: 0x424852, pants: 0x284268, boot: 0x7a5632, eye: 0xff4422, hair: 0x221a14, hat: 'hardhat', accessory: 'hivis_vest' },
  { id: 'walker_hospital',     name: 'Hospital Patient Zombie',    rarity: 'uncommon', types: ['walker'], skin: 0x8aa899, shirt: 0x5ca4a9, pants: 0x4d8b90, boot: 0x78888a, eye: 0xff3344, hair: 0x24201c, hat: 'bandage', accessory: 'hospital_gown' },
  { id: 'walker_military',     name: 'Military Zombie',            rarity: 'rare',     types: ['walker'], skin: 0x6b8c76, shirt: 0x3b4d2e, pants: 0x2e3d23, boot: 0x1f241c, eye: 0xff2a00, hair: 0x161612, hat: 'military_helmet', accessory: 'webbing' },
  { id: 'walker_burned',       name: 'Burned Zombie',              rarity: 'rare',     types: ['walker'], skin: 0x262020, shirt: 0x1a1616, pants: 0x141212, boot: 0x100e0e, eye: 0xff6600, hair: 0x0d0b0b, accessory: 'embers' },

  // ── 2. RUNNER SKINS (5) ──
  { id: 'runner_mutated',      name: 'Mutated Runner',             rarity: 'common',   types: ['runner'], skin: 0x5e9c7e, shirt: 0x2c3d52, pants: 0x1e2930, boot: 0x546270, eye: 0xff2200, hair: 0x151210, accessory: 'mutated_spines' },
  { id: 'runner_bloodied',     name: 'Bloodied Runner',            rarity: 'common',   types: ['runner'], skin: 0x759482, shirt: 0x52181c, pants: 0x242026, boot: 0x48383a, eye: 0xff0022, hair: 0x1a1010, accessory: 'blood' },
  { id: 'runner_pale',         name: 'Pale Runner',                rarity: 'uncommon', types: ['runner'], skin: 0xbaccc4, shirt: 0x232830, pants: 0x181c22, boot: 0x343a42, eye: 0xff1133, hair: 0x2a2e32 },
  { id: 'runner_athlete',      name: 'Infected Athlete',           rarity: 'uncommon', types: ['runner'], skin: 0x729c84, shirt: 0xb82828, pants: 0x1e2430, boot: 0xd8dce0, eye: 0xff3300, hair: 0x1c1612, hat: 'headband', accessory: 'athlete_stripes' },
  { id: 'runner_dark',         name: 'Dark Runner',                rarity: 'rare',     types: ['runner'], skin: 0x222a2e, shirt: 0x12161a, pants: 0x0e1114, boot: 0x181c20, eye: 0xff5500, hair: 0x0a0c0e },

  // ── 3. ARMORED SKINS (4) ──
  { id: 'armored_riot',        name: 'Riot Police Zombie',         rarity: 'common',   types: ['armored'], skin: 0x688574, shirt: 0x1c2c44, pants: 0x152032, boot: 0x181e24, eye: 0xffaa00, hair: 0x141414, armor: 0x3a4856, armorTrim: 0x1f2830, stripe: 0xd49b1a },
  { id: 'armored_military',    name: 'Military Armored Zombie',    rarity: 'uncommon', types: ['armored'], skin: 0x64806c, shirt: 0x36442a, pants: 0x293420, boot: 0x1e221a, eye: 0xff6600, hair: 0x141412, armor: 0x485838, armorTrim: 0x2b3620, stripe: 0x8a9a68 },
  { id: 'armored_heavy_metal', name: 'Heavy Metal Armor Zombie',   rarity: 'rare',     types: ['armored'], skin: 0x5c7568, shirt: 0x2c3034, pants: 0x202428, boot: 0x282c30, eye: 0xff2200, hair: 0x121212, armor: 0x7c8a96, armorTrim: 0x465058, stripe: 0xb87333 },
  { id: 'armored_tactical',    name: 'Tactical Soldier Zombie',    rarity: 'epic',     types: ['armored'], skin: 0x546e62, shirt: 0x181c20, pants: 0x12161a, boot: 0x101418, eye: 0x00e5ff, hair: 0x0e1012, armor: 0x222830, armorTrim: 0x12161a, stripe: 0x00e5ff, accessory: 'tac_visor' },

  // ── 4. BRUTE SKINS (4) ──
  { id: 'brute_mutated',       name: 'Massive Mutated Brute',      rarity: 'common',   types: ['brute'], skin: 0x5a7d70, shirt: 0x232e38, pants: 0x1a2228, boot: 0x607078, eye: 0xff1111, hair: 0x100e0c, accessory: 'mutated_spines' },
  { id: 'brute_armored',       name: 'Armored Brute',              rarity: 'uncommon', types: ['brute'], skin: 0x587368, shirt: 0x2c3640, pants: 0x1e262e, boot: 0x38424a, eye: 0xffaa00, hair: 0x121212, armor: 0x4a5866, accessory: 'brute_armor' },
  { id: 'brute_toxic',         name: 'Toxic Brute',                rarity: 'rare',     types: ['brute'], skin: 0x4e8868, shirt: 0x1c362c, pants: 0x162820, boot: 0x3a5248, eye: 0x39ff14, hair: 0x0e1a14, sac1: 0x22cc55, sac2: 0x39ff14, accessory: 'toxic_blisters' },
  { id: 'brute_burned',        name: 'Burned Brute',               rarity: 'rare',     types: ['brute'], skin: 0x241c1c, shirt: 0x181212, pants: 0x120e0e, boot: 0x161010, eye: 0xff5500, hair: 0x0a0808, accessory: 'embers' },

  // ── 5. TOXIC SKINS (4) ──
  { id: 'toxic_radioactive',   name: 'Radioactive Green Zombie',   rarity: 'common',   types: ['toxic', 'spitter'], skin: 0x5a9a80, shirt: 0x1e3e38, pants: 0x182824, boot: 0x4a6860, eye: 0x39ff14, hair: 0x101a16, sac1: 0x22bb66, sac2: 0x39ff14 },
  { id: 'toxic_purple',        name: 'Purple Toxic Zombie',        rarity: 'uncommon', types: ['toxic', 'spitter'], skin: 0x6c688a, shirt: 0x2a1e3e, pants: 0x1e162c, boot: 0x483a5c, eye: 0xe056fd, hair: 0x161020, sac1: 0x8e24aa, sac2: 0xe040fb },
  { id: 'toxic_bloated',       name: 'Mutated Bloated Zombie',     rarity: 'rare',     types: ['toxic', 'spitter'], skin: 0x7a9c64, shirt: 0x344222, pants: 0x263018, boot: 0x525c3a, eye: 0xaaff00, hair: 0x1a2010, sac1: 0x88cc22, sac2: 0xccff33, accessory: 'bloated_belly' },
  { id: 'toxic_glowing',       name: 'Glowing Infected Zombie',    rarity: 'epic',     types: ['toxic', 'spitter'], skin: 0x48b888, shirt: 0x163832, pants: 0x102824, boot: 0x2c5850, eye: 0x00ffcc, hair: 0x0c221e, sac1: 0x00e676, sac2: 0x69f0ae, skinEmit: 0x188855, skinEmitI: 0.42 },

  // ── 6. CRAWLER SKINS (4) ──
  { id: 'crawler_bloodied',    name: 'Bloodied Crawler',           rarity: 'common',   types: ['crawler'], skin: 0x7aaa8a, shirt: 0x542224, pants: 0x2e282c, boot: 0x5c4444, eye: 0xff2222, hair: 0x1a1414, accessory: 'blood' },
  { id: 'crawler_skeleton',    name: 'Skeleton Crawler',           rarity: 'uncommon', types: ['crawler'], skin: 0xd8d2c2, shirt: 0x2c2a28, pants: 0x201e1c, boot: 0x3a3632, eye: 0x22ff66, hair: 0x22201c, accessory: 'skeleton_ribs' },
  { id: 'crawler_mutated',     name: 'Mutated Crawler',            rarity: 'uncommon', types: ['crawler'], skin: 0x589878, shirt: 0x322842, pants: 0x241c30, boot: 0x483c58, eye: 0x00ffaa, hair: 0x14101c, accessory: 'mutated_spines' },
  { id: 'crawler_burned',      name: 'Burned Crawler',             rarity: 'rare',     types: ['crawler'], skin: 0x282020, shirt: 0x1a1414, pants: 0x141010, boot: 0x120e0e, eye: 0xff6600, hair: 0x0c0a0a, accessory: 'embers' },

  // ── 7. SPECIAL RARE COSMETIC SKINS (5 — Multi-Class) ──
  { id: 'rare_crimson',        name: 'Crimson Zombie',             rarity: 'rare',      types: ['walker', 'runner', 'armored', 'brute', 'toxic', 'spitter', 'crawler'], skin: 0x8a1c24, shirt: 0x3a0c12, pants: 0x24080c, boot: 0x1c0608, eye: 0xff0033, hair: 0x1a0406, armor: 0x5c141c, armorTrim: 0x380a10, sac1: 0xb81428, sac2: 0xff1744 },
  { id: 'rare_radioactive',    name: 'Radioactive Zombie',         rarity: 'rare',      types: ['walker', 'runner', 'armored', 'brute', 'crawler'], skin: 0x62c442, shirt: 0x263820, pants: 0x1a2816, boot: 0x202e1c, eye: 0x76ff03, hair: 0x142210, armor: 0x385230, skinEmit: 0x227711, skinEmitI: 0.38 },
  { id: 'rare_shadow',         name: 'Shadow Zombie',              rarity: 'epic',      types: ['walker', 'runner', 'brute', 'crawler'], skin: 0x10131a, shirt: 0x090b10, pants: 0x07080c, boot: 0x06070a, eye: 0xb388ff, hair: 0x050608, skinRough: 0.95 },
  { id: 'rare_frozen',         name: 'Frozen Zombie',              rarity: 'epic',      types: ['walker', 'runner', 'armored', 'brute', 'toxic', 'spitter', 'crawler'], skin: 0x78c8f0, shirt: 0x2c5878, pants: 0x1e4058, boot: 0x244860, eye: 0x80d8ff, hair: 0x4888b0, armor: 0x58a8d8, armorTrim: 0x3878a0, sac1: 0x00b0ff, sac2: 0x80d8ff, skinRough: 0.28, skinMetal: 0.32, skinEmit: 0x0d3c55, skinEmitI: 0.32, accessory: 'ice_crystals' },
  { id: 'rare_golden',         name: 'Golden Zombie',              rarity: 'legendary', types: ['walker', 'runner', 'armored', 'brute', 'toxic', 'spitter', 'crawler'], skin: 0xffca28, shirt: 0xb28704, pants: 0x8c6800, boot: 0x6e5000, eye: 0xffffff, hair: 0xd4a017, armor: 0xffd54f, armorTrim: 0xc49000, sac1: 0xffb300, sac2: 0xffe57f, skinRough: 0.24, skinMetal: 0.85, skinEmit: 0x4a3500, skinEmitI: 0.35 }
];

const _recentSkinsByType: Record<string, string[]> = {};

function selectZombieSkin(type: string): ZombieSkinDef {
  const normType = type === 'spitter' ? 'toxic' : type;
  const candidates = ZOMBIE_SKINS.filter(s => s.types.includes(normType));
  if (candidates.length === 0) {
    return ZOMBIE_SKINS[0];
  }

  const recent = _recentSkinsByType[normType] || [];
  const weights: number[] = [];
  let totalWeight = 0;

  for (let i = 0; i < candidates.length; i++) {
    const s = candidates[i];
    const baseRarityW = Math.max(0.1, Number(ZOMBIE_SKIN_RARITIES[s.rarity]) || 10);
    let w = baseRarityW;
    // Anti-repetition penalty when alternatives exist
    if (candidates.length > 1) {
      if (recent[0] === s.id) w *= 0.10;
      else if (recent[1] === s.id) w *= 0.35;
    }
    weights.push(w);
    totalWeight += w;
  }

  if (totalWeight <= 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  let r = Math.random() * totalWeight;
  let chosen = candidates[candidates.length - 1];
  for (let i = 0; i < candidates.length; i++) {
    r -= weights[i];
    if (r <= 0) {
      chosen = candidates[i];
      break;
    }
  }

  _recentSkinsByType[normType] = [chosen.id, recent[0] || ''].filter(Boolean);
  return chosen;
}

function attachSkinHatAndAccessories(type: string, skin: ZombieSkinDef, torso: any, headPiv: any) {
  if (!skin) return;
  const isHeavy = type === 'brute' || type === 'boss';
  const isCrawler = type === 'crawler';

  // — Head Hats / Helmets —
  if (headPiv && skin.hat) {
    if (skin.hat === 'police_cap') {
      const capM = mat(0x14243d, 0.7);
      const visorM = mat(0x0c1016, 0.4, 0.3);
      const badgeM = mat(0xffd54f, 0.3, 0.8);
      box(0.42, 0.12, 0.40, capM, 0, 0.30, 0, headPiv);
      box(0.36, 0.04, 0.14, visorM, 0, 0.24, 0.21, headPiv);
      box(0.08, 0.08, 0.03, badgeM, 0, 0.31, 0.21, headPiv);
    } else if (skin.hat === 'hardhat') {
      const hatM = mat(0xffc107, 0.35, 0.15);
      box(0.42, 0.14, 0.40, hatM, 0, 0.30, 0, headPiv);
      box(0.46, 0.04, 0.46, hatM, 0, 0.24, 0.02, headPiv);
    } else if (skin.hat === 'bandage') {
      const bandM = mat(0xe8ecee, 0.92);
      const bloodSpotM = mat(0x9a181e, 0.85);
      box(0.41, 0.12, 0.38, bandM, 0, 0.22, 0, headPiv);
      box(0.10, 0.08, 0.04, bloodSpotM, 0.08, 0.22, 0.18, headPiv);
    } else if (skin.hat === 'military_helmet') {
      const helmM = mat(0x36482b, 0.75, 0.2);
      const strapM = mat(0x1f2818, 0.9);
      box(0.43, 0.16, 0.41, helmM, 0, 0.26, -0.01, headPiv);
      box(0.44, 0.05, 0.42, strapM, 0, 0.21, 0, headPiv);
    } else if (skin.hat === 'headband') {
      const bandM = mat(0xf4f6f8, 0.85);
      const stripeM = mat(0xd32f2f, 0.85);
      box(0.40, 0.07, 0.37, bandM, 0, 0.19, 0, headPiv);
      box(0.41, 0.03, 0.38, stripeM, 0, 0.19, 0, headPiv);
    } else if (skin.hat === 'spikes') {
      // Boss / mini-boss: ring of bone-steel spikes around the crown
      const spikeM = mat(0xcfc7b4, 0.45, 0.35);
      for (let s = 0; s < 6; s++) {
        const a = (s / 6) * Math.PI * 2;
        const sp = cyl(0.01, 0.06, 0.26, 5, spikeM, Math.cos(a) * 0.22, 0.52, Math.sin(a) * 0.20, headPiv);
        sp.rotation.z = -Math.cos(a) * 0.35;
        sp.rotation.x = Math.sin(a) * 0.35;
      }
    } else if (skin.hat === 'crown_horns') {
      // Boss / mini-boss: golden crown band with curved horns
      const goldM = mat(0xd4a017, 0.3, 0.8, 0x6b4a00, 0.4);
      const hornM = mat(0xe8e0cf, 0.55, 0.1);
      box(0.62, 0.08, 0.56, goldM, 0, 0.44, 0, headPiv);
      const hL = cyl(0.015, 0.09, 0.5, 6, hornM, -0.30, 0.66, 0, headPiv);
      const hR = cyl(0.015, 0.09, 0.5, 6, hornM,  0.30, 0.66, 0, headPiv);
      hL.rotation.z = 0.55; hR.rotation.z = -0.55;
      for (const px of [-0.2, 0, 0.2]) cyl(0.01, 0.05, 0.14, 4, goldM, px, 0.56, 0.22, headPiv);
    } else if (skin.hat === 'gas_mask') {
      // Boss / mini-boss: bio-hazard respirator with glowing filters
      const maskM = mat(0x1f2a24, 0.55, 0.45);
      const filtM = mat(skin.sac2 || 0x39ff14, 0.3, 0.2, skin.sac2 || 0x39ff14, 0.9);
      box(0.42, 0.26, 0.12, maskM, 0, -0.02, 0.30, headPiv);
      const fL = cyl(0.07, 0.07, 0.16, 8, filtM, -0.16, -0.06, 0.38, headPiv);
      const fR = cyl(0.07, 0.07, 0.16, 8, filtM,  0.16, -0.06, 0.38, headPiv);
      fL.rotation.x = Math.PI / 2; fR.rotation.x = Math.PI / 2;
      box(0.50, 0.06, 0.52, maskM, 0, 0.30, 0, headPiv);
    } else if (skin.hat === 'riot_visor') {
      // Boss / mini-boss: armored riot helmet with glowing visor slit
      const helmM = mat(0x2b3a48, 0.35, 0.75);
      const visorM = mat(0x00e5ff, 0.15, 0.2, 0x00e5ff, 1.4);
      box(0.62, 0.22, 0.58, helmM, 0, 0.34, 0, headPiv);
      box(0.54, 0.34, 0.12, helmM, 0, 0.10, 0.28, headPiv);
      box(0.46, 0.07, 0.04, visorM, 0, 0.14, 0.35, headPiv);
    }
  }

  // — Torso / Head Cosmetic Accessories —
  if (torso && skin.accessory) {
    const acc = skin.accessory;
    if (acc === 'blood') {
      const bloodM = mat(0x8c1118, 0.65);
      if (isCrawler) {
        box(0.28, 0.22, 0.03, bloodM, 0.06, 0.04, 0.15, torso);
      } else {
        box(0.24, 0.20, 0.03, bloodM, -0.08, 0.08, 0.15, torso);
        box(0.16, 0.14, 0.03, bloodM, 0.10, -0.08, 0.15, torso);
      }
    } else if (acc === 'hivis_vest') {
      const vestM = mat(0xff6d00, 0.65);
      const reflM = mat(0xe6ee9c, 0.3, 0.2, 0xc0ca33, 0.35);
      box(0.53, 0.48, 0.31, vestM, 0, 0.04, 0, torso);
      box(0.54, 0.05, 0.32, reflM, 0, -0.06, 0, torso);
      box(0.54, 0.05, 0.32, reflM, 0, 0.14, 0, torso);
    } else if (acc === 'hospital_gown') {
      const trimM = mat(0xe0f2f1, 0.9);
      box(0.52, 0.06, 0.30, trimM, 0, 0.24, 0, torso);
    } else if (acc === 'webbing') {
      const webM = mat(0x232e1a, 0.9);
      box(0.10, 0.56, 0.31, webM, -0.14, 0.02, 0, torso);
      box(0.10, 0.56, 0.31, webM, 0.14, 0.02, 0, torso);
      box(0.14, 0.12, 0.06, webM, -0.14, -0.12, 0.17, torso);
      box(0.14, 0.12, 0.06, webM, 0.14, -0.12, 0.17, torso);
    } else if (acc === 'embers') {
      const emberM = mat(0xff5722, 0.3, 0, 0xff3d00, 1.4);
      const zOff = isHeavy ? 0.26 : 0.15;
      box(0.22, 0.04, 0.03, emberM, 0.06, 0.12, zOff, torso);
      box(0.18, 0.04, 0.03, emberM, -0.08, -0.06, zOff, torso);
      box(0.05, 0.20, 0.03, emberM, 0.0, 0.02, -zOff, torso);
    } else if (acc === 'mutated_spines') {
      const spineM = mat(0x26d07c, 0.4, 0, 0x14a058, 0.6);
      const zBack = isHeavy ? -0.28 : -0.17;
      box(0.06, 0.14, 0.10, spineM, 0, 0.20, zBack, torso);
      box(0.06, 0.12, 0.09, spineM, 0, 0.02, zBack, torso);
      box(0.05, 0.10, 0.08, spineM, 0, -0.14, zBack, torso);
    } else if (acc === 'athlete_stripes') {
      const stripeM = mat(0xf5f7fa, 0.8);
      box(0.08, 0.58, 0.30, stripeM, -0.18, 0, 0, torso);
      box(0.08, 0.58, 0.30, stripeM, 0.18, 0, 0, torso);
    } else if (acc === 'tac_visor' && headPiv) {
      const visorM = mat(0x00e5ff, 0.15, 0.5, 0x00e5ff, 1.3);
      box(0.38, 0.09, 0.06, visorM, 0, 0.07, 0.19, headPiv);
    } else if (acc === 'brute_armor') {
      const plateM = mat(skin.armor || 0x4a5866, 0.35, 0.75);
      box(0.88, 0.52, 0.54, plateM, 0, 0.08, 0, torso);
      box(0.28, 0.18, 0.58, plateM, -0.38, 0.42, 0, torso);
      box(0.28, 0.18, 0.58, plateM, 0.38, 0.42, 0, torso);
    } else if (acc === 'toxic_blisters') {
      const blistM = mat(skin.sac2 || 0x39ff14, 0.25, 0, skin.sac2 || 0x39ff14, 1.2);
      sph(0.14, 8, 8, blistM, -0.36, 0.44, -0.10, torso);
      sph(0.12, 8, 8, blistM, 0.34, 0.40, 0.12, torso);
      sph(0.16, 8, 8, blistM, 0, 0.16, -0.28, torso);
    } else if (acc === 'bloated_belly') {
      const bellyM = mat(skin.skin, 0.75, 0, 0x558811, 0.25);
      sph(0.24, 10, 10, bellyM, 0, -0.06, 0.12, torso);
    } else if (acc === 'skeleton_ribs') {
      const boneRibM = mat(0xe6dfd0, 0.8);
      const cavM = mat(0x161412, 0.95);
      box(0.38, 0.42, 0.04, cavM, 0, 0.02, 0.14, torso);
      for (const ry of [-0.10, 0.02, 0.14]) {
        box(0.42, 0.04, 0.06, boneRibM, 0, ry, 0.15, torso);
      }
    } else if (acc === 'ice_crystals') {
      const iceM = mat(0xb3e5fc, 0.18, 0.4, 0x29b6f6, 0.65);
      const xOff = isHeavy ? 0.38 : 0.22;
      box(0.08, 0.18, 0.08, iceM, -xOff, 0.34, 0, torso);
      box(0.07, 0.15, 0.07, iceM, xOff, 0.32, -0.04, torso);
    } else if (acc === 'heavy_pauldrons') {
      // Boss / mini-boss: oversized spiked shoulder plates
      const plateM = mat(skin.armor || 0x423028, 0.35, 0.7);
      const spikeM = mat(0xcfc7b4, 0.45, 0.35);
      box(0.34, 0.20, 0.60, plateM, -0.62, 0.50, 0, torso);
      box(0.34, 0.20, 0.60, plateM,  0.62, 0.50, 0, torso);
      cyl(0.01, 0.07, 0.30, 5, spikeM, -0.64, 0.70, 0, torso);
      cyl(0.01, 0.07, 0.30, 5, spikeM,  0.64, 0.70, 0, torso);
    } else if (acc === 'bio_blisters') {
      // Boss / mini-boss: glowing toxic tanks on the back and shoulders
      const sacM1 = mat(skin.sac1 || 0x22bb66, 0.3, 0, skin.sac1 || 0x22bb66, 0.9);
      const sacM2 = mat(skin.sac2 || 0x39ff14, 0.2, 0, skin.sac2 || 0x39ff14, 1.4);
      sph(0.20, 10, 10, sacM1, -0.20, 0.10, -0.36, torso);
      sph(0.20, 10, 10, sacM1,  0.20, 0.10, -0.36, torso);
      sph(0.14, 8, 8, sacM2, -0.52, 0.46, 0.04, torso);
      sph(0.14, 8, 8, sacM2,  0.52, 0.46, 0.04, torso);
      sph(0.11, 8, 8, sacM2, 0, 0.00, 0.30, torso);
    } else if (acc === 'chest_plate') {
      // Boss / mini-boss: heavy riveted chest armor with glowing core slit
      const plateM = mat(skin.armor || 0x3a4e60, 0.3, 0.8);
      const coreM = mat(0x00e5ff, 0.15, 0.2, 0x00e5ff, 1.3);
      box(0.92, 0.66, 0.58, plateM, 0, 0.06, 0.03, torso);
      box(0.34, 0.07, 0.06, coreM, 0, 0.10, 0.34, torso);
      box(0.30, 0.22, 0.62, plateM, -0.56, 0.44, 0, torso);
      box(0.30, 0.22, 0.62, plateM,  0.56, 0.44, 0, torso);
    } else if (acc === 'back_spines') {
      // Boss / mini-boss: row of curved dorsal spines
      const spineM = mat(0xdcd0ff, 0.5, 0.1, skin.eye || 0xd500f9, 0.35);
      for (const sy of [-0.24, -0.04, 0.16, 0.36]) {
        const sp = cyl(0.01, 0.07, 0.40, 5, spineM, 0, sy, -0.36, torso);
        sp.rotation.x = -0.6;
      }
    }
  }
}

/* ── ZOMBIE 3D MODELS (6 CLASSES + BOSS + STAGE 3 SKINS) ── */
function createZombieModel(type, forcedSkin?: ZombieSkinDef){
  const root=new THREE.Group();
  const cfg=zombieTypes[type] || zombieTypes.walker;
  const scale=cfg.scale;
  root.scale.setScalar(scale);

  // Bosses use their archetype forcedSkin so they look different from regular Brutes
  const chosenSkin = forcedSkin || (type === 'boss' ? null : selectZombieSkin(type));

  // palettes per type / skin
  const P = chosenSkin ? {
    skin: chosenSkin.skin,
    shirt: chosenSkin.shirt,
    pants: chosenSkin.pants,
    boot: chosenSkin.boot,
    eye: chosenSkin.eye,
    hair: chosenSkin.hair
  } : ({
    walker:  {skin:0x7a9e88, shirt:0x3d3428, pants:0x2a3038, boot:0x8a7a6a, eye:0xff3c3c, hair:0x1a1612},
    runner:  {skin:0x6b9982, shirt:0x2c3d52, pants:0x1e2930, boot:0x546270, eye:0xff2200, hair:0x151210},
    armored: {skin:0x688574, shirt:0x26323d, pants:0x1b242c, boot:0x1c2226, eye:0xffaa00, hair:0x141414},
    brute:   {skin:0x5a7d70, shirt:0x232e38, pants:0x1a2228, boot:0x607078, eye:0xff1111, hair:0x100e0c},
    crawler: {skin:0x7aaa8a, shirt:0x48413a, pants:0x2e3830, boot:0x707a6a, eye:0x22ff66, hair:0x1a1a14},
    toxic:   {skin:0x5a9a80, shirt:0x1e3e38, pants:0x182824, boot:0x4a6860, eye:0x39ff14, hair:0x101a16},
    spitter: {skin:0x5a9a80, shirt:0x1e3e38, pants:0x182824, boot:0x4a6860, eye:0x22ffaa, hair:0x101a16},
    boss:    {skin:0x3d1c24, shirt:0x1f0d12, pants:0x12080c, boot:0x3a1018, eye:0xff0055, hair:0x0a0406}
  }[type] || {skin:0x7a9e88, shirt:0x3d3428, pants:0x2a3038, boot:0x8a7a6a, eye:0xff3c3c, hair:0x1a1612});

  const sRough = chosenSkin?.skinRough ?? 0.88;
  const sMetal = chosenSkin?.skinMetal ?? 0;
  const sEmit  = chosenSkin?.skinEmit  ?? 0x000000;
  const sEmitI = chosenSkin?.skinEmitI ?? 0;

  const skinM  = mat(P.skin,  sRough, sMetal, sEmit, sEmitI);
  const shirtM = mat(P.shirt, chosenSkin?.skinMetal ? 0.35 : 0.94, chosenSkin?.skinMetal ? 0.65 : 0);
  const pantsM = mat(P.pants, chosenSkin?.skinMetal ? 0.40 : 0.95, chosenSkin?.skinMetal ? 0.55 : 0);
  const bootM  = mat(P.boot,  0.72, 0.05);
  const eyeM   = mat(P.eye,   0.1, 0, P.eye, 1.8);
  const hairM  = mat(P.hair,  0.98);
  const darkM  = mat(0x0d1218, 0.9);
  const teethM = mat(0xd4d0b8, 0.8);

  const commonProps = {
    type,
    skinId: chosenSkin ? chosenSkin.id : 'boss_titan',
    skinName: chosenSkin ? chosenSkin.name : 'Titan Abomination',
    skinRarity: chosenSkin ? chosenSkin.rarity : 'legendary',
    hp: 0, maxHp: 0, speed: 0, damage: 0, reward: 0, score: 0,
    baseScale: scale,
    hitR: cfg.hit, // Hitbox de combate / projéteis (intacta)
    envHitR: (type === 'brute' || type === 'boss') ? cfg.hit : 0.50, // Hitbox de ambiente / mapa (permite passar em qualquer vão)
    atkRange: cfg.atkRange || 1.55,
    baseAtkCd: cfg.atkCd || 0.82,
    detectRange: cfg.detectRange || 48,
    armorResist: cfg.armorResist || 0,
    headshotMult: cfg.headshotMult || 1.75,
    animSpeed: cfg.animSpeed || 5.3,
    deathTime: cfg.deathTime || 0.36,
    step: rand(0, TAU),
    atkCd: rand(0.25, 0.9),
    atkAnim: 0,
    hitFlash: 0,
    charge: 0,
    crawlOffset: rand(0, TAU),
    flankSign: Math.random() < 0.5 ? -1 : 1,
    pounceTimer: 0,
    pounceCd: rand(1.4, 2.8),
    smashTimer: 0,
    smashCd: rand(2.5, 4.5),
    smashRadius: cfg.smashRadius || 4.2,
    smashDamage: cfg.smashDamage || 24,
    smashWindup: cfg.smashWindup || 0.65,
    baseSmashCd: cfg.smashCd || 5.5,
    summonCd: 7.5,
    bossArchetype: null as string | null,
    auraRing: null as any,
    toxicTrailCd: rand(1.2, 2.5),
    stuckTimer: 0,
    steerDir: Math.random() < 0.5 ? 1 : -1,
    lastX: 0,
    lastZ: 0,
    state: 'walk',
    dead: false,
    smashRing: null as any
  };

  if(type==='crawler'){
    // Low crouching body aligned close to ground
    const body=new THREE.Group(); body.position.set(0,0.34,0); body.rotation.x=0.62; root.add(body);
    box(0.54,0.60,0.28,shirtM, 0,0,0,body);
    box(0.58,0.06,0.32,mat(P.pants,0.95), 0,0.28,0,body);
    // head tilted forward so eyes face player while crawling
    const headPiv=new THREE.Group(); headPiv.position.set(0,0.34,0.18); headPiv.rotation.x=-0.65; body.add(headPiv);
    box(0.34,0.36,0.32,skinM,  0,0,0,headPiv);
    box(0.36,0.10,0.34,hairM,  0,0.20,0,headPiv);
    box(0.22,0.07,0.05,darkM,  0,0.02,0.17,headPiv);
    sph(0.05,6,6,eyeM, -0.08,0.04,0.17,headPiv);
    sph(0.05,6,6,eyeM,  0.08,0.04,0.17,headPiv);
    // arms sprawled forward for clawing the ground
    const aL=new THREE.Group(); aL.position.set(-0.34,0.10,0.18); aL.rotation.set(-0.7,-0.25,0.45); body.add(aL);
    box(0.14,0.52,0.14,shirtM, 0,-0.26,0,aL);
    sph(0.08,7,7,skinM, 0,-0.55,0,aL);
    const aR=new THREE.Group(); aR.position.set( 0.34,0.10,0.18); aR.rotation.set(-0.7, 0.25,-0.45); body.add(aR);
    box(0.14,0.52,0.14,shirtM, 0,-0.26,0,aR);
    sph(0.08,7,7,skinM, 0,-0.55,0,aR);
    // legs dragging/pushing behind
    function crawlLeg(side){
      const p=new THREE.Group(); p.position.set(side*0.18,-0.30,-0.10); p.rotation.x=-0.35; body.add(p);
      box(0.18,0.42,0.18,pantsM, 0,-0.21,0,p);
      const k=new THREE.Group(); k.position.y=-0.44; p.add(k);
      box(0.16,0.38,0.16,pantsM, 0,-0.19,0,k);
      box(0.18,0.07,0.24,bootM,  0,-0.40,0.04,k);
      return {p,k};
    }
    const legCL=crawlLeg(-1), legCR=crawlLeg(1);
    if (chosenSkin) attachSkinHatAndAccessories(type, chosenSkin, body, headPiv);
    const shadow=new THREE.Mesh(circleShadowGeo,shadowMat); shadow.rotation.x=-Math.PI/2; shadow.position.y=0.02; shadow.scale.setScalar(0.95); root.add(shadow);
    scene.add(root);
    return Object.assign(commonProps, {root,torso:body,body,legL:legCL,legR:legCR,armL:aL,armR:aR,headPiv,shadow});
  }

  if(type==='brute' || type==='boss'){
    const torso=new THREE.Group(); torso.position.y=1.28; root.add(torso);
    box(0.84,0.90,0.50,shirtM,  0,0,0,torso);           // huge chest
    box(0.92,0.12,0.56,mat(chosenSkin?.armor || 0x2a3438,0.9), 0,0.42,0,torso); // massive shoulder bulk
    box(0.40,0.12,0.50,mat(0x1c2830,0.9), 0,-0.40,0,torso); // belt
    box(0.24,0.12,0.50,mat(0x8a6a44,0.8), 0,-0.40,0,torso); // belt buckle area
    // scars / wounds on chest
    box(0.22,0.03,0.04,mat(0x5a1010,0.95), 0.1,0.12,0.26,torso);
    box(0.18,0.03,0.04,mat(0x5a1010,0.95),-0.12,-0.08,0.26,torso);
    // head
    const headPiv=new THREE.Group(); headPiv.position.y=0.50; torso.add(headPiv);
    box(0.56,0.54,0.50,skinM,  0,0.08,0,headPiv);
    box(0.58,0.10,0.52,hairM,  0,0.36,0,headPiv);
    box(0.38,0.08,0.06,darkM,  0,0.10,0.26,headPiv);
    sph(0.07,6,6,eyeM,-0.13,0.12,0.27,headPiv);
    sph(0.07,6,6,eyeM, 0.13,0.12,0.27,headPiv);
    box(0.28,0.06,0.05,teethM, 0,-0.08,0.27,headPiv);
    // neck
    cyl(0.14,0.16,0.22,8,skinM, 0,-0.04,0,headPiv);
    // arms — massive
    function bruteArm(side){
      const p=new THREE.Group(); p.position.set(side*0.54,0.38,0); torso.add(p);
      box(0.30,0.54,0.30,shirtM, 0,-0.27,0,p);
      box(0.32,0.08,0.32,mat(chosenSkin?.armor || 0x2a3438,0.88), 0,-0.01,0,p);
      const k=new THREE.Group(); k.position.y=-0.56; p.add(k);
      box(0.26,0.46,0.26,skinM, 0,-0.23,0,k);
      box(0.30,0.10,0.30,mat(0x3a4448,0.75,0.1), 0,-0.02,0,k);
      sph(0.14,8,8,skinM, 0,-0.50,0,k);
      return{p,k};
    }
    const armL=bruteArm(-1),armR=bruteArm(1);
    // legs
    function bruteLeg(side){
      const p=new THREE.Group(); p.position.set(side*0.24,-0.44,0); torso.add(p);
      box(0.30,0.58,0.30,pantsM, 0,-0.29,0,p);
      const k=new THREE.Group(); k.position.y=-0.60; p.add(k);
      box(0.27,0.54,0.27,pantsM, 0,-0.27,0,k);
      box(0.30,0.10,0.36,bootM,  0,-0.56,0.04,k);
      return{p,k};
    }
    const legL=bruteLeg(-1),legR=bruteLeg(1);
    if (chosenSkin) attachSkinHatAndAccessories(type, chosenSkin, torso, headPiv);
    const shadow=new THREE.Mesh(circleShadowGeo,shadowMat); shadow.rotation.x=-Math.PI/2; shadow.position.y=0.02; shadow.scale.setScalar(1.7); root.add(shadow);

    // Ground-smash warning ring (visible during Brute smash windup)
    const smashRing = new THREE.Mesh(smashWarnRingGeo, smashWarnMat);
    smashRing.rotation.x = -Math.PI / 2;
    smashRing.position.y = 0.04;
    const localRingScale = (cfg.smashRadius || 4.2) / scale;
    smashRing.scale.setScalar(localRingScale);
    smashRing.visible = false;
    root.add(smashRing);

    scene.add(root);
    return Object.assign(commonProps, {root,torso,headPiv,armL,armR,legL,legR,shadow,smashRing});
  }

  if(type==='toxic' || type==='spitter'){
    const sacCol1 = chosenSkin?.sac1 || 0x22bb66;
    const sacCol2 = chosenSkin?.sac2 || 0x39ff14;
    const torso=new THREE.Group(); torso.position.y=1.0; root.add(torso);
    box(0.46,0.66,0.28,shirtM,  0,0,0,torso);
    box(0.50,0.08,0.32,mat(P.pants,0.9), 0,0.30,0,torso);
    // glowing toxic sacs & blisters on back and shoulders
    const sacM1 = mat(sacCol1,0.35,0,sacCol1,0.85);
    const sacM2 = mat(sacCol2,0.25,0,sacCol2,1.25);
    sph(0.19,10,10,sacM1, 0,0.06,-0.26,torso);
    sph(0.12,8,8, sacM2, 0.06,0.12,-0.36,torso);
    sph(0.10,8,8, sacM2,-0.16,0.32,-0.10,torso); // shoulder blister
    // tubes from sac to mouth
    const tubeM=mat(sacCol1,0.7,0,sacCol2,0.45);
    box(0.04,0.28,0.04,tubeM, -0.08,0.20,-0.25,torso);
    box(0.04,0.28,0.04,tubeM,  0.08,0.20,-0.25,torso);
    // head
    const headPiv=new THREE.Group(); headPiv.position.y=0.38; torso.add(headPiv);
    box(0.36,0.38,0.34,skinM,  0,0.06,0,headPiv);
    box(0.38,0.09,0.36,hairM,  0,0.28,0,headPiv);
    box(0.26,0.07,0.05,darkM,  0,0.07,0.18,headPiv);
    sph(0.055,6,6,eyeM,-0.10,0.09,0.18,headPiv);
    sph(0.055,6,6,eyeM, 0.10,0.09,0.18,headPiv);
    // bloated toxic cheeks & glowing acid mouth
    sph(0.10,8,8,skinM,-0.20,0.02,0.10,headPiv);
    sph(0.10,8,8,skinM, 0.20,0.02,0.10,headPiv);
    box(0.20,0.07,0.05,sacM2, 0,-0.07,0.19,headPiv);
    cyl(0.08,0.10,0.16,8,skinM, 0,-0.08,0,headPiv);
    // arms
    function spitArm(side){
      const p=new THREE.Group(); p.position.set(side*0.30,0.28,0); torso.add(p);
      p.rotation.x = -0.65;
      box(0.15,0.40,0.15,shirtM, 0,-0.20,0,p);
      const k=new THREE.Group(); k.position.y=-0.42; p.add(k);
      box(0.13,0.36,0.13,skinM, 0,-0.18,0,k);
      sph(0.07,7,7,sacM2, 0,-0.38,0,k); // toxic hands
      return{p,k};
    }
    const armL=spitArm(-1),armR=spitArm(1);
    // legs
    function spitLeg(side){
      const p=new THREE.Group(); p.position.set(side*0.14,-0.33,0); torso.add(p);
      box(0.18,0.44,0.18,pantsM, 0,-0.22,0,p);
      const k=new THREE.Group(); k.position.y=-0.46; p.add(k);
      box(0.16,0.40,0.16,pantsM, 0,-0.20,0,k);
      box(0.18,0.07,0.26,bootM,  0,-0.42,0.03,k);
      return{p,k};
    }
    const legL=spitLeg(-1),legR=spitLeg(1);
    if (chosenSkin) attachSkinHatAndAccessories(type, chosenSkin, torso, headPiv);
    const shadow=new THREE.Mesh(circleShadowGeo,shadowMat); shadow.rotation.x=-Math.PI/2; shadow.position.y=0.02; shadow.scale.setScalar(1.0); root.add(shadow);
    scene.add(root);
    return Object.assign(commonProps, {root,torso,headPiv,armL,armR,legL,legR,shadow});
  }

  if(type==='armored'){
    const isHeavyMetal = chosenSkin?.id === 'armored_heavy_metal';
    const armorPlateM = mat(chosenSkin?.armor || 0x3a4856, isHeavyMetal ? 0.22 : 0.35, isHeavyMetal ? 0.88 : 0.72);
    const armorTrimM  = mat(chosenSkin?.armorTrim || 0x1f2830, 0.50, 0.55);
    const hazardStripeM = mat(chosenSkin?.stripe || 0xd49b1a, 0.4, 0.2, chosenSkin?.id === 'armored_tactical' ? 0x00e5ff : 0x000000, chosenSkin?.id === 'armored_tactical' ? 0.8 : 0);

    const torso=new THREE.Group(); torso.position.y=1.02; torso.rotation.x=0.12; root.add(torso);
    box(0.52,0.64,0.30,shirtM, 0,0,0,torso);
    // Heavy Riot / Military / Metal Chest Armor Plate & Pauldrons
    box(0.58,0.50,0.38,armorPlateM, 0,0.05,0.02,torso);
    box(0.42,0.24,0.41,armorTrimM,  0,0.08,0.03,torso);
    box(0.36,0.05,0.42,hazardStripeM, 0,0.22,0.03,torso); // tactical stripe
    box(0.56,0.10,0.36,armorTrimM,  0,-0.28,0,torso);     // armored belt

    // Head with Ballistic Helmet (face/chin vulnerable to headshots)
    const headPiv=new THREE.Group(); headPiv.position.y=0.38; torso.add(headPiv);
    box(0.37,0.40,0.34,skinM, 0,0.05,0,headPiv);
    // Ballistic Helmet dome + side ear guards
    box(0.44,0.18,0.42,armorPlateM, 0,0.22,-0.01,headPiv);
    box(0.46,0.06,0.44,armorTrimM,  0,0.13, 0.02,headPiv); // helmet rim
    box(0.06,0.22,0.28,armorPlateM,-0.20,0.08,-0.03,headPiv);
    box(0.06,0.22,0.28,armorPlateM, 0.20,0.08,-0.03,headPiv);
    sph(0.055,6,6,eyeM,-0.09,0.07,0.18,headPiv);
    sph(0.055,6,6,eyeM, 0.09,0.07,0.18,headPiv);
    box(0.18,0.05,0.04,teethM, 0,-0.06,0.18,headPiv);

    function armoredArm(side){
      const p=new THREE.Group(); p.position.set(side*0.35,0.26,0); torso.add(p);
      p.rotation.z=side*(-0.45);
      p.rotation.x=-0.85;
      box(0.22,0.20,0.22,armorPlateM, 0,-0.04,0,p); // shoulder pauldron
      box(0.15,0.44,0.15,shirtM, 0,-0.22,0,p);
      const k=new THREE.Group(); k.position.y=-0.46; p.add(k);
      box(0.16,0.28,0.16,armorTrimM, 0,-0.16,0,k);  // forearm bracer
      sph(0.075,7,7,skinM, 0,-0.42,0,k);
      return{p,k};
    }
    const armL=armoredArm(-1),armR=armoredArm(1);

    function armoredLeg(side){
      const p=new THREE.Group(); p.position.set(side*0.16,-0.30,0); torso.add(p);
      box(0.20,0.46,0.20,pantsM, 0,-0.23,0,p);
      const k=new THREE.Group(); k.position.y=-0.48; p.add(k);
      box(0.21,0.14,0.22,armorPlateM, 0,-0.04,0.02,k); // knee pad
      box(0.18,0.42,0.18,pantsM, 0,-0.21,0,k);
      box(0.20,0.08,0.27,bootM,  0,-0.44,0.03,k);
      return{p,k};
    }
    const legL=armoredLeg(-1),legR=armoredLeg(1);
    if (chosenSkin) attachSkinHatAndAccessories(type, chosenSkin, torso, headPiv);
    const shadow=new THREE.Mesh(circleShadowGeo,shadowMat); shadow.rotation.x=-Math.PI/2; shadow.position.y=0.02; shadow.scale.setScalar(1.15); root.add(shadow);
    scene.add(root);
    return Object.assign(commonProps, {root,torso,headPiv,armL,armR,legL,legR,shadow});
  }

  // ── walker / runner shared builder ──
  const isRunner=(type==='runner');
  const torso=new THREE.Group(); torso.position.y=1.0+(isRunner?0.05:0); root.add(torso);
  // hunched torso
  torso.rotation.x=isRunner?0.08:0.18;
  box(0.50,0.62,0.28,shirtM,  0,0,0,torso);
  box(0.54,0.07,0.32,mat(P.pants,0.9), 0,0.28,0,torso);
  // belt
  box(0.52,0.06,0.30,mat(0x1a1a14,0.9), 0,-0.30,0,torso);
  // torn shirt detail
  box(0.12,0.08,0.04,mat(P.pants,0.95), isRunner?0.14:-0.16, isRunner?-0.05:0.05, 0.15,torso);

  // head — lolling
  const headPiv=new THREE.Group(); headPiv.position.y=0.36; torso.add(headPiv);
  headPiv.rotation.x=isRunner?-0.10:0.22; // runners look forward, walkers loll
  box(0.37,0.40,0.34,skinM,  0,0.05,0,headPiv);
  box(0.39,0.09,0.36,hairM,  0,0.27,0,headPiv);
  box(0.26,0.06,0.05,darkM,  0,0.06,0.18,headPiv);
  sph(0.055,6,6,eyeM,-0.09,0.08,0.18,headPiv);
  sph(0.055,6,6,eyeM, 0.09,0.08,0.18,headPiv);
  box(0.18,0.05,0.04,teethM, 0,-0.06,0.18,headPiv);
  // jaw open (zombies)
  box(0.20,0.08,0.04,skinM,  0,-0.11,0.16,headPiv);
  box(0.10,0.04,0.04,mat(0x5a1010,0.9), 0,-0.11,0.19,headPiv); // tongue
  cyl(0.07,0.09,0.16,8,skinM, 0,-0.08,0,headPiv); // neck

  // arms — outstretched zombie pose
  function zArm(side){
    const p=new THREE.Group(); p.position.set(side*0.32,0.26,0); torso.add(p);
    p.rotation.z=side*(isRunner?-0.4:-0.6);
    p.rotation.x=isRunner?-0.6:-1.0; // arms reaching forward
    box(0.14,0.44,0.14,shirtM, 0,-0.22,0,p);
    box(0.16,0.06,0.16,mat(P.pants,0.85), 0,-0.01,0,p);
    const k=new THREE.Group(); k.position.y=-0.46; p.add(k);
    box(0.12,0.40,0.12,skinM, 0,-0.20,0,k);
    // clawed hand
    sph(0.07,7,7,skinM, 0,-0.42,0,k);
    box(0.04,0.10,0.03,mat(0x1a1008,0.9), -0.05,-0.52, 0.03,k);
    box(0.04,0.10,0.03,mat(0x1a1008,0.9),  0.00,-0.53, 0.03,k);
    box(0.04,0.10,0.03,mat(0x1a1008,0.9),  0.05,-0.52, 0.03,k);
    return{p,k};
  }
  const armL=zArm(-1),armR=zArm(1);

  // legs
  function zLeg(side){
    const p=new THREE.Group(); p.position.set(side*0.15,-0.30,0); torso.add(p);
    box(0.19,0.46,0.19,pantsM, 0,-0.23,0,p);
    const k=new THREE.Group(); k.position.y=-0.48; p.add(k);
    box(0.17,0.42,0.17,pantsM, 0,-0.21,0,k);
    box(0.19,0.07,0.26,bootM,  0,-0.44,0.03,k);
    return{p,k};
  }
  const legL=zLeg(-1),legR=zLeg(1);

  if (chosenSkin) attachSkinHatAndAccessories(type, chosenSkin, torso, headPiv);

  const shadow=new THREE.Mesh(circleShadowGeo,shadowMat);
  shadow.rotation.x=-Math.PI/2; shadow.position.y=0.02; shadow.scale.setScalar(isRunner?0.95:1.05); root.add(shadow);
  scene.add(root);

  return Object.assign(commonProps, {root,torso,headPiv,armL,armR,legL,legR,shadow});
}

function createZombie(type, forcedSkin?: ZombieSkinDef){
  const z=createZombieModel(type, forcedSkin) as any;
  const base=zombieTypes[type] || zombieTypes.walker;
  z.hp=base.hp; z.maxHp=base.hp;
  z.speed=base.speed; z.damage=base.damage;
  z.reward=base.reward; z.score=base.score;
  z.atkRange = base.atkRange;
  z.baseAtkCd = base.atkCd;
  z.armorResist = base.armorResist;
  z.headshotMult = base.headshotMult;
  // Independent 3D groan timer (initial stagger between 0.5s and 6.0s so zombies don't all groan at the same instant)
  z.groanTimer = rand(0.5, 6.0);
  z.groanPitchMod = rand(0.92, 1.08);
  z.activeGroans = [];

  if (DEBUG_BALANCE && waveStats.active) {
    waveStats.zombieTypes[type] = (waveStats.zombieTypes[type] || 0) + 1;
    waveStats.zombiesSpawned++;
  }

  return z;
}

/* Pickups */
function createBonePickup() {
  const g = new THREE.Group();
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.34, 6), boneMat);
  cyl.rotation.z = Math.PI / 2; g.add(cyl);
  const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), boneMat); s1.position.set(-0.17, 0.05, 0); g.add(s1);
  const s2 = s1.clone(); s2.position.set(-0.17, -0.05, 0); g.add(s2);
  const s3 = s1.clone(); s3.position.set(0.17, 0.05, 0); g.add(s3);
  const s4 = s1.clone(); s4.position.set(0.17, -0.05, 0); g.add(s4);
  return g;
}
function createMedkitPickup() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.42), medMat); g.add(box);
  const v = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.28), medWhite); v.position.y = 0.14; g.add(v);
  const h = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.08), medWhite); h.position.y = 0.14; g.add(h);
  return g;
}
function createPowerupPickup(kind) {
  const g = new THREE.Group();
  const col = kind === 'overcharge' ? 0xffd86e : kind === 'magnet' ? 0xff007f : 0x51deff;
  const m = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.85, roughness: 0.2, metalness: 0.6 });
  const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), m);
  g.add(orb);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.03, 6, 16), m);
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  return g;
}
function createGrenadePickup() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x3f6a32, roughness: 0.45, metalness: 0.4, emissive: 0x1d3a14, emissiveIntensity: 0.6 })
  );
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 8), new THREE.MeshBasicMaterial({ color: 0xffd86e }));
  cap.position.y = 0.22;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 6, 12), new THREE.MeshBasicMaterial({ color: 0xffd86e }));
  ring.position.set(0.1, 0.26, 0);
  g.add(body); g.add(cap); g.add(ring);
  return g;
}
function createKevlarPickup() {
  const g = new THREE.Group();
  const vestMat = new THREE.MeshStandardMaterial({ color: 0x162a3d, roughness: 0.48, metalness: 0.52 });
  const trimMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.10), vestMat);
  g.add(plate);
  const s1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.11), trimMat);
  s1.position.y = 0.08;
  g.add(s1);
  const s2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 0.11), trimMat);
  s2.position.y = -0.08;
  g.add(s2);
  return g;
}
function spawnPickup(kind, x, z, value) {
  let mesh;
  if (kind === 'bone') mesh = createBonePickup();
  else if (kind === 'medkit') mesh = createMedkitPickup();
  else if (kind === 'kevlar') mesh = createKevlarPickup();
  else if (kind === 'grenade') mesh = createGrenadePickup();
  else mesh = createPowerupPickup(kind);
  mesh.position.set(x, 0.45, z);
  scene.add(mesh);
  pickups.push({ kind, mesh, value, t: Math.random() * TAU, magnet: false });
}

function spawnFloatingDamage(worldX, worldZ, amount, isCrit = false) {
  if (!camera) return;
  const container = document.getElementById('floatingDmgContainer');
  if (!container) return;
  const v = new THREE.Vector3(worldX + rand(-0.25, 0.25), 1.65, worldZ);
  v.project(camera);
  if (v.z > 1) return;
  const sx = (v.x * 0.5 + 0.5) * window.innerWidth;
  const sy = (-v.y * 0.5 + 0.5) * window.innerHeight;
  const el = document.createElement('div');
  el.className = 'zbh-dmg-pop' + (isCrit ? ' crit' : '');
  el.style.left = sx + 'px';
  el.style.top = sy + 'px';
  el.textContent = (isCrit ? 'CRIT ' : '') + Math.round(amount);
  container.appendChild(el);
  setTimeout(() => el.remove(), 600);
}

/* Particles */
function spawnBurst(x, z, color, count, minSpeed, maxSpeed) {
  for (let i = 0; i < count; i++) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
    const mesh = new THREE.Mesh(particleGeo, mat);
    mesh.position.set(x + rand(-0.15, 0.15), rand(0.3, 1.2), z + rand(-0.15, 0.15));
    scene.add(mesh);
    const a = Math.random() * TAU;
    const s = rand(minSpeed, maxSpeed);
    particles.push({ mesh, life: rand(0.26, 0.52), ttl: 0.52, vx: Math.cos(a) * s, vy: rand(1.2, 3.4), vz: Math.sin(a) * s });
  }
}

/* ── GAMEPLAY BALANCE DEBUG LOGGER (DEVELOPMENT ONLY) ── */
const DEBUG_BALANCE = true; // Toggle this flag to enable/disable balance logging
let waveStats = {
  active: false,
  wave: 0,
  startTime: 0,
  frames: 0,
  startPlayerHp: 0,
  startPlayerShield: 0,
  damageTaken: 0,
  medkitsCollected: 0,
  kevlarCollected: 0,
  zombiesKilled: 0,
  zombiesSpawned: 0,
  deaths: 0,
  zombieTypes: {} as Record<string, number>,
  peakHp: 0,
  peakSpeed: 0,
  peakRunnerSpeed: 0,
  peakWalkerHp: 0,
  updateTimeTotal: 0,
  updateTimeSamples: 0,
  maxActiveZombies: 0
};

function startWaveDebug(wave: number, totalZombies: number) {
  if (!DEBUG_BALANCE) return;
  waveStats = {
    active: true,
    wave,
    startTime: performance.now(),
    frames: 0,
    startPlayerHp: player ? player.hp : 100,
    startPlayerShield: player ? (player.shield || 0) : 0,
    damageTaken: 0,
    medkitsCollected: 0,
    kevlarCollected: 0,
    zombiesKilled: 0,
    zombiesSpawned: 0,
    deaths: 0,
    zombieTypes: {},
    peakHp: 0,
    peakSpeed: 0,
    peakRunnerSpeed: 0,
    peakWalkerHp: 0,
    updateTimeTotal: 0,
    updateTimeSamples: 0,
    maxActiveZombies: 0
  };
  console.log(`\n[DEBUG] --- WAVE ${wave} STARTED --- (Total expected: ${totalZombies})`);
}

function endWaveDebug() {
  if (!DEBUG_BALANCE || !waveStats.active) return;
  waveStats.active = false;
  const durationMs = performance.now() - waveStats.startTime;
  const durationSec = (durationMs / 1000).toFixed(2);
  const avgFps = (waveStats.frames / (durationMs / 1000)).toFixed(1);
  const avgUpdateTime = waveStats.updateTimeSamples > 0 ? (waveStats.updateTimeTotal / waveStats.updateTimeSamples).toFixed(2) : '0';

  const endHp = player ? player.hp : 0;
  const endShield = player ? (player.shield || 0) : 0;

  // Validation Checks
  const walkerBaseHp = zombieTypes.walker.hp;
  const walkerHpCap = walkerBaseHp * WAVE_SCALING_CONFIG.maxHpMult;
  const walkerHpValid = waveStats.peakWalkerHp <= walkerHpCap;

  const runnerBaseSpeed = zombieTypes.runner.speed;
  const runnerSpeedCap = runnerBaseSpeed * WAVE_SCALING_CONFIG.maxSpeedMult;
  const runnerSpeedValid = waveStats.peakRunnerSpeed <= runnerSpeedCap;

  console.log(`[DEBUG] ====== WAVE ${waveStats.wave} END OF WAVE REPORT ======`);
  console.log(`⏱️ DURATION: ${durationSec}s | AVG FPS: ${avgFps} | AVG UPDATE MS: ${avgUpdateTime}ms`);
  console.log(`💀 ZOMBIES: Spawned: ${waveStats.zombiesSpawned} | Killed: ${waveStats.zombiesKilled} | Max Active: ${waveStats.maxActiveZombies}`);
  console.log(`📊 TYPES: ${JSON.stringify(waveStats.zombieTypes)}`);
  console.log(`📈 MAX STATS: HP: ${waveStats.peakHp.toFixed(1)} | Speed: ${waveStats.peakSpeed.toFixed(2)}`);
  console.log(`🛡️ PLAYER: HP: ${waveStats.startPlayerHp.toFixed(0)}->${endHp.toFixed(0)} | Shield: ${waveStats.startPlayerShield.toFixed(0)}->${endShield.toFixed(0)} | Dmg Taken: ${waveStats.damageTaken.toFixed(0)}`);
  console.log(`🎁 LOOT: Medkits: ${waveStats.medkitsCollected} | Kevlar: ${waveStats.kevlarCollected}`);
  console.log(`⛔ DEATHS: ${waveStats.deaths}`);
  console.log(`✔️ VALIDATION:`);
  console.log(`   - Walker HP Cap (${walkerHpCap.toFixed(1)}): Peak was ${waveStats.peakWalkerHp.toFixed(1)} -> ${walkerHpValid ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   - Runner Speed Cap (${runnerSpeedCap.toFixed(2)}): Peak was ${waveStats.peakRunnerSpeed.toFixed(2)} -> ${runnerSpeedValid ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`====================================================\n`);
}

/* ── STAGE 4: WAVE PROGRESSION, COMPOSITION & SCALING CONFIGURATION ── */
const WAVE_SCALING_CONFIG = {
  maxActiveZombies: 48,
  minSpawnDist: 18,
  maxSpawnDist: 28,
  minZombieSeparation: 1.65,
  baseSpawnInterval: 0.84,
  minSpawnInterval: 0.20,
  spawnIntervalDecay: 0.035,
  prepInterval: 3.0,
  hpScalePerWave: 0.06,
  softCapWave: 15,
  lateHpScalePerWave: 0.02,
  maxHpMult: 3.5,
  dmgScalePerWave: 0.04,
  maxDmgMult: 3.0,
  speedScalePerWave: 0.020,
  maxSpeedMult: 1.62,
  rewardScalePerWave: 0.035,
  scoreScalePerWave: 0.08,
  // Milestone difficulty tier: every 5 waves (5, 10, 15, ...) zombies gain extra HP and damage
  tierHpPerStep: 0.08,
  tierDmgPerStep: 0.10
};

function getWaveTierMultipliers(wave: number) {
  const steps = Math.floor(Math.max(1, wave) / 5);
  return {
    steps,
    hpMult: 1 + steps * WAVE_SCALING_CONFIG.tierHpPerStep,
    dmgMult: 1 + steps * WAVE_SCALING_CONFIG.tierDmgPerStep
  };
}

function getWaveDifficultyMultipliers(wave: number) {
  const w = Math.max(1, wave) - 1;
  const earlyW = Math.min(w, WAVE_SCALING_CONFIG.softCapWave);
  const lateW = Math.max(0, w - WAVE_SCALING_CONFIG.softCapWave);

  const tier = getWaveTierMultipliers(wave);
  const hpMult = Math.min(
    WAVE_SCALING_CONFIG.maxHpMult,
    tier.hpMult * (1 + earlyW * WAVE_SCALING_CONFIG.hpScalePerWave + lateW * WAVE_SCALING_CONFIG.lateHpScalePerWave)
  );
  const dmgMult = Math.min(
    WAVE_SCALING_CONFIG.maxDmgMult,
    tier.dmgMult * (1 + w * WAVE_SCALING_CONFIG.dmgScalePerWave)
  );
  const speedMult = Math.min(
    WAVE_SCALING_CONFIG.maxSpeedMult,
    1 + w * WAVE_SCALING_CONFIG.speedScalePerWave
  );
  const rewardMult = 1 + w * WAVE_SCALING_CONFIG.rewardScalePerWave;
  const scoreMult = 1 + w * WAVE_SCALING_CONFIG.scoreScalePerWave;
  const spawnInterval = Math.max(
    WAVE_SCALING_CONFIG.minSpawnInterval,
    WAVE_SCALING_CONFIG.baseSpawnInterval - w * WAVE_SCALING_CONFIG.spawnIntervalDecay
  );

  return { hpMult, dmgMult, speedMult, rewardMult, scoreMult, spawnInterval };
}

function buildWaveComposition(wave: number): string[] {
  const queue: string[] = [];
  const pushMany = (type: string, count: number) => {
    for (let i = 0; i < count; i++) queue.push(type);
  };

  if (wave === 1) {
    pushMany('walker', 10);
  } else if (wave === 2) {
    pushMany('walker', 12);
    pushMany('runner', 4);
  } else if (wave === 3) {
    pushMany('walker', 11);
    pushMany('runner', 5);
    pushMany('crawler', 3);
  } else if (wave === 4) {
    pushMany('walker', 12);
    pushMany('runner', 4);
    pushMany('armored', 3);
    pushMany('toxic', 3);
  } else if (wave === 5) {
    pushMany('walker', 15);
    pushMany('runner', 5);
    pushMany('crawler', 2);
    pushMany('armored', 2);
    pushMany('toxic', 1);
  } else {
    // Waves 6+ Endless Structured Scaling across all 6 unlocked classes
    const clampedW = Math.min(wave, 40);
    // Smoother, less exponential curve. Targets ~89 zombies at Wave 15, ~113 at Wave 20, capping at 150.
    const total = Math.min(150, Math.floor(24 + wave * 3.2 + Math.pow(clampedW, 1.15) * 0.80));

    // Maintain enemy composition distribution
    const bruteCnt   = Math.min(14, Math.max(1, Math.floor(total * Math.min(0.12, 0.04 + (wave - 5) * 0.005))));
    const toxicCnt   = Math.floor(total * Math.min(0.16, 0.10 + (wave - 5) * 0.004));
    const armoredCnt = Math.floor(total * Math.min(0.18, 0.11 + (wave - 5) * 0.005));
    const crawlerCnt = Math.floor(total * 0.14);
    const runnerCnt  = Math.floor(total * 0.22);
    const walkerCnt  = Math.max(4, total - (bruteCnt + toxicCnt + armoredCnt + crawlerCnt + runnerCnt));

    pushMany('walker', walkerCnt);
    pushMany('runner', runnerCnt);
    pushMany('crawler', crawlerCnt);
    pushMany('armored', armoredCnt);
    pushMany('toxic', toxicCnt);
    pushMany('brute', bruteCnt);
  }

  // Shuffle composition so enemy classes spawn in varied tactical groups
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = queue[i];
    queue[i] = queue[j];
    queue[j] = tmp;
  }

  return queue;
}

function isPositionOnScreen(x: number, z: number, margin = 0.15): boolean {
  if (!camera) return false;
  _screenProjVec.set(x, 0.9, z);
  _screenProjVec.project(camera);
  return _screenProjVec.z > -1.0 && _screenProjVec.z < 1.0 &&
         _screenProjVec.x >= (-1.0 - margin) && _screenProjVec.x <= (1.0 + margin) &&
         _screenProjVec.y >= (-1.0 - margin) && _screenProjVec.y <= (1.0 + margin);
}

function findSafeSpawnPosition(hitR: number) {
  const px = player ? player.root.position.x : 0;
  const pz = player ? player.root.position.z : 0;
  const minD = WAVE_SCALING_CONFIG.minSpawnDist;
  const maxD = WAVE_SCALING_CONFIG.maxSpawnDist;
  const minSep = WAVE_SCALING_CONFIG.minZombieSeparation;

  let chosenX = px + minD;
  let chosenZ = pz;

  for (let attempt = 0; attempt < 24; attempt++) {
    const a = Math.random() * TAU;
    const d = minD + Math.random() * (maxD - minD);
    const cx = px + Math.sin(a) * d;
    const cz = pz + Math.cos(a) * d;

    // Guaranteed outside camera field of view
    if (isPositionOnScreen(cx, cz, 0.15)) continue;

    let blocked = false;
    for (let i = 0; i < activeObstacles.length; i++) {
      const o = activeObstacles[i];
      if (o.hw && o.hd) {
        if (Math.abs(cx - o.x) < o.hw + hitR + 0.45 && Math.abs(cz - o.z) < o.hd + hitR + 0.45) {
          blocked = true;
          break;
        }
      } else {
        if (Math.hypot(cx - o.x, cz - o.z) < hitR + o.r + 0.45) {
          blocked = true;
          break;
        }
      }
    }
    if (blocked) continue;

    for (let i = 0; i < zombies.length; i++) {
      const z = zombies[i];
      if (Math.hypot(cx - z.root.position.x, cz - z.root.position.z) < hitR + z.hitR + minSep) {
        blocked = true;
        break;
      }
    }
    if (!blocked) {
      return { x: cx, z: cz };
    }
    chosenX = cx;
    chosenZ = cz;
  }

  const fallbackPos = { x: chosenX, z: chosenZ };
  collideObstacles(fallbackPos, hitR);
  return fallbackPos;
}

/* Game state */
function resetRun() {
  stopAllZombieGroans();
  zombies.forEach(z => scene.remove(z.root));
  dyingZombies.forEach(d => scene.remove(d.root));
  toxicPools.forEach(tp => { scene.remove(tp.mesh); tp.mat?.dispose?.(); });
  bullets.forEach(b => scene.remove(b.mesh));
  enemyBullets.forEach(b => scene.remove(b.mesh));
  particles.forEach(p => { scene.remove(p.mesh); p.mesh.material?.dispose?.(); });
  pickups.forEach(p => scene.remove(p.mesh));
  thrownGrenades.forEach(g => scene.remove(g.mesh));
  shockwaves.forEach(sw => { scene.remove(sw.mesh); sw.mesh.material?.dispose?.(); });
  zombies = []; dyingZombies = []; toxicPools = []; bullets = []; enemyBullets = []; particles = []; pickups = []; thrownGrenades = []; shockwaves = [];
  companionPushList = [];
  disposeCompanion();

  meta = loadMeta();
  applyPlayerSkin();
  player.root.position.set(0, 0, 0);
  player.root.rotation.y = 0;
  player.vx = 0; player.vz = 0;
  player.moveBob = 0; player.hurtTimer = 0; player.shootCd = 0; player.muzzle = 0; player.angle = 0;

  let startWep = meta?.equippedWeapon || 'carbine';
  const ownedWeps = getOwnedWeapons(meta);
  if (!ownedWeps.includes(startWep)) startWep = 'carbine';
  player.weapon = startWep;
  player.maxAmmo = weapons[startWep]?.maxAmmo || 30;
  player.ammo = player.maxAmmo;
  player.reloadCd = 0;
  player.reloadTotal = 0;
  player.minigunSpin = 0;

  if (meta?.hasKevlar && meta?.equippedGear === 'kevlar') {
    const kLvl = meta?.kevlarLevel || 1;
    player.maxHp = 135 + kLvl * 15;
    player.hp = player.maxHp;
    player.maxShield = 80 + kLvl * 20;
    player.shield = player.maxShield;
  } else {
    player.maxHp = 100;
    player.hp = 100;
    player.maxShield = 100;
    player.shield = 0;
  }
  player.compBarrier = 0;
  player.compBarrierMax = 0;
  player.compBarrierT = 0;
  updatePlayerWeapon();

  screenFlash = 0; shake = 0; hitStopTimer = 0; hurtVignette = 0;

  run = {
    wave: 1,
    score: 0,
    bones: 0,
    kills: 0,
    waveQueue: [] as string[],
    waveTotal: 0,
    waveSpawned: 0,
    waveLeft: 0,
    spawnCd: 0.95,
    nextWaveCd: 0,
    combo: 0,
    comboT: 0,
    overchargeTimer: 0,
    cryoTimer: 0,
    revivedOnce: false,
    bossRequired: false,
    bossSpawnedThisWave: false,
    bossDefeated: false,
    waveCompleted: false
  };

  refreshChunks();
  startWave(1, true);
  updateHUD();
}

/* ── PHASE 5: BOSS & MINI-BOSS ARCHETYPES ── */
const MINIBOSS_ARCHETYPES = [
  {
    id: 'juggernaut_mini',
    name: 'JUGGERNAUT BRUTE',
    subtitle: 'HEAVY SHOCKWAVE MINI-BOSS',
    baseType: 'brute',
    hp: 720,
    speed: 1.58,
    damage: 26,
    reward: 18,
    score: 360,
    scale: 1.88,
    hitR: 1.38,
    atkRange: 2.25,
    armorResist: 0.20,
    headshotMult: 1.55,
    smashRadius: 3.8,
    smashDamage: 20,
    smashWindup: 0.65,
    smashCd: 5.5,
    auraKey: 'mini',
    forcedSkin: {
      id: 'mb_juggernaut', name: 'Juggernaut Brute', rarity: 'epic' as ZombieSkinRarity,
      classes: ['brute'], skin: 0x4e665c, shirt: 0x241818, pants: 0x181c22, boot: 0x2c2420,
      eye: 0xff6600, hair: 0x120e0c, armor: 0x423028, hat: 'spikes', accessory: 'heavy_pauldrons'
    }
  },
  {
    id: 'riot_mini',
    name: 'IRONCLAD WARDEN',
    subtitle: 'HEAVILY ARMORED MINI-BOSS',
    baseType: 'brute',
    hp: 950,
    speed: 1.52,
    damage: 28,
    reward: 22,
    score: 450,
    scale: 1.78,
    hitR: 1.32,
    atkRange: 2.18,
    armorResist: 0.55,
    headshotMult: 2.10,
    smashRadius: 3.5,
    smashDamage: 20,
    smashWindup: 0.60,
    smashCd: 5.8,
    auraKey: 'armored',
    forcedSkin: {
      id: 'mb_warden', name: 'Ironclad Warden', rarity: 'epic' as ZombieSkinRarity,
      classes: ['brute'], skin: 0x566c62, shirt: 0x1e2b38, pants: 0x151e28, boot: 0x1a2026,
      eye: 0x38b6ff, hair: 0x101418, armor: 0x3a4e60, hat: 'riot_visor', accessory: 'chest_plate'
    }
  },
  {
    id: 'blight_mini',
    name: 'VENOM SPITTER',
    subtitle: 'BIO-ACID MINI-BOSS',
    baseType: 'brute',
    hp: 1100,
    speed: 1.65,
    damage: 25,
    reward: 25,
    score: 520,
    scale: 1.80,
    hitR: 1.34,
    atkRange: 2.20,
    armorResist: 0.15,
    headshotMult: 1.65,
    smashRadius: 3.9,
    smashDamage: 18,
    smashWindup: 0.65,
    smashCd: 5.4,
    auraKey: 'toxic',
    forcedSkin: {
      id: 'mb_venom', name: 'Venom Spitter', rarity: 'epic' as ZombieSkinRarity,
      classes: ['brute'], skin: 0x4a8268, shirt: 0x18362a, pants: 0x12261e, boot: 0x243c32,
      eye: 0x39ff14, hair: 0x0c1a12, armor: 0x225538, sac1: 0x22bb66, sac2: 0x39ff14,
      hat: 'gas_mask', accessory: 'bio_blisters'
    }
  },
  {
    id: 'stalker_mini',
    name: 'CRIMSON RAVAGER',
    subtitle: 'FRENZY MUTANT MINI-BOSS',
    baseType: 'brute',
    hp: 1250,
    speed: 1.95,
    damage: 30,
    reward: 28,
    score: 600,
    scale: 1.74,
    hitR: 1.28,
    atkRange: 2.15,
    armorResist: 0.20,
    headshotMult: 1.70,
    smashRadius: 3.6,
    smashDamage: 22,
    smashWindup: 0.55,
    smashCd: 4.8,
    auraKey: 'mutated',
    forcedSkin: {
      id: 'mb_ravager', name: 'Crimson Ravager', rarity: 'epic' as ZombieSkinRarity,
      classes: ['brute'], skin: 0x5e2832, shirt: 0x281016, pants: 0x1a0a0e, boot: 0x321218,
      eye: 0xff1744, hair: 0x120608, armor: 0x4a1420, skinEmit: 0x550011, skinEmitI: 0.35,
      hat: 'crown_horns', accessory: 'back_spines'
    }
  }
];

const BOSS_ARCHETYPES = [
  {
    id: 'heavy_brute_boss',
    name: 'TITAN ABOMINATION',
    subtitle: 'COLOSSAL BRUTE BOSS DETECTED',
    baseType: 'boss',
    hp: 1450,
    speed: 1.62,
    damage: 34,
    reward: 24,
    score: 750,
    scale: 2.42,
    hitR: 1.72,
    atkRange: 2.60,
    armorResist: 0.20,
    headshotMult: 1.55,
    smashRadius: 4.6,
    smashDamage: 24,
    smashWindup: 0.72,
    smashCd: 5.2,
    auraKey: 'brute',
    forcedSkin: {
      id: 'boss_titan_skin', name: 'Titan Abomination', rarity: 'legendary' as ZombieSkinRarity,
      classes: ['boss'], skin: 0x421c24, shirt: 0x220d12, pants: 0x14080c, boot: 0x3a1018,
      eye: 0xff0044, hair: 0x0a0406, armor: 0x4a1822, skinEmit: 0x440008, skinEmitI: 0.30,
      hat: 'spikes', accessory: 'heavy_pauldrons'
    }
  },
  {
    id: 'toxic_boss',
    name: 'PLAGUE COLOSSUS',
    subtitle: 'BIO-HAZARD BOSS DETECTED',
    baseType: 'boss',
    hp: 1850,
    speed: 1.58,
    damage: 32,
    reward: 28,
    score: 950,
    scale: 2.36,
    hitR: 1.68,
    atkRange: 2.55,
    armorResist: 0.18,
    headshotMult: 1.60,
    smashRadius: 4.3,
    smashDamage: 22,
    smashWindup: 0.70,
    smashCd: 5.6,
    auraKey: 'toxic',
    forcedSkin: {
      id: 'boss_plague_skin', name: 'Plague Colossus', rarity: 'legendary' as ZombieSkinRarity,
      classes: ['boss'], skin: 0x2e5c46, shirt: 0x142c22, pants: 0x0e1e18, boot: 0x1c382c,
      eye: 0x39ff14, hair: 0x08140e, armor: 0x1e4a34, sac1: 0x22cc55, sac2: 0x39ff14,
      skinEmit: 0x0f3d1e, skinEmitI: 0.40, hat: 'gas_mask', accessory: 'bio_blisters'
    }
  },
  {
    id: 'armored_boss',
    name: 'SIEGE DREADNOUGHT',
    subtitle: 'FORTRESS ARMORED BOSS DETECTED',
    baseType: 'boss',
    hp: 2100,
    speed: 1.48,
    damage: 38,
    reward: 32,
    score: 1150,
    scale: 2.44,
    hitR: 1.75,
    atkRange: 2.62,
    armorResist: 0.60,
    headshotMult: 2.25,
    smashRadius: 4.2,
    smashDamage: 26,
    smashWindup: 0.68,
    smashCd: 5.4,
    auraKey: 'armored',
    forcedSkin: {
      id: 'boss_dreadnought_skin', name: 'Siege Dreadnought', rarity: 'legendary' as ZombieSkinRarity,
      classes: ['boss'], skin: 0x485866, shirt: 0x1c2632, pants: 0x121820, boot: 0x161c24,
      eye: 0x00e5ff, hair: 0x0e1216, armor: 0x3c5266, skinMetal: 0.45, skinRough: 0.42,
      hat: 'riot_visor', accessory: 'chest_plate'
    }
  },
  {
    id: 'mutated_boss',
    name: 'APEX OVERLORD',
    subtitle: 'APEX MUTATED BOSS DETECTED',
    baseType: 'boss',
    hp: 2500,
    speed: 1.74,
    damage: 40,
    reward: 38,
    score: 1400,
    scale: 2.48,
    hitR: 1.78,
    atkRange: 2.68,
    armorResist: 0.28,
    headshotMult: 1.75,
    smashRadius: 4.5,
    smashDamage: 28,
    smashWindup: 0.65,
    smashCd: 5.0,
    auraKey: 'mutated',
    forcedSkin: {
      id: 'boss_overlord_skin', name: 'Apex Overlord', rarity: 'legendary' as ZombieSkinRarity,
      classes: ['boss'], skin: 0x3b1642, shirt: 0x1e0a26, pants: 0x120618, boot: 0x280c32,
      eye: 0xe040fb, hair: 0x0a030e, armor: 0x4a1259, skinEmit: 0x4a0072, skinEmitI: 0.48,
      hat: 'crown_horns', accessory: 'back_spines'
    }
  }
];

function getMiniBossArchetype(waveNum: number) {
  const index = Math.max(0, Math.floor((waveNum - 5) / 10)) % MINIBOSS_ARCHETYPES.length;
  return MINIBOSS_ARCHETYPES[index];
}

function getBossArchetype(waveNum: number) {
  const index = Math.max(0, Math.floor(waveNum / 10) - 1) % BOSS_ARCHETYPES.length;
  return BOSS_ARCHETYPES[index];
}

function attachBossArchetypeVisuals(z: any, arch: any) {
  if (!z || !z.torso || !z.headPiv) return;
  const torso = z.torso;
  const head = z.headPiv;

  // Ground identification aura ring
  const auraMat = bossAuraMats[arch.auraKey] || bossAuraMats.brute;
  const auraRing = new THREE.Mesh(bossAuraRingGeo, auraMat);
  auraRing.rotation.x = -Math.PI / 2;
  auraRing.position.y = 0.03;
  auraRing.scale.setScalar(1.18);
  z.root.add(auraRing);
  z.auraRing = auraRing;

  if (arch.id === 'heavy_brute_boss' || arch.id === 'juggernaut_mini') {
    const steelM = mat(0x3a2024, 0.45, 0.65);
    const glowM = mat(0xff2244, 0.2, 0, 0xff1744, 1.3);
    // Colossal spiked shoulder pauldrons & chest core
    box(0.32, 0.22, 0.56, steelM, -0.52, 0.44, 0, torso);
    box(0.32, 0.22, 0.56, steelM,  0.52, 0.44, 0, torso);
    cyl(0.02, 0.08, 0.28, 6, glowM, -0.54, 0.64, 0, torso);
    cyl(0.02, 0.08, 0.28, 6, glowM,  0.54, 0.64, 0, torso);
    box(0.28, 0.24, 0.08, glowM, 0, 0.14, 0.26, torso);
  } else if (arch.id === 'toxic_boss' || arch.id === 'blight_mini') {
    const sacM1 = mat(0x22cc55, 0.3, 0, 0x22cc55, 1.1);
    const sacM2 = mat(0x39ff14, 0.2, 0, 0x39ff14, 1.6);
    // Twin oversized bio-chemical dorsal tanks & glowing veins
    cyl(0.18, 0.18, 0.62, 10, sacM1, -0.22, 0.12, -0.34, torso);
    cyl(0.18, 0.18, 0.62, 10, sacM1,  0.22, 0.12, -0.34, torso);
    sph(0.16, 8, 8, sacM2, -0.44, 0.42, 0.06, torso);
    sph(0.16, 8, 8, sacM2,  0.44, 0.42, 0.06, torso);
    sph(0.12, 8, 8, sacM2,  0, 0.14, 0.28, torso);
  } else if (arch.id === 'armored_boss' || arch.id === 'riot_mini') {
    const plateM = mat(0x34495e, 0.32, 0.78);
    const visorM = mat(0x00e5ff, 0.15, 0.2, 0x00e5ff, 1.5);
    // Fortress chest armor, shoulder shields & glowing tactical visor
    box(0.88, 0.68, 0.56, plateM, 0, 0.08, 0.02, torso);
    box(0.30, 0.36, 0.58, plateM, -0.54, 0.34, 0, torso);
    box(0.30, 0.36, 0.58, plateM,  0.54, 0.34, 0, torso);
    box(0.60, 0.38, 0.56, plateM, 0, 0.16, 0, head);
    box(0.46, 0.10, 0.06, visorM, 0, 0.12, 0.29, head);
  } else if (arch.id === 'mutated_boss' || arch.id === 'stalker_mini') {
    const boneM = mat(0xdcd0ff, 0.65);
    const mutM = mat(0xd500f9, 0.2, 0, 0xd500f9, 1.45);
    // Curved crown horns, dorsal mutation spines & glowing core
    cyl(0.02, 0.09, 0.42, 6, boneM, -0.22, 0.52, 0.06, head);
    cyl(0.02, 0.09, 0.42, 6, boneM,  0.22, 0.52, 0.06, head);
    for (const sy of [-0.16, 0.06, 0.28]) {
      cyl(0.02, 0.08, 0.34, 6, mutM, 0, sy, -0.32, torso);
    }
    sph(0.16, 8, 8, mutM, 0, 0.12, 0.27, torso);
  }
}

function startWave(n, first = false) {
  const waveNum = Math.max(1, Math.floor(n));
  const queue = buildWaveComposition(waveNum);
  const isMainBossWave = waveNum % 10 === 0;
  const isMiniBossWave = waveNum % 5 === 0 && !isMainBossWave;
  const hasMilestoneBoss = isMainBossWave || isMiniBossWave;

  run.wave = waveNum;
  run.waveQueue = queue;
  run.waveLeft = queue.length;
  run.waveTotal = queue.length + (hasMilestoneBoss ? 1 : 0);
  run.waveSpawned = 0;
  run.spawnCd = first ? 1.0 : 0.45;
  run.nextWaveCd = 0;
  run.bossRequired = hasMilestoneBoss;
  run.bossSpawnedThisWave = false;
  run.bossDefeated = !hasMilestoneBoss;
  run.waveCompleted = false;

  player.hp = clamp(player.hp + 12, 0, player.maxHp);

  if (isMainBossWave) {
    const arch = getBossArchetype(waveNum);
    showBanner(`BOSS WAVE ${waveNum}: ${arch.name}`, arch.subtitle);
  } else if (isMiniBossWave) {
    const arch = getMiniBossArchetype(waveNum);
    showBanner(`MINI-BOSS WAVE ${waveNum}: ${arch.name}`, arch.subtitle);
  } else {
    const subMsg =
      waveNum === 1 ? 'Standard Walkers approaching' :
      waveNum === 2 ? 'Fast Runners joining the horde' :
      waveNum === 3 ? 'Low Crawlers spotted in the dark' :
      waveNum === 4 ? 'Armored & Toxic infected detected' :
      'Escalating multi-class horde incoming';
    showBanner('WAVE ' + waveNum, subMsg);
  }

  metaMax('bestWave', waveNum);
  sfx.horn();

  if (isMainBossWave) {
    spawnBossZombie(false);
    if (sfx && sfx.zombieGroan) sfx.zombieGroan('boss');
  } else if (isMiniBossWave) {
    spawnBossZombie(true);
    if (sfx && sfx.zombieGroan) sfx.zombieGroan('brute');
  }
  updateHUD();
}

function startGame() {
  meta = loadMeta();
  initAudio();
  playProceduralMusic();
  meta.sessions = (meta.sessions || 0) + 1;
  saveMeta();
  resetRun();
  screen = 'game';
  paused = false;
  _this.callbacks.onStateChange('game');
}
function restartGame() {
  initAudio();
  playProceduralMusic();
  resetRun();
  screen = 'game';
  paused = false;
  _this.callbacks.onStateChange('game');
  
  
  
}
function toMenu() {
  stopMusic();
  disposeCompanion();
  screen = 'menu';
  paused = false;
  _this.callbacks.onStateChange('menu');
  renderMeta();
  renderMissions();
  initAudio();
  playMenuMusic();
}
let lastSettingsToggle = 0;
function togglePause(force) {
  if (screen !== 'game') return;
  const now = Date.now();
  if (now - lastSettingsToggle < 400) return;
  lastSettingsToggle = now;

  paused = typeof force === 'boolean' ? force : !paused;
  if (paused) {
    stopAllZombieGroans();
    _this.callbacks.onStateChange('pause');
  } else {
    _this.callbacks.onStateChange('game');
  }
  if (paused) {
    mouse.down = false;
    Object.keys(touch).forEach(k => touch[k] = false);
    joystick.active = false;
    joystick.dx = 0;
    joystick.dy = 0;
    if (jKnob) {
      jKnob.style.transform = 'translate(-50%, -50%)';
      jKnob.classList.remove('active');
    }
  }
  initAudio();
  playProceduralMusic(); // Keep music playing in background when paused!
  sfx.ui();
}
function gameOver() {
  if (screen !== 'game') return;
  screen = 'over';
  stopAllZombieGroans();
  
  _this.callbacks.onStateChange('gameover');
  if (dom.ovWave) dom.ovWave.textContent = run.wave;
  if (dom.ovKills) dom.ovKills.textContent = run.kills;
  if (dom.ovScore) dom.ovScore.textContent = run.score;
  if (dom.ovBones) dom.ovBones.textContent = run.bones;
  if (dom.recordLine) dom.recordLine.textContent = run.score >= meta.bestScore ? 'New high score achieved.' : 'Best wave: ' + meta.bestWave + ' · Best score: ' + meta.bestScore;
  metaMax('bestScore', run.score);
  saveMeta();
  renderMeta();
  renderMissions();
  sfx.gameOver();
}

/* UI rendering */
function renderMeta() {
  if (dom.vaultBones) dom.vaultBones.textContent = meta.bankBones;
  if (dom.bestWave) dom.bestWave.textContent = meta.bestWave;
  if (dom.bestScore) dom.bestScore.textContent = meta.bestScore;
  if (dom.totalKills) dom.totalKills.textContent = meta.totalKills;
}
function missionProgress(def) { return clamp(meta[def.key] || 0, 0, def.target); }
function missionClaimed(def) { return !!meta.claimed[def.id]; }
function canClaim(def) { return !missionClaimed(def) && (meta[def.key] || 0) >= def.target; }
function claimMission(id) {
  const def = missionDefs.find(m => m.id === id);
  if (!def || !canClaim(def)) return;
  meta.claimed[id] = true;
  meta.bankBones += def.reward;
  saveMeta();
  renderMeta();
  renderMissions();
  toast('Mission claimed: +' + def.reward + ' bones');
  sfx.ui();
}
function renderMissions() {
  if (!dom.missionGrid) return;
  dom.missionGrid.innerHTML = '';
  const sorted = [...missionDefs].sort((a, b) => {
    const canA = canClaim(a);
    const canB = canClaim(b);
    if (canA && !canB) return -1;
    if (!canA && canB) return 1;
    const doneA = missionClaimed(a);
    const doneB = missionClaimed(b);
    if (!doneA && doneB) return -1;
    if (doneA && !doneB) return 1;
    return 0;
  });
  sorted.forEach(def => {
    const done = missionClaimed(def);
    const prog = missionProgress(def);
    const el = document.createElement('div');
    el.className = 'mission' + (done ? ' done' : '');
    el.innerHTML = `
      <div class="mission-top">
        <div>
          <div class="mission-name">${def.title}</div>
          <div class="mission-desc">${def.desc}</div>
        </div>
        <div class="reward">+${def.reward} bones</div>
      </div>
      <div class="progress"><div style="width:${(prog / def.target) * 100}%"></div></div>
      <div class="kv" style="margin:0"><span>Progress</span><span>${done ? 'Claimed' : `${prog} / ${def.target}`}</span></div>
    `;
    const btn = document.createElement('button');
    btn.className = 'btn small claim' + (canClaim(def) ? ' ready' : '');
    btn.textContent = done ? 'Claimed' : (canClaim(def) ? 'Claim Reward' : 'Locked');
    btn.disabled = !canClaim(def);
    btn.addEventListener('click', () => claimMission(def.id));
    el.appendChild(btn);
    dom.missionGrid.appendChild(el);
  });
}
function toast(text) {
  if (_this.callbacks && _this.callbacks.onToast) {
    _this.callbacks.onToast(text);
    return;
  }
  if (!dom.toastWrap) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  dom.toastWrap.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}
function showBanner(title, sub) { if(_this.callbacks.onBanner) _this.callbacks.onBanner(title, sub); }
function updateHUD() {
  if (_this.callbacks && _this.callbacks.onHUDUpdate) {
    const curWep = player ? player.weapon : 'carbine';
    const wepDef = weapons[curWep] || weapons.carbine;
    const curAmmo = player && typeof player.ammo === 'number' ? player.ammo : (wepDef.maxAmmo || 35);
    const maxA = wepDef.maxAmmo || 35;
    const isRel = player ? player.reloadCd > 0 : false;
    const activeBoss = zombies ? zombies.find(z => (z.type === 'boss' || z.isMiniBoss) && z.hp > 0) : null;
    const wepLvl = getWeaponLevel(curWep, meta);
    const compId = getActiveCompanionId(meta);
    const compLvl = compId !== 'none' ? getCompanionLevel(compId, meta) : 1;
    let compExtra = '';
    if (companion && compId === 'medic') {
      compExtra = `${companion.chargesLeft || 0} left`;
    } else if (companion && compId === 'robot' && player && player.compBarrier > 0) {
      compExtra = `${Math.ceil(player.compBarrier)} HP`;
    }
    const remainingEnemies = run ? Math.max(0, (run.waveLeft || 0) + (zombies ? zombies.length : 0)) : 0;

    _this.callbacks.onHUDUpdate({
      playerLevel: meta?.playerLevel || 3,
      hp: player ? player.hp : 100,
      maxHp: player ? player.maxHp : 100,
      shield: player ? player.shield : 0,
      maxShield: player ? player.maxShield : 100,
      grenades: meta?.equippedGrenades !== false ? (meta?.grenadesCount || 0) : 0,
      overcharge: run ? run.overchargeTimer || 0 : 0,
      cryo: run ? run.cryoTimer || 0 : 0,
      boss: activeBoss ? { name: activeBoss.bossName || (activeBoss.isMiniBoss ? 'JUGGERNAUT BRUTE' : 'TITAN ABOMINATION'), hp: activeBoss.hp, maxHp: activeBoss.maxHp } : null,
      weapon: wepDef.name || 'Carbine',
      weaponKey: curWep,
      weaponLevel: wepLvl,
      companion: compId,
      companionLevel: compLvl,
      companionExtra: compExtra,
      ammo: curAmmo,
      maxAmmo: maxA,
      isReloading: isRel,
      wave: run ? run.wave : 1,
      kills: run ? run.kills : 0,
      left: remainingEnemies,
      score: run ? run.score : 0,
      bones: run ? run.bones : 0
    });
  }
}

/* Input setup */
function setMouseAimFromEvent(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.nx = (mouse.x / window.innerWidth) * 2 - 1;
  mouse.ny = -(mouse.y / window.innerHeight) * 2 + 1;
  const ch = document.getElementById('crosshair');
  if (ch) {
    ch.style.left = mouse.x + 'px';
    ch.style.top = mouse.y + 'px';
  }
  mouse.active = true;
}

window.addEventListener('keydown', e => {
  if (e.code) keys[e.code] = true;
  if (e.key) {
    keys[e.key] = true;
    keys[e.key.toLowerCase()] = true;
  }
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '].includes(e.code) || ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
  const codeLow = (e.code || '').toLowerCase();
  const keyLow = (e.key || '').toLowerCase();
  if ((codeLow === 'keyr' || keyLow === 'r') && screen === 'game') {
    if (_this && _this.reloadWeapon) _this.reloadWeapon();
  }
  if ((codeLow === 'keyg' || keyLow === 'g') && screen === 'game') {
    if (_this && _this.throwGrenade) _this.throwGrenade();
  }
  if ((codeLow === 'keyq' || codeLow === 'keye' || keyLow === 'q' || keyLow === 'e') && screen === 'game') {
    if (_this && _this.swapWeapon) _this.swapWeapon();
  }
  if ((codeLow === 'keyp' || codeLow === 'escape' || keyLow === 'p' || keyLow === 'escape') && screen === 'game') togglePause();
  if ((codeLow === 'enter' || keyLow === 'enter') && screen === 'menu') startGame();
}, { passive: false });

window.addEventListener('keyup', e => {
  if (e.code) keys[e.code] = false;
  if (e.key) {
    keys[e.key] = false;
    keys[e.key.toLowerCase()] = false;
  }
});
window.addEventListener('blur', () => {
  mouse.down = false;
  Object.keys(keys).forEach(k => keys[k] = false);
  Object.keys(touch).forEach(k => touch[k] = false);
  joystick.active = false; joystick.dx = 0; joystick.dy = 0;
  const jk = document.getElementById('joystickKnob');
  if (jk) {
    jk.style.transform = 'translate(-50%, -50%)';
    jk.classList.remove('active');
  }
  if (screen === 'game' && !paused) togglePause(true);
});
window.addEventListener('mousemove', e => setMouseAimFromEvent(e));
window.addEventListener('mousedown', e => {
  initAudio();
  if (paused || screen !== 'game') return;
  if (e.target && e.target.closest && e.target.closest('button, .overlay, .pe, #firePad, #joystickZone, #settingsBtn, .zbh-tr-settings-btn, #pauseScreen, .zbh-pause-overlay, .zbh-modal-backdrop')) return;
  mouse.down = true;
  setMouseAimFromEvent(e);
});
window.addEventListener('mouseup', () => { mouse.down = false; });
window.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('pointerdown', initAudio, { once: true });

/* ── Virtual Joystick (right side) ── */
const joystick = { active: false, touchId: null, cx: 0, cy: 0, dx: 0, dy: 0 };
const jZone = $('joystickZone');
const jKnob = $('joystickKnob');
const JRADIUS = 22; // max knob travel px (2x smaller joystick)

function jStart(e) {
  if (paused || screen !== 'game') return;
  if (e && e.target && e.target.closest && e.target.closest('#settingsBtn, .zbh-tr-settings-btn, #pauseScreen, .zbh-pause-overlay, .zbh-modal-backdrop')) return;
  e.preventDefault(); e.stopPropagation(); initAudio();
  const t = e.changedTouches ? e.changedTouches[0] : e;
  const rect = jZone ? jZone.getBoundingClientRect() : { left: 0, top: 0, width: 100, height: 100 };
  joystick.active = true;
  joystick.touchId = t.identifier !== undefined ? t.identifier : -1;
  joystick.cx = rect.left + rect.width / 2;
  joystick.cy = rect.top + rect.height / 2;
  if (jKnob) jKnob.classList.add('active');
  jMove(e);
}
function jMove(e) {
  if (paused || screen !== 'game') return;
  if (!joystick.active) return;
  e.preventDefault();
  let t = null;
  if (e.changedTouches) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystick.touchId) { t = e.changedTouches[i]; break; }
    }
    if (!t) return;
  } else { t = e; }
  let dx = t.clientX - joystick.cx;
  let dy = t.clientY - joystick.cy;
  const d = Math.hypot(dx, dy);
  if (d > JRADIUS) { dx = dx / d * JRADIUS; dy = dy / d * JRADIUS; }
  joystick.dx = dx / JRADIUS; // -1 to 1
  joystick.dy = dy / JRADIUS;
  if (jKnob) jKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
function jEnd(e) {
  e.preventDefault();
  if (e.changedTouches) {
    let found = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystick.touchId) { found = true; break; }
    }
    if (!found) return;
  }
  joystick.active = false;
  joystick.touchId = null;
  joystick.dx = 0;
  joystick.dy = 0;
  if (jKnob) {
    jKnob.style.transform = 'translate(-50%, -50%)';
    jKnob.classList.remove('active');
  }
}
if (jZone) {
  jZone.addEventListener('touchstart', jStart, { passive: false });
  jZone.addEventListener('touchmove', jMove, { passive: false });
  jZone.addEventListener('touchend', jEnd, { passive: false });
  jZone.addEventListener('touchcancel', jEnd, { passive: false });
}

/* ── Fire button (left side) ── */
(function bindFire() {
  const el = $('fireBtn');
  if (!el) return;
  const on = e => {
    if (paused || screen !== 'game') return;
    if (e && e.target && e.target.closest && e.target.closest('#settingsBtn, .zbh-tr-settings-btn, #pauseScreen, .zbh-pause-overlay, .zbh-modal-backdrop')) return;
    e.preventDefault(); e.stopPropagation(); touch.fire = true; el.classList.add('on'); initAudio();
  };
  const off = e => { e.preventDefault(); e.stopPropagation(); touch.fire = false; el.classList.remove('on'); };
  el.addEventListener('touchstart', on, { passive: false });
  el.addEventListener('touchend', off, { passive: false });
  el.addEventListener('touchcancel', off, { passive: false });
})();

/* ── Swap button ── */
$('swapBtn')?.addEventListener('touchstart', e => {
  if (paused || screen !== 'game') return;
  e.preventDefault(); e.stopPropagation(); initAudio();
  if (_this && _this.swapWeapon) _this.swapWeapon();
}, { passive: false });

/* Buttons */
document.querySelectorAll('.tabBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabBtn').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tabPage').forEach(p => p.classList.toggle('active', p.id === btn.dataset.tab));
  });
});
$('playBtn')?.addEventListener('click', startGame);
$('openMissionBtn')?.addEventListener('click', () => {
  document.querySelectorAll('.tabBtn').forEach(b => b.classList.toggle('active', b.dataset.tab === 'missionsTab'));
  document.querySelectorAll('.tabPage').forEach(p => p.classList.toggle('active', p.id === 'missionsTab'));
});
$('resumeBtn')?.addEventListener('click', () => togglePause(false));
$('restartBtnPause')?.addEventListener('click', restartGame);
$('menuBtnPause')?.addEventListener('click', toMenu);
$('restartBtn')?.addEventListener('click', restartGame);
$('menuBtn')?.addEventListener('click', toMenu);

/* Aim / camera / flashlight */
function updateAimPoint() {
  if (mouse.active) {
    raycaster.setFromCamera({ x: mouse.nx, y: mouse.ny }, camera);
    if (raycaster.ray.intersectPlane(groundPlane, pointerRayPoint)) {
      aimPoint.copy(pointerRayPoint);
    }
  } else {
    aimPoint.set(player.root.position.x + Math.sin(player.angle) * 8, 0, player.root.position.z + Math.cos(player.angle) * 8);
  }
}
function updateFlashlight() {
  const px = player.root.position.x, pz = player.root.position.z;
  const dirX = Math.sin(player.angle), dirZ = Math.cos(player.angle);
  flashlight.position.set(px + dirX * 0.45, 2.35, pz + dirZ * 0.45);
  flashlight.intensity = screen === 'game' ? 9.6 : 4.0;
  flashlightTarget.position.set(px + dirX * 16, 0.2, pz + dirZ * 16);
  if (playerAuraLight) {
    playerAuraLight.position.set(px, 2.5, pz);
  }
  muzzleLight.position.set(px + dirX * 0.7, 1.3, pz + dirZ * 0.7);
  muzzleLight.intensity = Math.max(0, player.muzzle * 2.8);
}
function updateCamera(dt) {
  const baseOffset = screen === 'menu' ? new THREE.Vector3(Math.sin(clock.elapsedTime * 0.12) * 18, 15, Math.cos(clock.elapsedTime * 0.12) * 18) : new THREE.Vector3(0, 18, -16);
  const targetPos = new THREE.Vector3();
  if (screen === 'menu') {
    targetPos.set(player.root.position.x + baseOffset.x, 16, player.root.position.z + baseOffset.z);
    camera.position.lerp(targetPos, 1 - Math.exp(-dt * 2.2));
    camera.lookAt(player.root.position.x, 1.2, player.root.position.z);
  } else {
    const tx = player.root.position.x, tz = player.root.position.z;
    targetPos.set(tx, 18, tz - 16);
    camera.position.lerp(targetPos, 1 - Math.exp(-dt * 7));
    if (shake > 0) {
      camera.position.x += rand(-shake, shake) * 0.18;
      camera.position.y += rand(-shake, shake) * 0.12;
      shake = Math.max(0, shake - dt * 6);
    }
    camera.lookAt(tx, 1.2, tz + 1.8);
  }
}

/* Physics and game helpers */
function collideObstacles(pos, radius) {
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < activeObstacles.length; i++) {
      const o = activeObstacles[i];
      if (o.hw && o.hd) {
        // Box obstacle (house / building) - 100% impenetrable walls and corners
        const minX = o.x - o.hw;
        const maxX = o.x + o.hw;
        const minZ = o.z - o.hd;
        const maxZ = o.z + o.hd;

        if (pos.x >= minX && pos.x <= maxX && pos.z >= minZ && pos.z <= maxZ) {
          // Center is inside the box: immediately eject out to nearest wall + radius
          const dLeft = pos.x - minX;
          const dRight = maxX - pos.x;
          const dBack = pos.z - minZ;
          const dFront = maxZ - pos.z;
          const minEdge = Math.min(dLeft, dRight, dBack, dFront);
          if (minEdge === dLeft) pos.x = minX - radius;
          else if (minEdge === dRight) pos.x = maxX + radius;
          else if (minEdge === dBack) pos.z = minZ - radius;
          else pos.z = maxZ + radius;
        } else {
          // Outside the box: resolve against closest boundary point
          const cx = Math.max(minX, Math.min(pos.x, maxX));
          const cz = Math.max(minZ, Math.min(pos.z, maxZ));
          const dx = pos.x - cx;
          const dz = pos.z - cz;
          const dSq = dx * dx + dz * dz;
          if (dSq < radius * radius && dSq > 0.00001) {
            const d = Math.sqrt(dSq);
            pos.x = cx + (dx / d) * radius;
            pos.z = cz + (dz / d) * radius;
          }
        }
      } else {
        // Circular obstacle (tree trunk, rock, barricade, street light)
        const dx = pos.x - o.x;
        const dz = pos.z - o.z;
        const minD = radius + o.r;
        const dSq = dx * dx + dz * dz;
        if (dSq < minD * minD && dSq > 0.00001) {
          const d = Math.sqrt(dSq);
          pos.x = o.x + (dx / d) * minD;
          pos.z = o.z + (dz / d) * minD;
        }
      }
    }
  }
}

function checkObstacleCollision(px: number, pz: number, radius: number): boolean {
  for (let i = 0; i < activeObstacles.length; i++) {
    const o = activeObstacles[i];
    if (o.hw && o.hd) {
      const minX = o.x - o.hw;
      const maxX = o.x + o.hw;
      const minZ = o.z - o.hd;
      const maxZ = o.z + o.hd;
      if (px >= minX - radius && px <= maxX + radius && pz >= minZ - radius && pz <= maxZ + radius) {
        const cx = Math.max(minX, Math.min(px, maxX));
        const cz = Math.max(minZ, Math.min(pz, maxZ));
        const dx = px - cx;
        const dz = pz - cz;
        if (dx * dx + dz * dz < radius * radius) {
          return true;
        }
      }
    } else {
      const dx = px - o.x;
      const dz = pz - o.z;
      const minD = radius + o.r;
      if (dx * dx + dz * dz < minD * minD) {
        return true;
      }
    }
  }
  return false;
}
function nearestZombie(maxDist) {
  let best = null, bestD = maxDist;
  for (const z of zombies) {
    const d = dist2(player.root.position.x, player.root.position.z, z.root.position.x, z.root.position.z);
    if (d < bestD) { bestD = d; best = z; }
  }
  return best;
}
function hurtPlayer(amount) {
  if (DEBUG_BALANCE && waveStats.active) {
    waveStats.damageTaken += amount;
  }

  let rem = amount;

  // Robot Companion Energy Barrier absorbs incoming damage before Shield & HP
  if (player.compBarrier > 0 && player.compBarrierT > 0) {
    const barAbsorbed = Math.min(player.compBarrier, rem);
    player.compBarrier -= barAbsorbed;
    rem -= barAbsorbed;
    spawnBurst(player.root.position.x, player.root.position.z, 0x38bdf8, 6, 0.4, 1.8);
    if (player.compBarrier <= 0) {
      player.compBarrier = 0;
      player.compBarrierT = 0;
      if (companion && companion.barrierMesh) companion.barrierMesh.visible = false;
      showToast('🛡️ Barrier Depleted!');
    }
  }

  if (player.shield > 0 && rem > 0) {
    const absorbed = Math.min(player.shield, rem);
    player.shield = clamp(player.shield - absorbed, 0, player.maxShield);
    rem -= absorbed;
  }
  if (rem > 0) {
    player.hp = clamp(player.hp - rem, 0, player.maxHp);
  }

  // Only apply pain screen flash, shake & sfx if damage actually penetrated barrier
  if (rem > 0) {
    player.hurtTimer = 2.2;
    shake = Math.min(0.9, shake + 0.32);
    screenFlash = Math.max(screenFlash, 0.65);
    hurtVignette = Math.min(1, Math.max(hurtVignette, 0.55 + Math.min(0.4, rem / 50)));
    try { if (navigator.vibrate) navigator.vibrate([40, 30, 60]); } catch (e) {}
    sfx.hurt();
  } else {
    // Barrier absorbed entirely: small spark feedback
    shake = Math.min(0.3, shake + 0.08);
  }
  updateHUD();
}

/* Projectiles */
function fireBullet(dir, wepKey: string, wLvl: number) {
  const weapon = weapons[wepKey] || weapons.carbine;
  const isSniper = wepKey === 'sniper';
  const isRocket = wepKey === 'rocket';
  const isShotgun = wepKey === 'shotgun';

  const geo = isRocket ? rocketProjGeo : isSniper ? sniperBulletGeo : bulletGeo;
  const bMat = bulletMats[wepKey] || bulletMats.carbine;
  const mesh = new THREE.Mesh(geo, bMat);

  mesh.position.set(
    player.root.position.x + dir.x * 0.85,
    1.3,
    player.root.position.z + dir.z * 0.85
  );
  mesh.lookAt(mesh.position.clone().add(dir));
  scene.add(mesh);

  // Balanced weapon damage scaling by level (Lv.1 to Lv.5):
  // Reduced scaling at Max Level (Lv.5) from +52%..+64% down to +26%..+32% to prevent excessive damage
  const dmgStep = isSniper ? 0.08 : isRocket ? 0.075 : isShotgun ? 0.07 : wepKey === 'minigun' ? 0.065 : 0.07;
  const dmgMult = 1 + (wLvl - 1) * dmgStep;
  const spdMult = isRocket ? (1 + (wLvl - 1) * 0.08) : (1 + (wLvl - 1) * 0.04);
  const rangeMult = isShotgun ? (1 + (wLvl - 1) * 0.06) : 1.0;

  // Sniper pierce is limited to penetrate only 1 enemy (hitting the first target and at most one more behind it)
  const pierceLeft = isSniper ? 1 : 0;

  // Rocket explosion radius reduced to 1/3 of original size (1.4 base + 0.10 per level instead of 4.2 + 0.30)
  const explosionRadius = isRocket ? (weapon.explosionRadius || 1.4) + (wLvl - 1) * 0.10 : 0;

  // Rocket Launcher has fixed 50% crit chance; all other weapons scale from 2% at Lv.1 to 10% at Lv.5
  const critChance = isRocket ? 0.50 : clamp(0.02 + (wLvl - 1) * 0.02, 0.02, 0.10);
  const critBonus = isSniper ? (weapon.critBonus || 0.40) + (wLvl - 1) * 0.05 : 0;

  bullets.push({
    mesh,
    weaponKey: wepKey,
    dir: dir.clone(),
    speed: weapon.speed * spdMult,
    life: 0,
    range: weapon.range * rangeMult,
    damage: weapon.damage * dmgMult,
    pierceLeft,
    explosionRadius,
    critBonus,
    critChance,
    hitIds: isSniper ? new Set() : null
  });
}

/* Aim Assist & Target Lock State */
let currentAimTarget = null;
let aimSwitchCd = 0;
let currentAimAngle = 0;

function steerObstacles(pos, radius, vx, vz, z) {
  let outVx = vx, outVz = vz;
  const spd = Math.hypot(vx, vz);
  if (spd < 0.001) return { vx: 0, vz: 0 };

  const hx = vx / spd;
  const hz = vz / spd;
  // Look-ahead distance proportional to velocity
  const lookAhead = Math.max(2.0, Math.min(4.0, spd * 1.5 + 1.0));

  // 1. Predictive Whisker Check: Find the most critical impending obstacle ahead
  let bestThreat = 0;
  let bestObs = null;
  let bestSide = (z && z.steerDir) || 1; // 1 = left, -1 = right

  for (let i = 0; i < activeObstacles.length; i++) {
    const o = activeObstacles[i];
    const toOx = o.x - pos.x;
    const toOz = o.z - pos.z;
    const distSq = toOx * toOx + toOz * toOz;
    const maxRange = lookAhead + o.r + radius;
    if (distSq > maxRange * maxRange) continue;

    // Project obstacle center onto travel heading
    const distFwd = toOx * hx + toOz * hz;
    // Lateral offset: positive = obstacle center is to the left of heading, negative = to the right
    const distLat = toOx * (-hz) + toOz * hx;
    const clearance = radius + o.r + 0.35;

    // Obstacle is in front and within lateral danger zone
    if (distFwd > -0.2 && distFwd < lookAhead + o.r && Math.abs(distLat) < clearance) {
      const fwdThreat = 1.0 - Math.max(0, distFwd) / (lookAhead + o.r);
      const latThreat = 1.0 - Math.abs(distLat) / clearance;
      const threat = fwdThreat * 0.7 + latThreat * 0.3;

      if (threat > bestThreat) {
        bestThreat = threat;
        bestObs = o;
        if (z && z.stuckTimer > 0) {
          bestSide = z.steerDir || 1;
        } else if (Math.abs(distLat) > 0.25) {
          bestSide = distLat > 0 ? -1 : 1;
        } else {
          bestSide = (z && z.steerDir) || 1;
        }
      }
    }
  }

  // 2. If an obstacle was detected ahead, apply anticipatory steering torque
  if (bestObs && bestThreat > 0.05) {
    if (z && !z.steerDir) z.steerDir = bestSide;
    const odx = pos.x - bestObs.x;
    const odz = pos.z - bestObs.z;
    const od = Math.hypot(odx, odz) || 1;
    const onx = odx / od;
    const onz = odz / od;

    // Tangent vectors around obstacle
    const t1x = -onz, t1z = onx;
    let chosenTx = t1x, chosenTz = t1z;
    if (bestSide < 0) {
      chosenTx = -t1x;
      chosenTz = -t1z;
    } else if (bestSide > 0) {
      chosenTx = t1x;
      chosenTz = t1z;
    } else {
      const dotT = hx * t1x + hz * t1z;
      if (dotT < 0) { chosenTx = -t1x; chosenTz = -t1z; }
    }

    // Blend original desired velocity with tangent avoidance velocity based on threat
    const steerWeight = Math.min(1.2, bestThreat * 1.4);
    const blendX = hx * (1 - steerWeight * 0.75) + chosenTx * steerWeight;
    const blendZ = hz * (1 - steerWeight * 0.75) + chosenTz * steerWeight;
    const blendLen = Math.hypot(blendX, blendZ) || 1;
    outVx = (blendX / blendLen) * spd;
    outVz = (blendZ / blendLen) * spd;
  }

  // 3. Close-Proximity Surface Sliding & Hard Push-Out (Guarantees no clipping/sticking)
  for (let i = 0; i < activeObstacles.length; i++) {
    const o = activeObstacles[i];
    const dx = pos.x - o.x, dz = pos.z - o.z;
    const d = Math.hypot(dx, dz);
    const minD = radius + o.r;
    if (d < minD + 0.85 && d > 0.001) {
      const nx = dx / d, nz = dz / d;
      if (d < minD) {
        pos.x = o.x + nx * minD;
        pos.z = o.z + nz * minD;
      }
      const dot = outVx * nx + outVz * nz;
      if (dot < 0) {
        const curSpd = Math.hypot(outVx, outVz);
        const t1x = -nz, t1z = nx;
        const align = outVx * t1x + outVz * t1z;
        let sign;
        if (z && z.stuckTimer > 0) sign = z.steerDir || 1;
        else if (Math.abs(align) > curSpd * 0.15) sign = align > 0 ? 1 : -1;
        else sign = (z && z.steerDir) || 1;
        const tx = t1x * sign, tz = t1z * sign;
        let tanV = outVx * tx + outVz * tz;
        if (tanV < curSpd * 0.85) tanV = curSpd * 0.85;
        outVx = tx * tanV + nx * curSpd * 0.12;
        outVz = tz * tanV + nz * curSpd * 0.12;
      }
    }
  }
  return { vx: outVx, vz: outVz };
}

function isZombieOnScreen(z) {
  if (!z || !z.root) return false;
  return isPositionOnScreen(z.root.position.x, z.root.position.z, -0.04);
}

// Line-of-sight check against solid obstacles (houses, buildings, cars with radius >= 1.5)
function hasClearLineOfSight(x1: number, z1: number, x2: number, z2: number): boolean {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const segLenSq = dx * dx + dz * dz;
  if (segLenSq < 0.01) return true;

  for (let i = 0; i < activeObstacles.length; i++) {
    const o = activeObstacles[i];
    if (o.r < 1.5) continue; // Ignore thin streetlamps/small rocks
    const t = clamp(((o.x - x1) * dx + (o.z - z1) * dz) / segLenSq, 0.05, 0.95);
    const nearX = x1 + t * dx;
    const nearZ = z1 + t * dz;
    const distSq = (o.x - nearX) * (o.x - nearX) + (o.z - nearZ) * (o.z - nearZ);
    const blockR = o.r * 0.78;
    if (distSq < blockR * blockR) {
      return false;
    }
  }
  return true;
}

function updateAimAssist(dt) {
  if (meta?.aimAssistEnabled === false || !player) {
    currentAimTarget = null;
    return;
  }

  const px = player.root.position.x;
  const pz = player.root.position.z;
  const wepKey = player.weapon || 'carbine';
  const maxDetect = wepKey === 'sniper' ? 32 : wepKey === 'rocket' ? 26 : 22;

  // Find the ABSOLUTE CLOSEST living zombie visible on screen and not hidden behind obstacles
  let closestZ = null;
  let minDist = maxDetect;

  for (let i = 0; i < zombies.length; i++) {
    const z = zombies[i];
    if (z.hp <= 0) continue;
    if (!isZombieOnScreen(z)) continue; // Must be visible on screen!
    if (!hasClearLineOfSight(px, pz, z.root.position.x, z.root.position.z)) continue; // Must not be hidden behind obstacles!

    const dist = Math.hypot(z.root.position.x - px, z.root.position.z - pz);
    if (dist < minDist) {
      minDist = dist;
      closestZ = z;
    }
  }

  // Target the closest zombie in strict order of proximity
  if (closestZ) {
    currentAimTarget = closestZ;
  } else {
    currentAimTarget = null;
  }

  // Smoothly interpolate currentAimAngle towards the closest target
  if (currentAimTarget) {
    const desired = Math.atan2(currentAimTarget.root.position.x - px, currentAimTarget.root.position.z - pz);
    let diff = desired - currentAimAngle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    currentAimAngle += diff * Math.min(1, dt * 6.5);
  } else {
    currentAimAngle = player.angle;
  }
}

function triggerReload() {
  if (!player) return;
  const wepKey = player.weapon || 'carbine';
  const wepCfg = weapons[wepKey] || weapons.carbine;
  const max = wepCfg.maxAmmo || 30;
  if (player.ammo >= max) return; // already full

  // Overcharge: instant 0-second reload
  if (run && (run.overchargeTimer || 0) > 0) {
    player.ammo = max;
    player.reloadCd = 0;
    player.reloadTotal = 0;
    updateHUD();
    return;
  }

  if (player.reloadCd > 0) return; // already reloading
  const rTime = wepCfg.reloadTime || 2.0;
  player.reloadCd = rTime;
  player.reloadTotal = rTime;
  if (sfx && sfx.reload) sfx.reload();
  updateHUD();
}

function shoot() {
  const wepKey = player.weapon || 'carbine';
  const weapon = weapons[wepKey] || weapons.carbine;

  // Block firing while reloading
  if (player.reloadCd > 0) return;
  if (player.shootCd > 0) return;

  // Auto reload when magazine is empty (Instant during Overcharge)
  if (typeof player.ammo === 'number' && player.ammo <= 0) {
    if (run && (run.overchargeTimer || 0) > 0) {
      player.ammo = weapon.maxAmmo || 30;
      player.reloadCd = 0;
      player.reloadTotal = 0;
      updateHUD();
    } else {
      triggerReload();
      return;
    }
  }

  const wLvl = getWeaponLevel(wepKey, meta);
  const overchargeMult = (run && run.overchargeTimer > 0) ? 0.5 : 1.0;

  let fireDelay = weapon.fireRate * Math.max(0.68, 1 - (wLvl - 1) * 0.05) * overchargeMult;

  // Minigun progressive spin-up behavior (starts slower, accelerates as spin approaches 1)
  if (wepKey === 'minigun') {
    const spin = clamp(player.minigunSpin || 0, 0, 1);
    const minRate = weapon.fireRate * Math.max(0.75, 1 - (wLvl - 1) * 0.05);
    const startRate = 0.135;
    fireDelay = lerp(startRate, minRate, spin) * overchargeMult;
  }

  player.shootCd = fireDelay;
  player.muzzle = 1;
  player.recoilImpulse = 1.0; // Trigger recoil kick
  const isHeavyWep = wepKey === 'shotgun' || wepKey === 'sniper' || wepKey === 'rocket';
  screenFlash = Math.max(screenFlash, wepKey === 'rocket' ? 0.30 : isHeavyWep ? 0.22 : 0.14);
  shake = Math.min(0.85, shake + (wepKey === 'rocket' ? 0.36 : isHeavyWep ? 0.26 : wepKey === 'minigun' ? 0.10 : 0.15));
  if (isHeavyWep) {
    try { if (navigator.vibrate) navigator.vibrate(wepKey === 'rocket' ? 26 : 18); } catch (e) {}
  }
  sfx.shot(wepKey);

  let shootAngle = player.angle;
  const px = player.root.position.x;
  const pz = player.root.position.z;

  if (currentAimTarget && meta?.aimAssistEnabled !== false) {
    shootAngle = currentAimAngle;
  } else if (mouse.active) {
    updateAimPoint();
    shootAngle = Math.atan2(aimPoint.x - px, aimPoint.z - pz);
  }

  player.angle = shootAngle;
  player.root.rotation.y = player.angle;

  // Upgraded pellet count for Heavy Shotgun (balanced +1 pellet at Lv.5)
  const pelletCount = wepKey === 'shotgun'
    ? weapon.pellets + (wLvl >= 5 ? 1 : 0)
    : weapon.pellets;

  // Upgraded spread tightening per weapon level
  const spreadMult = Math.max(0.62, 1 - (wLvl - 1) * 0.08);
  const effSpread = weapon.spread * spreadMult;

  for (let i = 0; i < pelletCount; i++) {
    const a = shootAngle + rand(-effSpread, effSpread);
    fireBullet(new THREE.Vector3(Math.sin(a), 0, Math.cos(a)), wepKey, wLvl);
  }
  const forwardX = Math.sin(shootAngle);
  const forwardZ = Math.cos(shootAngle);
  const flashCol = wepKey === 'sniper' ? 0x00e5ff : wepKey === 'rocket' ? 0xff7043 : 0x8fe9ff;
  spawnBurst(player.root.position.x + forwardX * 0.85, player.root.position.z + forwardZ * 0.85, flashCol, isHeavyWep ? 10 : 6, 0.8, 2.8);

  // Consume 1 bullet from current magazine; trigger automatic reload if empty
  player.ammo = Math.max(0, (typeof player.ammo === 'number' ? player.ammo : weapon.maxAmmo) - 1);
  if (player.ammo <= 0) {
    triggerReload();
  }

  updateHUD();
}

/* Spawning and kills */

// Procedural textured look for toxic poison pools (generated once, shared by every pool)
let _toxicPoolTex = null;
const toxicBubbleGeo = new THREE.RingGeometry(0.62, 1.0, 12);
const toxicBubbleMat = new THREE.MeshBasicMaterial({ color: 0xc8ffb4, transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false });
function getToxicPoolTexture() {
  if (_toxicPoolTex) return _toxicPoolTex;
  const S = 256;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(S / 2, S / 2, S * 0.05, S / 2, S / 2, S / 2);
  grad.addColorStop(0.0, 'rgba(120,255,110,0.95)');
  grad.addColorStop(0.45, 'rgba(40,220,80,0.88)');
  grad.addColorStop(0.80, 'rgba(18,140,50,0.70)');
  grad.addColorStop(1.0, 'rgba(10,90,30,0)');
  g.fillStyle = grad;
  g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, TAU); g.fill();
  // Dark sludge blotches and bright swirls for liquid texture
  const rr = seeded(7, 13);
  for (let i = 0; i < 38; i++) {
    const a = rr() * TAU, d = rr() * S * 0.40;
    const x = S / 2 + Math.cos(a) * d, y = S / 2 + Math.sin(a) * d;
    const r = 6 + rr() * 20;
    g.fillStyle = rr() > 0.5 ? 'rgba(6,70,24,0.38)' : 'rgba(170,255,140,0.22)';
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  // Foam rings (frozen bubbles)
  g.lineWidth = 2;
  for (let i = 0; i < 16; i++) {
    const a = rr() * TAU, d = rr() * S * 0.38;
    const x = S / 2 + Math.cos(a) * d, y = S / 2 + Math.sin(a) * d;
    g.strokeStyle = 'rgba(210,255,190,0.55)';
    g.beginPath(); g.arc(x, y, 3 + rr() * 8, 0, TAU); g.stroke();
  }
  _toxicPoolTex = new THREE.CanvasTexture(c);
  _toxicPoolTex.encoding = THREE.sRGBEncoding;
  return _toxicPoolTex;
}

function spawnToxicPool(x, zpos, radius = 2.1, duration = 4.5, dmg = 5, interval = 0.6) {
  if (toxicPools.length >= 12) {
    const oldest = toxicPools.shift();
    if (oldest) {
      scene.remove(oldest.mesh);
      oldest.mat?.dispose?.();
    }
  }
  const mat = new THREE.MeshBasicMaterial({
    map: getToxicPoolTexture(),
    color: 0xffffff,
    transparent: true,
    opacity: 0.62,
    depthWrite: false
  });
  const mesh = new THREE.Mesh(toxicPoolGeo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.rotation.z = Math.random() * TAU;
  mesh.position.set(x, 0.03, zpos);
  mesh.scale.setScalar(radius);

  // Bubbling animation: small rings that grow and pop inside the pool
  const bubbles = [];
  for (let b = 0; b < 4; b++) {
    const bm = new THREE.Mesh(toxicBubbleGeo, toxicBubbleMat);
    const ba = Math.random() * TAU, bd = Math.sqrt(Math.random()) * 0.72;
    bm.position.set(Math.cos(ba) * bd, Math.sin(ba) * bd, 0.01);
    bm.scale.setScalar(0.001);
    mesh.add(bm);
    bubbles.push({ mesh: bm, t: Math.random(), speed: 0.7 + Math.random() * 0.9 });
  }

  scene.add(mesh);
  toxicPools.push({ mesh, mat, bubbles, x, z: zpos, radius, life: duration, maxLife: duration, dmg, interval, tickCd: 0.25 });
}

function spawnBossZombie(isMiniBoss = false) {
  if (!run || run.bossSpawnedThisWave) return;
  run.bossSpawnedThisWave = true;

  const arch = isMiniBoss ? getMiniBossArchetype(run.wave) : getBossArchetype(run.wave);
  const type = arch.baseType;
  const z = createZombie(type, arch.forcedSkin) as any;

  // Cycle scaling for higher waves (e.g. Wave 45+ for Mini-Bosses, Wave 50+ for Bosses)
  const cycle = isMiniBoss
    ? Math.floor(Math.max(0, run.wave - 5) / 40)
    : Math.floor(Math.max(0, run.wave - 10) / 40);
  const hpMult = (1 + cycle * 0.45) * getWaveTierMultipliers(run.wave).hpMult;
  const dmgMult = (1 + cycle * 0.18) * getWaveTierMultipliers(run.wave).dmgMult;

  z.isMiniBoss = isMiniBoss;
  z.isBoss = !isMiniBoss;
  z.bossArchetype = arch.id;
  z.bossName = arch.name;
  z.hp = z.maxHp = Math.round(arch.hp * hpMult);
  z.speed = arch.speed;
  z.damage = Math.round(arch.damage * dmgMult);
  z.reward = Math.round(arch.reward * (1 + cycle * 0.25));
  z.score = Math.round(arch.score * (1 + cycle * 0.25));
  z.baseScale = arch.scale;
  z.root.scale.setScalar(arch.scale);
  z.hitR = arch.hitR;
  z.envHitR = arch.hitR;
  z.atkRange = arch.atkRange;
  z.armorResist = arch.armorResist;
  z.headshotMult = arch.headshotMult;
  z.smashRadius = arch.smashRadius;
  z.smashDamage = Math.round(arch.smashDamage * dmgMult);
  z.smashWindup = arch.smashWindup;
  z.baseSmashCd = arch.smashCd;
  z.smashCd = rand(2.2, 3.8);
  z.summonCd = 8.0;

  if (z.smashRing) {
    z.smashRing.scale.setScalar(arch.smashRadius / arch.scale);
  }
  attachBossArchetypeVisuals(z, arch);

  const pos = findSafeSpawnPosition(z.hitR);
  z.root.position.set(pos.x, 0, pos.z);
  z.lastX = pos.x;
  z.lastZ = pos.z;
  zombies.push(z);
  run.waveSpawned = (run.waveSpawned || 0) + 1;
  updateHUD();
}

function spawnZombie() {
  if (!run || run.waveLeft <= 0) return;
  if (zombies.length >= WAVE_SCALING_CONFIG.maxActiveZombies) return;

  let type = 'walker';
  if (run.waveQueue && run.waveQueue.length > 0) {
    type = run.waveQueue.pop() || 'walker';
    run.waveLeft = Math.max(0, run.waveQueue.length);
  } else {
    run.waveLeft = Math.max(0, run.waveLeft - 1);
  }

  const z = createZombie(type);
  const base = zombieTypes[type] || zombieTypes.walker;
  const mults = getWaveDifficultyMultipliers(run.wave);

  z.hp = z.maxHp = Math.round(base.hp * mults.hpMult);
  z.speed = base.speed * mults.speedMult;
  z.damage = Math.round(base.damage * mults.dmgMult);

  if (DEBUG_BALANCE && waveStats.active) {
    waveStats.peakHp = Math.max(waveStats.peakHp, z.maxHp);
    waveStats.peakSpeed = Math.max(waveStats.peakSpeed, z.speed);
    if (type === 'walker') waveStats.peakWalkerHp = Math.max(waveStats.peakWalkerHp, z.maxHp);
    if (type === 'runner') waveStats.peakRunnerSpeed = Math.max(waveStats.peakRunnerSpeed, z.speed);
  }
  z.reward = Math.round(base.reward * mults.rewardMult);
  z.score = Math.round(base.score * mults.scoreMult);

  const pos = findSafeSpawnPosition(z.hitR);
  z.root.position.set(pos.x, 0, pos.z);
  z.lastX = pos.x;
  z.lastZ = pos.z;
  zombies.push(z);
  run.waveSpawned = (run.waveSpawned || 0) + 1;
  updateHUD();
}

function killZombie(idx) {
  const z = zombies[idx];
  if (!z || z.dead) return;
  z.dead = true;

  if (DEBUG_BALANCE && waveStats.active) {
    waveStats.zombiesKilled++;
  }

  stopZombieGroan(z);
  if (z.smashRing) z.smashRing.visible = false;
  if (z.auraRing) z.auraRing.visible = false;

  const x = z.root.position.x, zpos = z.root.position.z;
  zombies.splice(idx, 1);

  if (z.type === 'boss' || z.isMiniBoss) {
    run.bossDefeated = true;
  }

  // Move to short non-interactive death animation queue before removing from scene
  dyingZombies.push({
    root: z.root,
    timer: z.deathTime || 0.36,
    maxTimer: z.deathTime || 0.36,
    baseScale: z.baseScale || (zombieTypes[z.type] || zombieTypes.walker).scale,
    fallDir: Math.random() < 0.5 ? 1 : -1
  });

  const isToxicBoss = z.bossArchetype === 'toxic_boss' || z.bossArchetype === 'blight_mini';
  const isToxic = z.type === 'toxic' || z.type === 'spitter' || isToxicBoss;
  const burstCol = isToxic ? 0x39ff14 : z.type === 'boss' ? 0xff1744 : z.isMiniBoss ? 0xff8800 : z.type === 'armored' ? 0x99b8cc : 0xa7beb7;
  const burstCnt = z.type === 'boss' ? 36 : z.isMiniBoss ? 24 : z.type === 'brute' ? 18 : isToxic ? 16 : 9;
  spawnBurst(x, zpos, burstCol, burstCnt, 0.8, 3.8);

  // Toxic zombie / Toxic Boss death explosion & lingering poison hazard
  if (isToxic) {
    const cfg = zombieTypes.toxic;
    const pRad = isToxicBoss ? 3.2 : cfg.poolRadius;
    const pDur = isToxicBoss ? 6.0 : cfg.poolDuration;
    spawnToxicPool(x, zpos, pRad, pDur, cfg.poolDmg, cfg.poolInterval);
    if (player) {
      const expRad = isToxicBoss ? 4.2 : cfg.explodeRadius;
      const distToPlayer = dist2(x, zpos, player.root.position.x, player.root.position.z);
      if (distToPlayer <= expRad) {
        const expDmg = Math.round((isToxicBoss ? 24 : cfg.explodeDmg) * (1 - distToPlayer / (expRad + 1.2)));
        if (expDmg > 0) hurtPlayer(expDmg);
      }
    }
  }

  run.kills++;
  run.score += Math.round(z.score * (1 + run.combo * 0.18));
  run.combo++;
  run.comboT = 2.8;
  if (sfx && sfx.kill) sfx.kill(z.type === 'boss' || z.isMiniBoss, run.combo);

  if (run.waveLeft === 0 && zombies.length === 0 && (!run.bossRequired || run.bossDefeated)) {
    hitStopTimer = 0.08; // Brief dramatic hit-stop on final kill of wave
  }

  metaAdd('totalKills', 1);
  if (z.type === 'runner') metaAdd('runnerKills', 1);
  if (z.type === 'brute' || z.type === 'boss') metaAdd('bruteKills', 1);
  if (isToxic) metaAdd('spitterKills', 1);

  // Rebalanced bone drops (fewer clusters per kill so Shard/Bone income stays balanced)
  const drops = z.type === 'boss' ? 5 : z.isMiniBoss ? 3 : z.type === 'brute' ? 2 : ((isToxic || z.type === 'armored') && Math.random() < 0.5) ? 2 : 1;
  for (let i = 0; i < drops; i++) spawnPickup('bone', x + rand(-0.45, 0.45), zpos + rand(-0.45, 0.45), z.reward);

  // Grenade drop chance: if player already has max grenades equipped (3/3), chance is strictly 0% (never drops)
  // If player has fewer than 3 grenades (0/3, 1/3, 2/3), chance is strictly 5% (0.05)
  const isGrenadeFull = (meta?.grenadesCount || 0) >= MAX_EQUIPPED_GRENADES;
  const gChance = isGrenadeFull ? 0.00 : 0.05;
  if (gChance > 0 && Math.random() < gChance) {
    spawnPickup('grenade', x + rand(-0.4, 0.4), zpos + rand(-0.4, 0.4), 1);
  }

  // Tactical loot drops on Boss / Mini-Boss defeat (Guaranteed HP; Kevlar at exact 50% of HP frequency)
  if (z.type === 'boss' || z.isMiniBoss) {
    spawnPickup('medkit', x + rand(-0.35, 0.35), zpos + rand(-0.35, 0.35), z.type === 'boss' ? 35 : 25);
    if (Math.random() < 0.50) {
      spawnPickup('kevlar', x + rand(-0.35, 0.35), zpos + rand(-0.35, 0.35), z.type === 'boss' ? 45 : 30);
    }
    const pRoll = Math.random();
    const pKind = pRoll < 0.34 ? 'overcharge' : pRoll < 0.67 ? 'magnet' : 'cryo';
    spawnPickup(pKind, x + rand(-0.35, 0.35), zpos + rand(-0.35, 0.35), 1);
  } else {
    // Dynamic loot drops: chance decreases as waves progress to increase late-game survival pressure
    const wLevel = run ? run.wave : 1;
    const medkitChance = Math.max(0.02, 0.08 - (wLevel * 0.0015));
    if (Math.random() < medkitChance) {
      spawnPickup('medkit', x + rand(-0.25, 0.25), zpos + rand(-0.25, 0.25), 18 + ((Math.random() * 12) | 0));
    }
    // Kevlar drop frequency is strictly 50% of the HP medkit drop rate
    if (Math.random() < medkitChance * 0.5) {
      spawnPickup('kevlar', x + rand(-0.25, 0.25), zpos + rand(-0.25, 0.25), 25 + ((Math.random() * 15) | 0));
    } else if (Math.random() < 0.04) {
      const pRoll = Math.random();
      const pKind = pRoll < 0.34 ? 'overcharge' : pRoll < 0.67 ? 'magnet' : 'cryo';
      spawnPickup(pKind, x + rand(-0.25, 0.25), zpos + rand(-0.25, 0.25), 1);
    }
  }

  if (z.type === 'boss') {
    showBanner(`${z.bossName || 'TITAN'} DEFEATED!`, '+8 BONE CLUSTERS & TACTICAL LOOT');
  } else if (z.isMiniBoss) {
    showBanner(`${z.bossName || 'MINI-BOSS'} DEFEATED!`, '+5 BONE CLUSTERS & TACTICAL LOOT');
  } else if (run.kills % 15 === 0) {
    toast('Kill streak: ' + run.kills + ' infected down');
  }
  updateHUD();
}

/* Updates */
function updatePlayer(dt) {
  let mx = 0, mz = 0;
  if (keys['KeyW'] || keys['w'] || keys['W'] || keys['ArrowUp']) mz += 1;
  if (keys['KeyS'] || keys['s'] || keys['S'] || keys['ArrowDown']) mz -= 1;
  if (keys['KeyA'] || keys['a'] || keys['A'] || keys['ArrowLeft']) mx += 1;  // A / Left Arrow = Move Left on Screen
  if (keys['KeyD'] || keys['d'] || keys['D'] || keys['ArrowRight']) mx -= 1; // D / Right Arrow = Move Right on Screen
  // Joystick input (mapped: joystick left → screen left, joystick right → screen right)
  if (joystick.active) {
    mx += -joystick.dx;  // joystick left (negative dx) → +mx (screen left); joystick right (positive dx) → -mx (screen right)
    mz += -joystick.dy;  // joystick up (negative dy) → +mz (player forward)
  }

  if (mx !== 0 || mz !== 0) {
    const len = Math.hypot(mx, mz);
    mx /= len; mz /= len;
  }
  player.vx = lerp(player.vx, mx * PLAYER_SPEED, 1 - Math.exp(-dt * 12));
  player.vz = lerp(player.vz, mz * PLAYER_SPEED, 1 - Math.exp(-dt * 12));
  player.root.position.x += player.vx * dt;
  player.root.position.z += player.vz * dt;
  collideObstacles(player.root.position, PLAYER_RADIUS);

  player.moveBob += Math.hypot(player.vx, player.vz) * dt * 0.08;
  const spd = Math.hypot(player.vx, player.vz);
  const walk = player.moveBob * 9;
  const bobY = Math.abs(Math.sin(walk)) * 0.06;

  // Walking & Running Leg Animations
  if (spd > 0.5) {
    player.legL.hipPiv.rotation.x =  Math.sin(walk) * 0.58;
    player.legR.hipPiv.rotation.x = -Math.sin(walk) * 0.58;
    player.legL.kneePiv.rotation.x = Math.max(0, Math.sin(walk + 0.5)) * 0.65;
    player.legR.kneePiv.rotation.x = Math.max(0, Math.sin(walk - 0.5 + Math.PI)) * 0.65;
  } else {
    player.legL.hipPiv.rotation.x  = lerp(player.legL.hipPiv.rotation.x,  0, dt * 10);
    player.legR.hipPiv.rotation.x  = lerp(player.legR.hipPiv.rotation.x,  0, dt * 10);
    player.legL.kneePiv.rotation.x = lerp(player.legL.kneePiv.rotation.x, 0, dt * 10);
    player.legR.kneePiv.rotation.x = lerp(player.legR.kneePiv.rotation.x, 0, dt * 10);
  }

  // Recoil impulse recovery & Mechanical Slide/Pump/Rotary Barrel Animation
  const wepKey = player.weapon || 'carbine';
  const wepCfg = weapons[wepKey] || weapons.carbine;
  const recoverSpeed = (wepKey === 'shotgun' || wepKey === 'sniper' || wepKey === 'rocket') ? 7.2 : 12.0;
  player.recoilImpulse = Math.max(0, (player.recoilImpulse || 0) - dt * recoverSpeed);
  const kick = player.recoilImpulse || 0;
  const recoilStrength = wepCfg.recoil || 1.0;

  // Reload cooldown tick & full magazine replenishment (Instant during Overcharge)
  if (run && (run.overchargeTimer || 0) > 0) {
    if (player.reloadCd > 0 || (player.ammo !== undefined && player.ammo <= 0)) {
      player.reloadCd = 0;
      player.reloadTotal = 0;
      player.ammo = wepCfg.maxAmmo || 30;
      updateHUD();
    }
  } else if (player.reloadCd > 0) {
    player.reloadCd = Math.max(0, player.reloadCd - dt);
    if (player.reloadCd <= 0) {
      player.reloadCd = 0;
      player.ammo = wepCfg.maxAmmo || 30;
      updateHUD();
    }
  }

  const isReloading = (player.reloadCd || 0) > 0;
  const totalRTime = Math.max(0.1, player.reloadTotal || wepCfg.reloadTime || 2.0);
  const rProg = isReloading ? Math.min(1.0, Math.max(0.0, 1.0 - (player.reloadCd / totalRTime))) : 0;

  // Dynamic visual reload animation on player arms and weapon
  let relGunY = 0, relGunZ = 0, relGunRotY = 0, relGunRotZ = 0;
  let relArmLX = 0, relArmLY = 0, relArmLLower = 0;
  let relArmRX = 0, relArmRY = 0, relArmRLower = 0;
  let slideRelOffset = 0;

  if (isReloading) {
    if (rProg < 0.30) {
      // Phase 1: Tilt weapon toward chest, left hand detaches from forend and drops down to mag pouch
      const p = rProg / 0.30;
      const easeP = Math.sin(p * Math.PI * 0.5);
      relGunY = -0.04 * easeP;
      relGunZ = -0.06 * easeP;
      relGunRotZ = 0.35 * easeP;
      relGunRotY = -0.25 * easeP;
      relArmRX = 0.18 * easeP;
      relArmRY = 0.12 * easeP;
      relArmLX = 0.65 * easeP;
      relArmLY = -0.50 * easeP;
      relArmLLower = 0.45 * easeP;
    } else if (rProg < 0.65) {
      // Phase 2: Left hand brings fresh magazine up and slams it into the magwell
      const p = (rProg - 0.30) / 0.35;
      if (p < 0.65) {
        const subP = p / 0.65;
        relGunY = -0.04;
        relGunZ = -0.06;
        relGunRotZ = 0.35;
        relGunRotY = -0.25;
        relArmRX = 0.18;
        relArmRY = 0.12;
        relArmLX = 0.65 * (1 - subP) + 0.05 * subP;
        relArmLY = -0.50 * (1 - subP) + 0.25 * subP;
        relArmLLower = 0.45 * (1 - subP) - 0.12 * subP;
      } else {
        // Magazine insertion tactile slam impulse
        const slamP = (p - 0.65) / 0.35;
        const slam = Math.sin(slamP * Math.PI);
        relGunY = -0.04 - 0.05 * slam;
        relGunZ = -0.06;
        relGunRotZ = 0.35 - 0.15 * slam;
        relGunRotY = -0.25;
        relArmRX = 0.18;
        relArmRY = 0.12;
        relArmLX = 0.05;
        relArmLY = 0.25;
        relArmLLower = -0.12;
      }
    } else {
      // Phase 3: Rack charging handle / slide back and return left hand to forend in ready stance
      const p = (rProg - 0.65) / 0.35;
      const easeP = 1 - Math.cos(p * Math.PI * 0.5);
      const rack = Math.sin(p * Math.PI);
      slideRelOffset = -0.14 * rack;
      const fade = 1 - easeP;
      relGunY = -0.04 * fade;
      relGunZ = -0.06 * fade;
      relGunRotZ = 0.35 * fade;
      relGunRotY = -0.25 * fade;
      relArmRX = 0.18 * fade;
      relArmRY = 0.12 * fade;
      relArmLX = 0.05 * fade;
      relArmLY = 0.25 * fade;
      relArmLLower = -0.12 * fade;
    }
  }

  // Hands & Arms Rigged directly onto the Weapon Grip & Forend + Recoil Kickback
  const targetArmRX = -0.92 - kick * 0.28 * recoilStrength + (isReloading ? relArmRX : 0);
  const targetArmRY = -0.24 + (isReloading ? relArmRY : 0);
  const targetArmLX = -1.02 - kick * 0.22 * recoilStrength + (isReloading ? relArmLX : 0);
  const targetArmLY = 0.56 + (isReloading ? relArmLY : 0);

  player.armR.pivot.rotation.x = lerp(player.armR.pivot.rotation.x, targetArmRX, dt * 16);
  player.armR.pivot.rotation.y = lerp(player.armR.pivot.rotation.y, targetArmRY, dt * 16);
  player.armR.lowerPiv.rotation.x = lerp(player.armR.lowerPiv.rotation.x, -0.46 - kick * 0.24 * recoilStrength + (isReloading ? relArmRLower : 0), dt * 16);

  player.armL.pivot.rotation.x = lerp(player.armL.pivot.rotation.x, targetArmLX, dt * 16);
  player.armL.pivot.rotation.y = lerp(player.armL.pivot.rotation.y, targetArmLY, dt * 16);
  player.armL.lowerPiv.rotation.x = lerp(player.armL.lowerPiv.rotation.x, -0.52 - kick * 0.18 * recoilStrength + (isReloading ? relArmLLower : 0), dt * 16);

  // Weapon Held in Hands: Position Kickback, Muzzle Rise & Moving Bolt/Slide/Pump
  player.gunGroup.position.set(
    0.10,
    0.06 + kick * 0.04 * recoilStrength + (isReloading ? relGunY : 0),
    0.44 - kick * 0.18 * recoilStrength + (isReloading ? relGunZ : 0)
  );
  player.gunGroup.rotation.z = kick * 0.26 * recoilStrength + (isReloading ? relGunRotZ : 0);
  if (isReloading) {
    player.gunGroup.rotation.y = -Math.PI * 0.5 + relGunRotY;
  } else {
    player.gunGroup.rotation.y = -Math.PI * 0.5;
  }

  const firing = mouse.down || keys['Space'] || touch.fire;

  // Minigun spin-up state & 6-barrel rotation
  if (wepKey === 'minigun') {
    const wLvl = getWeaponLevel('minigun', meta);
    const spinTime = Math.max(0.26, (wepCfg.spinUpTime || 0.55) * (1 - (wLvl - 1) * 0.12));
    if (firing) {
      player.minigunSpin = Math.min(1, (player.minigunSpin || 0) + dt / spinTime);
    } else {
      player.minigunSpin = Math.max(0, (player.minigunSpin || 0) - dt * 1.8);
    }
  } else {
    player.minigunSpin = 0;
  }

  if (player.activeGunModel) {
    const gm = player.activeGunModel as any;
    if (gm.slideMesh) {
      gm.slideMesh.position.x = (gm.slideBaseX || 0) - kick * (wepKey === 'shotgun' || wepKey === 'sniper' ? 0.18 : 0.12) + (isReloading ? slideRelOffset : 0);
    }
    if (gm.barrelGroup && (player.minigunSpin || 0) > 0.01) {
      gm.barrelGroup.rotation.x += dt * (8 + (player.minigunSpin || 0) * 28);
    }
    if (gm.muzzleMesh) {
      gm.muzzleMesh.visible = player.muzzle > 0.35;
      gm.muzzleMesh.rotation.x = Math.random() * TAU;
    }
  }

  // Torso bob & recoil shock absorption
  player.torso.position.y = 1.1 + bobY;
  player.torso.rotation.x = -kick * 0.08 * recoilStrength;
  player.shadow.scale.setScalar(1.2 + bobY * 0.5);

  player.shootCd = Math.max(0, player.shootCd - dt);
  player.muzzle = Math.max(0, player.muzzle - dt * 6);
  player.hurtTimer = Math.max(0, player.hurtTimer - dt * 2.8);
  screenFlash = Math.max(0, screenFlash - dt * 3.6);

  // Turn towards movement angle ONLY when NOT firing so shooting direction is preserved!
  if (!firing && (mx !== 0 || mz !== 0)) {
    const targetAngle = Math.atan2(mx, mz);
    let diff = targetAngle - player.angle;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    player.angle += diff * Math.min(1, dt * 14);
    player.root.rotation.y = player.angle;
  }

  if (firing) shoot();
  // Passive health regeneration removed: HP only recovers via medkits / Medical Pet
}

function spawnShockwaveRing(rx: number, rz: number, maxRadius: number) {
  const sMat = new THREE.MeshBasicMaterial({ color: 0xff7043, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
  const mesh = new THREE.Mesh(shockwaveGeo, sMat);
  mesh.position.set(rx, 0.12, rz);
  mesh.scale.setScalar(0.2);
  scene.add(mesh);
  shockwaves.push({ mesh, maxR: Math.max(0.6, maxRadius * 1.25), life: 0.28, ttl: 0.28 });
}

function updateShockwaves(dt: number) {
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];
    sw.life -= dt;
    if (sw.life <= 0) {
      scene.remove(sw.mesh);
      sw.mesh.material?.dispose?.();
      shockwaves.splice(i, 1);
      continue;
    }
    const prog = 1 - sw.life / sw.ttl;
    const currentR = 0.2 + (sw.maxR - 0.2) * Math.sin(prog * Math.PI * 0.5);
    sw.mesh.scale.setScalar(currentR);
    sw.mesh.material.opacity = (1 - prog) * 0.85;
  }
}

function detonateRocket(rx: number, rz: number, baseDmg: number, expRadius: number) {
  // Rich multi-stage explosion visual effect on any collision (enemy, obstacle, or max range)
  // 1. Hot white & yellow core fireball flash
  spawnBurst(rx, rz, 0xffffff, 14, 1.2, 5.0);
  spawnBurst(rx, rz, 0xffeb3b, 18, 1.4, 5.8);
  // 2. Fiery orange & red blast flames
  spawnBurst(rx, rz, 0xff5722, 24, 1.5, 6.5);
  spawnBurst(rx, rz, 0xd50000, 18, 1.0, 4.8);
  // 3. Fiery sparks & dark smoke debris
  spawnBurst(rx, rz, 0xffb300, 12, 2.0, 7.2);
  spawnBurst(rx, rz, 0x37474f, 14, 0.6, 2.8);

  // Expanding fiery shockwave ring on the ground
  spawnShockwaveRing(rx, rz, expRadius);

  shake = Math.min(1.05, shake + 0.52);
  screenFlash = Math.max(screenFlash, 0.38);
  try { if (navigator.vibrate) navigator.vibrate([40, 20, 70]); } catch (e) {}
  sfx.shot('shotgun');

  for (let j = zombies.length - 1; j >= 0; j--) {
    const z = zombies[j];
    if (z.dead) continue;
    // Strict visibility & obstacle line-of-sight rule for Rocket explosions!
    if (!isZombieOnScreen(z)) continue;
    if (!hasClearLineOfSight(rx, rz, z.root.position.x, z.root.position.z)) continue;

    const d = dist2(rx, rz, z.root.position.x, z.root.position.z);
    if (d <= expRadius + z.hitR * 0.5) {
      const falloff = Math.max(0.35, 1 - d / (expRadius + 1.4));
      let dmg = Math.round(baseDmg * falloff);
      // Fixed 50% Crit Chance specifically for Rocket Launcher
      const isCrit = Math.random() < 0.50;
      if (isCrit) {
        dmg = Math.round(dmg * (z.headshotMult || 1.75));
      } else if (z.armorResist > 0) {
        dmg = Math.max(8, Math.round(dmg * (1 - z.armorResist * 0.5)));
      }
      z.hp -= dmg;
      z.hitFlash = 0.16;
      const baseScale = z.baseScale || (zombieTypes[z.type] || zombieTypes.walker).scale;
      z.root.scale.setScalar(baseScale * 1.05);
      spawnFloatingDamage(z.root.position.x, z.root.position.z, dmg, isCrit);
      sfx.hit(isCrit);
      if (z.hp <= 0) killZombie(j);
    }
  }
  updateHUD();
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    const stepDist = b.speed * dt;
    b.mesh.position.addScaledVector(b.dir, stepDist);
    b.life += stepDist;
    let remove = b.life >= b.range;
    const isRocket = b.weaponKey === 'rocket';
    const isSniper = b.weaponKey === 'sniper';
    const isShotgun = b.weaponKey === 'shotgun';

    // Rocket smoke trail
    if (isRocket && Math.random() < 0.55) {
      spawnBurst(b.mesh.position.x, b.mesh.position.z, 0xffab40, 1, 0.25, 0.9);
    }

    // Check obstacle collision so projectiles cannot pass through buildings/cars
    if (!remove) {
      for (let k = 0; k < activeObstacles.length; k++) {
        const o = activeObstacles[k];
        if (o.r < 1.5) continue;
        if (dist2(b.mesh.position.x, b.mesh.position.z, o.x, o.z) < o.r * 0.82) {
          if (isRocket) {
            detonateRocket(b.mesh.position.x, b.mesh.position.z, b.damage, b.explosionRadius || 1.4);
          } else {
            spawnBurst(b.mesh.position.x, b.mesh.position.z, 0x90a4ae, 4, 0.4, 1.4);
          }
          remove = true;
          break;
        }
      }
    }

    if (!remove) {
      for (let j = zombies.length - 1; j >= 0; j--) {
        const z = zombies[j];
        if (z.dead) continue;
        if (b.hitIds && b.hitIds.has(z)) continue;
        // Strict visibility & line-of-sight rule: only zombies visible on screen and not behind obstacles can be damaged!
        if (!isZombieOnScreen(z)) continue;
        if (player && !hasClearLineOfSight(player.root.position.x, player.root.position.z, z.root.position.x, z.root.position.z)) continue;

        const hitDist = dist2(b.mesh.position.x, b.mesh.position.z, z.root.position.x, z.root.position.z);
        if (hitDist < z.hitR) {
          if (isRocket) {
            detonateRocket(b.mesh.position.x, b.mesh.position.z, b.damage, b.explosionRadius || 1.4);
            remove = true;
            break;
          }

          // Shotgun distance falloff
          let rawDmg = b.damage;
          if (isShotgun && b.life > 10) {
            const falloff = clamp(1 - (b.life - 10) / Math.max(8, b.range - 8), 0.42, 1.0);
            rawDmg *= falloff;
          }

          // Progressive Crit Chance (strictly 2% at Lv.1 scaling to 10% at Max Level Lv.5 for all weapons)
          const isCrit = Math.random() < (b.critChance ?? 0.02);
          let finalDmg = rawDmg;
          if (isCrit) {
            finalDmg = Math.round(rawDmg * ((z.headshotMult || 1.75) + (b.critBonus || 0)));
          } else if (z.armorResist > 0) {
            // Sniper high-caliber rounds ignore half of body armor resistance
            const effArmor = isSniper ? z.armorResist * 0.5 : z.armorResist;
            finalDmg = Math.max(3, Math.round(rawDmg * (1 - effArmor)));
          } else {
            finalDmg = Math.round(rawDmg);
          }

          z.hp -= finalDmg;
          z.hitFlash = 0.12;
          const baseScale = z.baseScale || (zombieTypes[z.type] || zombieTypes.walker).scale;
          z.root.scale.setScalar(baseScale * (z.type === 'brute' || z.type === 'boss' ? 1.04 : 1.07));
          const isToxic = z.type === 'toxic' || z.type === 'spitter' || z.bossArchetype === 'toxic_boss' || z.bossArchetype === 'blight_mini';
          const isArmoredEnemy = z.type === 'armored' || z.bossArchetype === 'armored_boss' || z.bossArchetype === 'riot_mini';
          const hitColor = (!isCrit && isArmoredEnemy) ? 0x88bbee : isSniper ? 0x00e5ff : isToxic ? 0x79ecb0 : 0x97b8b3;
          spawnBurst(b.mesh.position.x, b.mesh.position.z, hitColor, 5 + (z.type === 'brute' || z.type === 'boss' ? 3 : 0), 0.6, 2.0);
          spawnFloatingDamage(z.root.position.x, z.root.position.z, finalDmg, isCrit);
          sfx.hit(isCrit);
          if (z.hp <= 0) killZombie(j);

          if (b.pierceLeft > 0) {
            b.pierceLeft--;
            if (b.hitIds) b.hitIds.add(z);
            b.damage *= 0.82;
          } else {
            remove = true;
            break;
          }
        }
      }
    }

    if (remove) {
      if (isRocket && b.life >= b.range) {
        detonateRocket(b.mesh.position.x, b.mesh.position.z, b.damage, b.explosionRadius || 1.4);
      }
      scene.remove(b.mesh);
      bullets.splice(i, 1);
    }
  }
}

function updateThrownGrenades(dt) {
  for (let i = thrownGrenades.length - 1; i >= 0; i--) {
    const g = thrownGrenades[i];
    g.timer -= dt;
    g.vy -= 14.5 * dt;
    g.mesh.position.x += g.vx * dt;
    g.mesh.position.y += g.vy * dt;
    g.mesh.position.z += g.vz * dt;
    g.mesh.rotation.x += dt * 10;
    g.mesh.rotation.z += dt * 8;

    // Smoke trail particle
    if (Math.random() < 0.6) {
      spawnBurst(g.mesh.position.x, g.mesh.position.z, 0xffd86e, 1, 0.2, 0.8);
    }

    if (g.mesh.position.y <= 0.18 || g.timer <= 0) {
      const gx = g.mesh.position.x;
      const gz = g.mesh.position.z;
      scene.remove(g.mesh);
      thrownGrenades.splice(i, 1);

      spawnBurst(gx, gz, 0xffaa00, 32, 1.5, 7.2);
      spawnBurst(gx, gz, 0xff3b3b, 22, 1.0, 5.2);
      shake = Math.min(1.1, shake + 0.65);
      screenFlash = Math.max(screenFlash, 0.5);
      try { if (navigator.vibrate) navigator.vibrate([50, 30, 90]); } catch (e) {}
      sfx.shot('shotgun');

      for (let j = zombies.length - 1; j >= 0; j--) {
        const z = zombies[j];
        if (z.dead) continue;
        // Only zombies visible on the screen can be damaged/killed by grenades!
        if (!isZombieOnScreen(z)) continue;
        const d = dist2(gx, gz, z.root.position.x, z.root.position.z);
        if (d <= 7.0) {
          const dmg = Math.round(290 * (1 - d / 8.5));
          z.hp -= dmg;
          z.hitFlash = 1;
          spawnFloatingDamage(z.root.position.x, z.root.position.z, dmg, true);
          if (z.hp <= 0) killZombie(j);
        }
      }
      updateHUD();
    }
  }
}

function updateEnemyBullets(dt) {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.mesh.position.addScaledVector(b.dir, b.speed * dt);
    b.life += dt;

    if (b.isVenomBomb) {
      // Venom projectile animation: pulsating size, spinning, parabolic height arc, trailing particles
      const pulse = 1.0 + Math.sin(b.life * 18) * 0.25;
      b.mesh.scale.setScalar(pulse);
      b.mesh.rotation.y += dt * 8;
      b.mesh.rotation.x += dt * 6;
      const prog = Math.min(1.0, b.life / (b.maxLife || 1.0));
      b.mesh.position.y = 1.8 * Math.sin(prog * Math.PI) + 0.35;

      if (Math.random() < 0.6) {
        spawnBurst(b.mesh.position.x, b.mesh.position.z, 0x39ff14, 1, 0.15, 0.55);
      }

      const dPlayer = dist2(b.mesh.position.x, b.mesh.position.z, player.root.position.x, player.root.position.z);
      if (dPlayer < 0.85 || b.life >= (b.maxLife || 1.8)) {
        if (dPlayer < 0.85) {
          hurtPlayer(b.damage);
        }
        // Creates animated bubbling poison puddle on the ground with burst animation
        spawnToxicPool(b.mesh.position.x, b.mesh.position.z, b.puddleRadius || 2.5, b.puddleDuration || 5.2, b.puddleDmg || 7, 0.5);
        spawnBurst(b.mesh.position.x, b.mesh.position.z, 0x39ff14, 18, 0.8, 3.4);
        spawnBurst(b.mesh.position.x, b.mesh.position.z, 0x76ff03, 10, 0.5, 2.0);
        scene.remove(b.mesh);
        b.mesh.geometry?.dispose?.();
        b.mesh.material?.dispose?.();
        enemyBullets.splice(i, 1);
        continue;
      }
    } else {
      if (dist2(b.mesh.position.x, b.mesh.position.z, player.root.position.x, player.root.position.z) < 0.72) {
        hurtPlayer(b.damage);
        spawnBurst(b.mesh.position.x, b.mesh.position.z, 0x88ffba, 7, 0.5, 1.7);
        scene.remove(b.mesh);
        enemyBullets.splice(i, 1);
        continue;
      }
      if (b.life > 2.2) {
        scene.remove(b.mesh);
        enemyBullets.splice(i, 1);
      }
    }
  }
}

function updateToxicPools(dt) {
  for (let i = toxicPools.length - 1; i >= 0; i--) {
    const tp = toxicPools[i];
    tp.life -= dt;
    tp.tickCd = Math.max(0, tp.tickCd - dt);
    if (tp.life <= 0) {
      scene.remove(tp.mesh);
      tp.mat?.dispose?.();
      toxicPools.splice(i, 1);
      continue;
    }
    // Pulse, slow swirl, bubbling and fade out in final second
    const fade = Math.min(1, tp.life / 1.0);
    tp.mat.opacity = (0.62 + Math.sin(clock.elapsedTime * 5 + i) * 0.12) * fade;
    tp.mesh.rotation.z += dt * 0.18;
    tp.mesh.scale.setScalar(tp.radius * (1 + Math.sin(clock.elapsedTime * 3.2 + i * 1.7) * 0.035));
    if (tp.bubbles) {
      for (let b = 0; b < tp.bubbles.length; b++) {
        const bb = tp.bubbles[b];
        bb.t += dt * bb.speed;
        if (bb.t >= 1) {
          bb.t = 0;
          const ba = Math.random() * TAU, bd = Math.sqrt(Math.random()) * 0.72;
          bb.mesh.position.set(Math.cos(ba) * bd, Math.sin(ba) * bd, 0.01);
        }
        // grow then pop (shrinks quickly at the end of its cycle)
        const s = (bb.t < 0.8 ? bb.t / 0.8 : (1 - bb.t) / 0.2) * 0.13 * fade;
        bb.mesh.scale.setScalar(Math.max(0.001, s));
      }
    }
    if (player && tp.tickCd <= 0) {
      const d = dist2(tp.x, tp.z, player.root.position.x, player.root.position.z);
      if (d <= tp.radius + PLAYER_RADIUS * 0.5) {
        tp.tickCd = tp.interval;
        hurtPlayer(tp.dmg);
        spawnBurst(player.root.position.x, player.root.position.z, 0x39ff14, 4, 0.4, 1.2);
      }
    }
  }
}

function updateDyingZombies(dt) {
  for (let i = dyingZombies.length - 1; i >= 0; i--) {
    const d = dyingZombies[i];
    d.timer -= dt;
    const progress = 1 - Math.max(0, d.timer / d.maxTimer);
    d.root.rotation.x = progress * 1.45 * d.fallDir;
    d.root.position.y = -progress * 0.35;
    d.root.scale.setScalar(d.baseScale * (1 - progress * 0.25));
    if (d.timer <= 0) {
      scene.remove(d.root);
      dyingZombies.splice(i, 1);
    }
  }
}

function updateZombies(dt) {
  const cryoMult = run && run.cryoTimer > 0 ? 0.35 : 1.0;

  for (let i = 0; i < zombies.length; i++) {
    const z = zombies[i];
    if (z.dead) continue;
    const cfg = zombieTypes[z.type] || zombieTypes.walker;
    const isHeavy = z.type === 'brute' || z.type === 'boss';
    const isToxicBoss = z.bossArchetype === 'toxic_boss' || z.bossArchetype === 'blight_mini';
    const isToxic = z.type === 'toxic' || z.type === 'spitter' || isToxicBoss;
    const baseScale = z.baseScale || cfg.scale;

    // 1. Cada zombie tem o seu próprio temporizador independente de ~6 segundos
    if (screen === 'game' && !paused) {
      if (typeof z.groanTimer !== 'number') {
        z.groanTimer = rand(0.5, 6.0);
      }
      z.groanTimer -= dt;
      if (z.groanTimer <= 0) {
        // Intervalo de ~6 segundos com pequenas variações aleatórias (ex: 5.4s a 6.6s)
        z.groanTimer = rand(5.4, 6.6);
        playZombieSpatialGroan(z);
      }
    }

    z.atkCd = Math.max(0, z.atkCd - dt * cryoMult);
    z.atkAnim = Math.max(0, (z.atkAnim || 0) - dt * 3.5);
    z.hitFlash = Math.max(0, z.hitFlash - dt * 4.5);
    if (z.hitFlash <= 0) z.root.scale.setScalar(baseScale);

    if (z.auraRing) {
      const auraPulse = 1.14 + Math.sin(clock.elapsedTime * 5.2 + i) * 0.08;
      z.auraRing.scale.setScalar(auraPulse);
    }

    let dx = player.root.position.x - z.root.position.x;
    let dz = player.root.position.z - z.root.position.z;
    let d = Math.hypot(dx, dz) || 1;

    // Se o jogador se afastar muito, reposiciona os zombies restantes mais perto (fora do campo de visão)
    z.repositionCd = Math.max(0, (z.repositionCd || 0) - dt);
    const maxLeashDist = z.isBoss ? 56 : 42;
    if (d > maxLeashDist && z.repositionCd <= 0 && (!z.smashTimer || z.smashTimer <= 0)) {
      const newPos = findSafeSpawnPosition(z.hitR);
      if (!isPositionOnScreen(newPos.x, newPos.z, 0.15)) {
        z.root.position.set(newPos.x, 0, newPos.z);
        z.lastX = newPos.x;
        z.lastZ = newPos.z;
        z.unstuckTimer = 0;
        z.stuckSampleTimer = 0;
        z.repositionCd = 2.0;

        // Recalcula o vetor e distância para o jogador a partir da nova posição
        dx = player.root.position.x - newPos.x;
        dz = player.root.position.z - newPos.z;
        d = Math.hypot(dx, dz) || 1;
      }
    }

    // Perseguição ininterrupta do jogador independentemente da distância (sem limite de deteção ou idle)
    z.state = 'chase';
    z.step += dt * cryoMult * (z.animSpeed || 5.3);

    let speed = z.speed * cryoMult;
    let vx = (dx / d) * speed;
    let vz = (dz / d) * speed;

    // 1. RUNNER: Fast Flanking & Surround Behaviour
    if (z.type === 'runner') {
      z.state = 'run';
      if (d > 3.2 && d < 14.0) {
        const flankFactor = 0.36 * z.flankSign;
        vx += (-dz / d) * speed * flankFactor;
        vz += (dx / d) * speed * flankFactor;
      }
    }

    // 2. BRUTE, MINI-BOSS & MAIN BOSS: Telegraphed Ground-Smash / Nova AoE, Charge & Summon
    if (isHeavy) {
      z.smashCd = Math.max(0, (z.smashCd || 0) - dt * cryoMult);
      const sRad = z.smashRadius || cfg.smashRadius || 4.2;

      if (z.smashTimer > 0) {
        z.state = 'special';
        z.smashTimer -= dt * cryoMult;
        // Heavy zombies keep advancing while winding up their smash attack (no more freezing in place)
        vx *= 0.78;
        vz *= 0.78;
        if (z.smashRing) {
          z.smashRing.visible = true;
          const pulse = 0.88 + Math.sin(clock.elapsedTime * 18) * 0.12;
          z.smashRing.scale.setScalar((sRad / baseScale) * pulse);
        }
        if (z.smashTimer <= 0) {
          // Execute Telegraphed Ground-Smash / Nova AoE!
          if (z.smashRing) z.smashRing.visible = false;
          z.smashCd = z.baseSmashCd || cfg.smashCd || 5.5;
          z.atkAnim = 0.35;
          const burstColor = isToxicBoss ? 0x39ff14 : z.bossArchetype === 'armored_boss' ? 0x00e5ff : z.bossArchetype === 'mutated_boss' ? 0xd500f9 : 0xff5522;
          spawnBurst(z.root.position.x, z.root.position.z, burstColor, z.isBoss ? 30 : 22, 1.5, 5.8);
          shake = Math.min(1.05, shake + (z.isBoss ? 0.58 : 0.45));
          if (sfx && sfx.zombieGroan) sfx.zombieGroan(z.isBoss ? 'boss' : 'brute', z);

          // Toxic Boss & Blight Mini-Boss spawn acid pools on Nova slam
          if (isToxicBoss) {
            spawnToxicPool(z.root.position.x, z.root.position.z, z.isBoss ? 3.0 : 2.4, 5.2, 6, 0.6);
          }

          if (d <= sRad + PLAYER_RADIUS) {
            const baseSmashDmg = z.smashDamage || cfg.smashDamage || 24;
            const sDmg = Math.round(baseSmashDmg * (1 - (d / (sRad + 1.5)) * 0.4));
            hurtPlayer(Math.max(10, sDmg));
          }
        }
      } else if (d < sRad * 0.92 && z.smashCd <= 0) {
        z.smashTimer = z.smashWindup || cfg.smashWindup || 0.65;
        if (sfx && sfx.zombieGroan) sfx.zombieGroan(z.isBoss ? 'boss' : 'brute', z);
      }

      // Heavy / Shield / Frenzy Charge at mid-close range
      if (z.smashTimer <= 0) {
        const chargeTriggerDist = z.isBoss ? 11.5 : 9.0;
        if (d < chargeTriggerDist && d > 2.6 && z.charge <= 0 && Math.random() < dt * (z.isBoss ? 0.95 : 0.75)) {
          z.charge = z.bossArchetype === 'stalker_mini' || z.bossArchetype === 'mutated_boss' ? 0.95 : 0.85;
          if (sfx && sfx.zombieGroan) sfx.zombieGroan(z.type, z);
        }
        if (z.charge > 0) {
          const chargeMult = (z.bossArchetype === 'stalker_mini' || z.bossArchetype === 'riot_mini' || z.bossArchetype === 'armored_boss') ? 2.25 : 2.05;
          speed *= chargeMult;
          vx = (dx / d) * speed;
          vz = (dz / d) * speed;
          z.charge -= dt;
        }
      }

      // Mutated Boss ("APEX OVERLORD"): Controlled Horde Call reinforcement summon
      if (z.bossArchetype === 'mutated_boss' && run) {
        z.summonCd = Math.max(0, (z.summonCd || 0) - dt * cryoMult);
        if (z.summonCd <= 0 && zombies.length < WAVE_SCALING_CONFIG.maxActiveZombies - 2) {
          z.summonCd = 11.0;
          z.atkAnim = 0.35;
          spawnBurst(z.root.position.x, z.root.position.z, 0xd500f9, 24, 1.2, 4.5);
          if (sfx && sfx.zombieGroan) sfx.zombieGroan('boss', z);
          const mults = getWaveDifficultyMultipliers(run.wave);
          for (let s = 0; s < 2; s++) {
            const sumType = s === 0 ? 'runner' : 'walker';
            const minion = createZombie(sumType);
            const mBase = zombieTypes[sumType];
            minion.hp = minion.maxHp = Math.round(mBase.hp * mults.hpMult);
            minion.speed = mBase.speed * mults.speedMult;
            minion.damage = Math.round(mBase.damage * mults.dmgMult);
            minion.reward = Math.round(mBase.reward * mults.rewardMult);
            minion.score = Math.round(mBase.score * mults.scoreMult);
            const mPos = findSafeSpawnPosition(minion.hitR);
            minion.root.position.set(mPos.x, 0, mPos.z);
            minion.lastX = mPos.x;
            minion.lastZ = mPos.z;
            zombies.push(minion);
            run.waveTotal = (run.waveTotal || 0) + 1;
            run.waveSpawned = (run.waveSpawned || 0) + 1;
          }
          updateHUD();
        }
      }

      // Boss Ranged Venom Bomb Attack: launches animated poison projectiles that create animated poison puddles
      if (z.isBoss || z.type === 'boss' || z.isMiniBoss) {
        z.bossRangedCd = Math.max(0, (z.bossRangedCd || 0) - dt * cryoMult);
        if (d > 4.5 && d < 25 && z.bossRangedCd <= 0 && (!z.smashTimer || z.smashTimer <= 0)) {
          z.bossRangedCd = rand(4.0, 6.2);
          z.atkAnim = 0.35;
          if (sfx && sfx.zombieGroan) sfx.zombieGroan('boss', z);

          const venomGeo = new THREE.SphereGeometry(0.32, 10, 10);
          const venomMat = new THREE.MeshBasicMaterial({ color: 0x39ff14 });
          const pMesh = new THREE.Mesh(venomGeo, venomMat);
          pMesh.position.set(z.root.position.x, 2.0, z.root.position.z);
          scene.add(pMesh);

          const targetX = player.root.position.x + rand(-0.35, 0.35);
          const targetZ = player.root.position.z + rand(-0.35, 0.35);
          const fdx = targetX - z.root.position.x;
          const fdz = targetZ - z.root.position.z;
          const fdist = Math.hypot(fdx, fdz) || 1;
          const projSpeed = 10.5;
          const totalLife = fdist / projSpeed;

          enemyBullets.push({
            mesh: pMesh,
            dir: new THREE.Vector3(fdx / fdist, 0, fdz / fdist),
            speed: projSpeed,
            damage: Math.round(18 + run.wave * 1.5),
            life: 0,
            maxLife: totalLife,
            isVenomBomb: true,
            puddleRadius: z.isBoss ? 2.8 : 2.2,
            puddleDuration: 5.2,
            puddleDmg: 7
          });
          spawnBurst(z.root.position.x, z.root.position.z, 0x39ff14, 12, 0.6, 2.4);
        }
      }
    }

    // 3. CRAWLER: Low Serpentine Approach & Sudden Pounce Lunge
    if (z.type === 'crawler') {
      z.pounceCd = Math.max(0, (z.pounceCd || 0) - dt * cryoMult);
      if (z.pounceTimer > 0) {
        z.pounceTimer -= dt;
        speed *= (cfg.pounceSpeedMult || 1.85);
        vx = (dx / d) * speed;
        vz = (dz / d) * speed;
      } else {
        const side = Math.sin(clock.elapsedTime * 5 + z.crawlOffset) * 0.7;
        vx += Math.cos(z.root.rotation.y + Math.PI / 2) * side;
        vz += Math.sin(z.root.rotation.y + Math.PI / 2) * side;
        if (d < (cfg.pounceRange || 3.6) && d > 1.4 && z.pounceCd <= 0) {
          z.pounceTimer = 0.32;
          z.pounceCd = 2.6;
          z.atkAnim = 0.30;
        }
      }
    }

    // 4. TOXIC (and Spitter): Poison Ground Trail & Ranged Acid Globule
    if (isToxic) {
      z.toxicTrailCd = Math.max(0, (z.toxicTrailCd || 0) - dt * cryoMult);
      if (z.toxicTrailCd <= 0 && d < 24) {
        z.toxicTrailCd = rand(2.8, 4.0);
        spawnToxicPool(z.root.position.x, z.root.position.z, cfg.poolRadius || 2.1, cfg.poolDuration || 4.5, cfg.poolDmg || 5, cfg.poolInterval || 0.6);
        spawnBurst(z.root.position.x, z.root.position.z, 0x39ff14, 5, 0.4, 1.4);
      }
      if (d > 6 && d < 15) {
        vx *= 0.55;
        vz *= 0.55;
        if (z.atkCd <= 0) {
          z.atkCd = rand(1.3, 2.2);
          z.atkAnim = 0.28;
          const mesh = new THREE.Mesh(enemyBulletGeo, new THREE.MeshBasicMaterial({ color: 0x9cffbf }));
          mesh.position.set(z.root.position.x, 1.2, z.root.position.z);
          scene.add(mesh);
          enemyBullets.push({ mesh, dir: new THREE.Vector3(dx / d, 0, dz / d), speed: 8.8, damage: 10 + run.wave, life: 0 });
        }
      }
    }

    // 5. Zombie Movement & Obstacle Collision (Anti-Stuck + Multi-Angle Whiskers + Axis-Separated Sliding)
    // Separar Hitbox de Ambiente da Hitbox de Combate:
    // Todos os zombies normais usam um raio de colisão de ambiente (envRadius <= PLAYER_RADIUS),
    // garantindo que conseguem passar nos mesmos caminhos estreitos (ex: entre casa e árvore) que o jogador passa.
    // Apenas Zombies Grandes, Brutes e Bosses mantêm o raio de colisão de ambiente maior.
    const isBigZombie = z.type === 'brute' || z.type === 'boss' || z.isBoss || z.isMiniBoss || (z.baseScale && z.baseScale >= 1.6);
    const envRadius = isBigZombie ? (z.envHitR || z.hitR) : Math.min(PLAYER_RADIUS, 0.50);

    const baseMoveSpd = Math.hypot(vx, vz);
    const toPlayerAngle = Math.atan2(dx, dz);
    let chosenMoveAngle = toPlayerAngle;

    // Mecanismo 3: Detetor Anti-Stuck (Unstuck Timer)
    // Guarda a última posição a cada 0.5s. Se a distância percorrida for quase zero, testa qual direção lateral está livre
    z.stuckSampleTimer = (z.stuckSampleTimer || 0) + dt;
    if (z.stuckSampleTimer >= 0.5) {
      const distSample = Math.hypot(
        z.root.position.x - (z.lastSampleX ?? z.root.position.x),
        z.root.position.z - (z.lastSampleZ ?? z.root.position.z)
      );
      z.lastSampleX = z.root.position.x;
      z.lastSampleZ = z.root.position.z;
      z.stuckSampleTimer = 0;

      if (distSample < 0.08 && d > (z.atkRange || 1.2) + 0.3 && (!z.smashTimer || z.smashTimer <= 0)) {
        // Verifica qual direção lateral (+90° ou -90°) tem espaço livre de obstáculos
        const angleRight = toPlayerAngle + Math.PI * 0.5;
        const angleLeft = toPlayerAngle - Math.PI * 0.5;
        const probeR = envRadius * 0.6;
        const rightClear = !checkObstacleCollision(z.root.position.x + Math.sin(angleRight) * 0.75, z.root.position.z + Math.cos(angleRight) * 0.75, probeR);
        const leftClear = !checkObstacleCollision(z.root.position.x + Math.sin(angleLeft) * 0.75, z.root.position.z + Math.cos(angleLeft) * 0.75, probeR);

        if (rightClear || leftClear) {
          z.unstuckTimer = 0.6;
          z.unstuckAngle = (rightClear && !leftClear) ? angleRight : (!rightClear && leftClear) ? angleLeft : (z.unstuckSign === 1 ? angleRight : angleLeft);
          z.unstuckSign = (z.unstuckSign === 1) ? -1 : 1;
        } else {
          // Ambos os lados bloqueados (corredor estreito entre objetos): mantém o avanço direto em direção ao jogador!
          z.unstuckTimer = 0;
        }
      }
    }

    if (z.unstuckTimer > 0) {
      z.unstuckTimer -= dt;
      chosenMoveAngle = z.unstuckAngle;
    } else if (baseMoveSpd > 0.001) {
      // Mecanismo 2: Sistema de "Whiskers" (Multi-Angle Raycasting)
      // Testa ponto logo à frente. Se colidir com obstáculo frontal, testa incrementos angulares
      const whiskerDist = envRadius + 0.65;
      const frontX = z.root.position.x + Math.sin(toPlayerAngle) * whiskerDist;
      const frontZ = z.root.position.z + Math.cos(toPlayerAngle) * whiskerDist;

      // Se o caminho direto estiver livre ou o jogador estiver mais próximo que o whisker, vai direto ao jogador
      if (d > whiskerDist && checkObstacleCollision(frontX, frontZ, envRadius * 0.55)) {
        const DEG25 = 25 * (Math.PI / 180);
        const whiskerOffsets = [
          DEG25, -DEG25,
          DEG25 * 2, -DEG25 * 2,
          DEG25 * 3, -DEG25 * 3,
          Math.PI * 0.5, -Math.PI * 0.5
        ];

        for (let a = 0; a < whiskerOffsets.length; a++) {
          const testAngle = toPlayerAngle + whiskerOffsets[a];
          const testProbeX = z.root.position.x + Math.sin(testAngle) * whiskerDist;
          const testProbeZ = z.root.position.z + Math.cos(testAngle) * whiskerDist;
          if (!checkObstacleCollision(testProbeX, testProbeZ, envRadius * 0.55)) {
            chosenMoveAngle = testAngle;
            break; // Move na primeira direção livre!
          }
        }
      }
    }

    // Velocidade final ajustada pelo ângulo livre
    const effVx = Math.sin(chosenMoveAngle) * baseMoveSpd;
    const effVz = Math.cos(chosenMoveAngle) * baseMoveSpd;

    // Mecanismo 1: Colisão por Eixos Separados (Sliding X/Z) com o raio de ambiente
    // Testa novoX e novoZ de forma independente. Se X colidir, cancela apenas X mantendo Z (e vice-versa)
    const stepX = effVx * dt;
    const stepZ = effVz * dt;
    const curX = z.root.position.x;
    const curZ = z.root.position.z;
    const collR = envRadius;

    // 1. Testa eixo X de forma independente
    const candidateX = curX + stepX;
    let appliedX = curX;
    if (!checkObstacleCollision(candidateX, curZ, collR)) {
      appliedX = candidateX; // Eixo X livre
    }

    // 2. Testa eixo Z de forma independente
    const candidateZ = curZ + stepZ;
    let appliedZ = curZ;
    if (!checkObstacleCollision(appliedX, candidateZ, collR)) {
      appliedZ = candidateZ; // Eixo Z livre
    }

    // GARANTIA DE PASSAGEM EM ESPAÇOS ESTREITOS (ex: entre casa e árvore):
    // Se ambos os eixos forem bloqueados por constrangimento entre dois obstáculos,
    // NUNCA bloqueia o movimento total: avança o passo desejado em direção ao alvo e deixa
    // a resolução de sobreposição (relaxation) empurrar o zombie pelo centro do corredor, exatamente como o jogador faz!
    if (appliedX === curX && appliedZ === curZ && baseMoveSpd > 0.001) {
      appliedX = curX + stepX;
      appliedZ = curZ + stepZ;
    }

    z.root.position.x = appliedX;
    z.root.position.z = appliedZ;

    // Resolução de sobreposição para impedir qualquer clipping e nunca entrar nos objetos
    collideObstacles(z.root.position, collR);

    // Orientação suave do corpo do zombie
    let targetHeading = toPlayerAngle;
    const actualMoved = Math.hypot(appliedX - curX, appliedZ - curZ);
    if (actualMoved > 0.001 && d > (z.atkRange || 1.2) + 0.3) {
      targetHeading = Math.atan2(appliedX - curX, appliedZ - curZ);
    } else {
      targetHeading = chosenMoveAngle;
    }
    let rotDiff = targetHeading - z.root.rotation.y;
    while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
    while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
    z.root.rotation.y += rotDiff * Math.min(1.0, dt * 14.0);

    z.lastX = z.root.position.x;
    z.lastZ = z.root.position.z;

    // 6. Limb & State Animations (Walk / Run / Crawl / Attack Swing / Brute Windup)
    const walk = z.step;
    const atkSwing = z.atkAnim > 0 ? Math.sin((z.atkAnim / 0.30) * Math.PI) * 0.85 : 0;
    if (z.legL && z.legR) {
      if (z.type === 'crawler') {
        z.legL.p.rotation.x =  Math.sin(walk) * 0.52;
        z.legR.p.rotation.x = -Math.sin(walk) * 0.52;
        z.legL.k.rotation.x = Math.max(0, Math.sin(walk + 0.4)) * 0.42;
        z.legR.k.rotation.x = Math.max(0, Math.sin(walk - 0.4 + Math.PI)) * 0.42;
        z.armL.rotation.x = -0.7 + Math.sin(walk) * 0.55 - atkSwing * 0.5;
        z.armR.rotation.x = -0.7 - Math.sin(walk) * 0.55 - atkSwing * 0.5;
      } else {
        const amp = z.type === 'runner' ? 0.72 : isHeavy ? 0.50 : 0.55;
        z.legL.p.rotation.x =  Math.sin(walk) * amp;
        z.legR.p.rotation.x = -Math.sin(walk) * amp;
        z.legL.k.rotation.x = Math.max(0, Math.sin(walk + 0.5)) * 0.5;
        z.legR.k.rotation.x = Math.max(0, Math.sin(walk - 0.5 + Math.PI)) * 0.5;
        if (z.armL && z.armL.p) {
          if (isHeavy && z.smashTimer > 0) {
            // Raise both massive arms high overhead for ground-smash preparation!
            z.armL.p.rotation.x = -2.35;
            z.armR.p.rotation.x = -2.35;
          } else {
            const baseArmPitch = z.type === 'runner' ? -0.6 : z.type === 'armored' ? -0.85 : isHeavy ? -0.45 : -0.95;
            z.armL.p.rotation.x = baseArmPitch - Math.sin(walk) * 0.3 - atkSwing;
            z.armR.p.rotation.x = baseArmPitch + Math.sin(walk) * 0.3 - atkSwing;
          }
        }
        if (z.headPiv) z.headPiv.rotation.z = Math.sin(walk * 0.5) * (isHeavy ? 0.06 : 0.12);
        if (z.torso) z.torso.rotation.x = (isHeavy ? 0.08 : z.type === 'runner' ? 0.12 : 0.20) + Math.sin(walk * 0.5) * 0.04 + atkSwing * 0.18;
      }
    }
    const shadowScale = isHeavy ? 1.7 : z.type === 'armored' ? 1.15 : z.type === 'crawler' ? 0.95 : 1.05;
    z.shadow.scale.setScalar(shadowScale);

    // 7. Zombie-to-Zombie Separation
    for (let k = i + 1; k < zombies.length; k++) {
      const o = zombies[k];
      const ddx = o.root.position.x - z.root.position.x;
      const ddz = o.root.position.z - z.root.position.z;
      const dd = Math.hypot(ddx, ddz);
      const min = z.hitR + o.hitR;
      if (dd < min && dd > 0.001) {
        const push = (min - dd) * 0.20;
        const nx = ddx / dd, nz = ddz / dd;
        z.root.position.x -= nx * push; z.root.position.z -= nz * push;
        o.root.position.x += nx * push; o.root.position.z += nz * push;
      }
    }

    // 8. Melee Attack Check within Configurable Range & Cooldown
    const reach = Math.max(z.atkRange || 1.65, z.hitR + PLAYER_RADIUS + 0.35);
    if (d < reach && z.atkCd <= 0 && (!z.smashTimer || z.smashTimer <= 0)) {
      z.atkCd = z.baseAtkCd || 0.70;
      z.atkAnim = 0.28;
      z.state = 'attack';
      if (sfx && sfx.zombieGroan) sfx.zombieGroan(z.type, z);
      hurtPlayer(z.damage);
    }
  }
}

function updatePickups(dt) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    p.t += dt;
    p.mesh.position.y = 0.42 + Math.sin(p.t * 4) * 0.08;
    p.mesh.rotation.y += dt * 2.6;
    const d = dist2(player.root.position.x, player.root.position.z, p.mesh.position.x, p.mesh.position.z);
    // Grenade pickups cannot be collected (or magnetised) while the pouch is already full
    const grenadePouchFull = p.kind === 'grenade' && (meta?.grenadesCount || 0) >= MAX_EQUIPPED_GRENADES;
    if (d < 5.5 && !grenadePouchFull) p.magnet = true;
    if (grenadePouchFull) p.magnet = false;
    if (p.magnet && d > 0.01) {
      const pullSpeed = Math.max(7, 14 - d);
      p.mesh.position.x += ((player.root.position.x - p.mesh.position.x) / d) * dt * pullSpeed;
      p.mesh.position.z += ((player.root.position.z - p.mesh.position.z) / d) * dt * pullSpeed;
    }
    if (d < 0.85 && !grenadePouchFull) {
      if (p.kind === 'grenade') {
        meta = loadMeta();
        meta.grenadesCount = Math.min(MAX_EQUIPPED_GRENADES, (meta.grenadesCount || 0) + 1);
        sfx.pickup();
        toast('+1 Grenade (' + meta.grenadesCount + '/' + MAX_EQUIPPED_GRENADES + ')');
      } else if (p.kind === 'bone') {
        run.bones += p.value;
        run.score += p.value * 3;
        meta.bankBones += p.value;
        meta.totalBonesCollected += p.value;
        sfx.pickup();
        toast('+' + p.value + ' bones');
      } else if (p.kind === 'medkit') {
        if (DEBUG_BALANCE && waveStats.active) waveStats.medkitsCollected++;
        player.hp = clamp(player.hp + p.value, 0, player.maxHp);
        toast('Medkit restored ' + p.value + ' HP');
      } else if (p.kind === 'kevlar') {
        if (DEBUG_BALANCE && waveStats.active) waveStats.kevlarCollected++;
        player.shield = clamp((player.shield || 0) + p.value, 0, player.maxShield || 100);
        sfx.pickup();
        toast('Kevlar Armor +' + p.value);
      } else if (p.kind === 'overcharge') {
        run.overchargeTimer = 7.0;
        if (player) {
          const wepKey = player.weapon || 'carbine';
          const wepCfg = weapons[wepKey] || weapons.carbine;
          player.ammo = wepCfg.maxAmmo || 30;
          player.reloadCd = 0;
          player.reloadTotal = 0;
        }
        sfx.pickup();
        showBanner('OVERCHARGE', '2X Fire Rate & Instant Reload for 7s');
      } else if (p.kind === 'magnet') {
        pickups.forEach(pk => { if (pk.kind === 'bone') pk.magnet = true; });
        sfx.pickup();
        showBanner('SUPER MAGNET', 'Pulling all bones in arena');
      } else if (p.kind === 'cryo') {
        run.cryoTimer = 5.5;
        sfx.pickup();
        showBanner('CRYO FREEZE', 'Zombies slowed for 5.5s');
      }
      saveMeta();
      scene.remove(p.mesh);
      pickups.splice(i, 1);
      renderMeta();
      updateHUD();
    }
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      p.mesh.material?.dispose?.();
      particles.splice(i, 1);
      continue;
    }
    p.vy -= 5.8 * dt;
    p.mesh.position.x += p.vx * dt;
    p.mesh.position.y += p.vy * dt;
    p.mesh.position.z += p.vz * dt;
    if (p.mesh.position.y < 0.05) {
      p.mesh.position.y = 0.05;
      p.vy *= -0.25;
      p.vx *= 0.7;
      p.vz *= 0.7;
    }
    p.mesh.material.opacity = clamp(p.life / p.ttl, 0, 1);
  }
}

function updateSpawning(dt) {
  if (!run) return;
  if (run.waveLeft > 0) {
    run.spawnCd -= dt;
    if (run.spawnCd <= 0) {
      const mults = getWaveDifficultyMultipliers(run.wave);
      if (zombies.length < WAVE_SCALING_CONFIG.maxActiveZombies) {
        spawnZombie();
        if (run.wave >= 5 && run.waveLeft > 0 && zombies.length < WAVE_SCALING_CONFIG.maxActiveZombies && Math.random() < 0.14) {
          spawnZombie();
        }
        if (run.wave >= 9 && run.waveLeft > 0 && zombies.length < WAVE_SCALING_CONFIG.maxActiveZombies && Math.random() < 0.10) {
          spawnZombie();
        }
        run.spawnCd = mults.spawnInterval;
      } else {
        // Wait briefly when active zombie cap is reached
        run.spawnCd = 0.25;
      }
    }
  } else if (zombies.length === 0 && (!run.bossRequired || run.bossDefeated)) {
    if (!run.waveCompleted) {
      run.waveCompleted = true;
      run.nextWaveCd = WAVE_SCALING_CONFIG.prepInterval;
      metaMax('bestWave', run.wave);
      showBanner(`WAVE ${run.wave} CLEARED!`, 'Next wave starting shortly...');
      if (DEBUG_BALANCE) endWaveDebug();
    }
    run.nextWaveCd -= dt;
    if (run.nextWaveCd <= 0) {
      run.nextWaveCd = 0;
      startWave(run.wave + 1);
    }
  }
}

/* ── COMPANIONS SYSTEM (PHASE 7: DOG, DRONE, ROBOT, MEDIC) ── */

function compCanHit(z, fx, fz) {
  if (!z || z.dead || z.hp <= 0) return false;
  if (!isZombieOnScreen(z)) return false;
  return hasClearLineOfSight(fx, fz, z.root.position.x, z.root.position.z);
}

function createDogModel() {
  const root = new THREE.Group();

  const bodyM = mat(0x7a5028, 0.9);
  const darkM = mat(0x281c12, 0.95);
  const vestM = mat(0x1a3d5c, 0.75);
  const eyeM  = mat(0x39ff14, 0.1, 0, 0x39ff14, 1.2);

  const body = new THREE.Group(); body.position.y = 0.52; root.add(body);
  box(0.38, 0.42, 0.85, bodyM, 0, 0, 0, body);
  box(0.40, 0.28, 0.50, darkM, 0, 0.08, 0.05, body);
  box(0.42, 0.26, 0.42, vestM, 0, 0.06, 0.02, body);
  box(0.12, 0.12, 0.08, mat(0x39ff14, 0.1, 0, 0x39ff14, 1.0), 0, 0.12, 0.22, body);

  const headPiv = new THREE.Group(); headPiv.position.set(0, 0.22, 0.42); body.add(headPiv);
  box(0.30, 0.32, 0.32, bodyM, 0, 0, 0, headPiv);
  box(0.20, 0.18, 0.28, darkM, 0, -0.06, 0.22, headPiv);
  box(0.08, 0.08, 0.08, darkM, 0, 0.01, 0.35, headPiv);

  box(0.08, 0.20, 0.08, darkM, -0.11, 0.22, -0.05, headPiv);
  box(0.08, 0.20, 0.08, darkM,  0.11, 0.22, -0.05, headPiv);

  sph(0.04, 6, 6, eyeM, -0.11, 0.08, 0.15, headPiv);
  sph(0.04, 6, 6, eyeM,  0.11, 0.08, 0.15, headPiv);

  function makeDogLeg(px, pz) {
    const hip = new THREE.Group(); hip.position.set(px, -0.18, pz); body.add(hip);
    box(0.14, 0.36, 0.14, bodyM, 0, -0.18, 0, hip);
    const paw = new THREE.Group(); paw.position.y = -0.36; hip.add(paw);
    box(0.12, 0.24, 0.12, darkM, 0, -0.12, 0, paw);
    box(0.14, 0.08, 0.18, darkM, 0, -0.22, 0.03, paw);
    return { hip, paw };
  }

  const legFL = makeDogLeg(-0.16,  0.30);
  const legFR = makeDogLeg( 0.16,  0.30);
  const legBL = makeDogLeg(-0.16, -0.30);
  const legBR = makeDogLeg( 0.16, -0.30);

  const tailPiv = new THREE.Group(); tailPiv.position.set(0, 0.12, -0.42); body.add(tailPiv);
  box(0.08, 0.08, 0.38, darkM, 0, 0, -0.18, tailPiv);
  tailPiv.rotation.x = -0.4;

  const shadow = new THREE.Mesh(circleShadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01; shadow.scale.setScalar(0.8);
  root.add(shadow);

  scene.add(root);

  return {
    type: 'dog',
    root, body, headPiv, tailPiv,
    legFL, legFR, legBL, legBR,
    targetZombie: null,
    atkCd: 0,
    trotTime: 0,
    vx: 0, vz: 0,
    aiTimer: 0,
    stuckTimer: 0,
    steerDir: 1
  };
}

function createDroneModel() {
  const root = new THREE.Group();
  const darkM = mat(0x16222c, 0.4, 0.8);
  const cyanM = mat(0x00e5ff, 0.1, 0.2, 0x00e5ff, 1.5);
  box(0.45, 0.14, 0.45, darkM, 0, 0, 0, root);
  sph(0.14, 10, 10, cyanM, 0, -0.05, 0.16, root);
  for (const sx of [-0.32, 0.32]) {
    for (const sz of [-0.32, 0.32]) {
      cyl(0.16, 0.16, 0.03, 10, cyanM, sx, 0.06, sz, root);
    }
  }
  const shadow = new THREE.Mesh(circleShadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01; shadow.scale.setScalar(0.65);
  root.add(shadow);

  scene.add(root);
  return {
    type: 'drone',
    root,
    atkCd: 0,
    orbitAngle: 0,
    targetZombie: null,
    aiTimer: 0
  };
}

function createRobotModel() {
  const root = new THREE.Group();
  const metalM = mat(0x2b3744, 0.5, 0.8);
  const bluePlateM = mat(0x1e3a5f, 0.4, 0.6);
  const eyeM = mat(0x38bdf8, 0.1, 0, 0x38bdf8, 1.8);
  const yellowM = mat(0xf59e0b, 0.3, 0.5);

  const body = new THREE.Group(); body.position.y = 0.75; root.add(body);
  box(0.55, 0.65, 0.42, metalM, 0, 0, 0, body);
  box(0.48, 0.50, 0.08, bluePlateM, 0, 0.02, 0.22, body);
  box(0.36, 0.08, 0.08, yellowM, 0, -0.18, 0.23, body);

  // Head with single glowing blue sensor eye
  const head = new THREE.Group(); head.position.set(0, 0.44, 0.05); body.add(head);
  box(0.36, 0.26, 0.32, metalM, 0, 0, 0, head);
  box(0.24, 0.08, 0.08, eyeM, 0, 0.02, 0.17, head);

  // Arms with defensive emitter discs
  const armL = new THREE.Group(); armL.position.set(-0.35, 0.15, 0); body.add(armL);
  box(0.16, 0.55, 0.18, metalM, 0, -0.25, 0, armL);
  cyl(0.14, 0.14, 0.06, 12, eyeM, -0.06, -0.50, 0, armL);

  const armR = new THREE.Group(); armR.position.set(0.35, 0.15, 0); body.add(armR);
  box(0.16, 0.55, 0.18, metalM, 0, -0.25, 0, armR);
  cyl(0.14, 0.14, 0.06, 12, eyeM, 0.06, -0.50, 0, armR);

  // Legs
  function makeRobotLeg(px) {
    const hip = new THREE.Group(); hip.position.set(px, -0.32, 0); body.add(hip);
    box(0.18, 0.45, 0.20, metalM, 0, -0.22, 0, hip);
    box(0.22, 0.10, 0.28, bluePlateM, 0, -0.46, 0.04, hip);
    return hip;
  }
  const legL = makeRobotLeg(-0.18);
  const legR = makeRobotLeg(0.18);

  const shadow = new THREE.Mesh(circleShadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01; shadow.scale.setScalar(0.9);
  root.add(shadow);

  // Energy bubble (attached to player.root so the protective visual barrier surrounds the player)
  if (!_compBubbleGeo) _compBubbleGeo = new THREE.SphereGeometry(1.4, 16, 12);
  const bubbleMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.28,
    wireframe: true
  });
  const barrierMesh = new THREE.Mesh(_compBubbleGeo, bubbleMat);
  barrierMesh.position.set(0, 1.1, 0);
  barrierMesh.visible = false;
  if (player && player.root) {
    player.root.add(barrierMesh);
  } else {
    root.add(barrierMesh);
  }

  scene.add(root);

  return {
    type: 'robot',
    root, body, head, armL, armR, legL, legR,
    barrierMesh,
    defCd: 0,
    pushTimer: 0,
    trotTime: 0,
    vx: 0, vz: 0,
    stuckTimer: 0,
    steerDir: 1
  };
}

function createMedicModel() {
  const root = new THREE.Group();
  const whiteM = mat(0xe5e7eb, 0.3, 0.5);
  const greenCrossM = mat(0x10b981, 0.1, 0, 0x10b981, 1.6);
  const darkGlassM = mat(0x0f172a, 0.2, 0.9);

  // Spherical floating chassis
  const chassis = new THREE.Group(); chassis.position.y = 1.15; root.add(chassis);
  sph(0.34, 12, 10, whiteM, 0, 0, 0, chassis);
  sph(0.18, 10, 8, darkGlassM, 0, 0.06, 0.25, chassis);

  // Green Cross on top / sides
  box(0.08, 0.26, 0.04, greenCrossM, 0, 0.22, 0, chassis);
  box(0.24, 0.08, 0.04, greenCrossM, 0, 0.22, 0, chassis);

  // Tiny hovering winglets
  box(0.24, 0.04, 0.16, whiteM, -0.38, 0, 0, chassis);
  box(0.24, 0.04, 0.16, whiteM,  0.38, 0, 0, chassis);

  const shadow = new THREE.Mesh(circleShadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01; shadow.scale.setScalar(0.7);
  root.add(shadow);

  // Healing pulse ring on ground
  if (!_compRingGeo) _compRingGeo = new THREE.RingGeometry(0.3, 1.8, 20);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide
  });
  const healRing = new THREE.Mesh(_compRingGeo, ringMat);
  healRing.rotation.x = -Math.PI / 2;
  healRing.position.y = 0.05;
  root.add(healRing);

  scene.add(root);

  return {
    type: 'medic',
    root, chassis, healRing,
    healCd: 0,
    chargesLeft: 2,
    lastWave: run ? run.wave : 1,
    ringT: 0,
    hoverAngle: 0
  };
}

function createCompanion(id) {
  if (id === 'dog') return createDogModel();
  if (id === 'drone') return createDroneModel();
  if (id === 'robot') return createRobotModel();
  if (id === 'medic') return createMedicModel();
  return null;
}

function disposeCompanion() {
  if (!companion) return;
  try {
    if (companion.barrierMesh) {
      if (companion.barrierMesh.parent) companion.barrierMesh.parent.remove(companion.barrierMesh);
      companion.barrierMesh.material?.dispose?.();
    }
    if (companion.healRing) {
      companion.healRing.material?.dispose?.();
    }
    scene.remove(companion.root);
  } catch (e) {}
  companion = null;
  companionPushList = [];
  if (player) {
    player.compBarrier = 0;
    player.compBarrierT = 0;
  }
}

function updateCompanion(dt) {
  const activeId = getActiveCompanionId(meta);
  if (activeId === 'none') {
    if (companion) disposeCompanion();
    return;
  }

  if (!companion || companion.type !== activeId) {
    disposeCompanion();
    companion = createCompanion(activeId);
    if (companion && player) {
      companion.root.position.set(
        player.root.position.x + 1.4,
        0,
        player.root.position.z + 1.4
      );
    }
  }

  if (!companion || !player) return;

  const lvl = getCompanionLevel(activeId, meta);
  const stats = getCompanionStats(activeId, lvl);
  const px = player.root.position.x;
  const pz = player.root.position.z;

  // Process any active zombie crowd-control pushes from the Robot
  if (companionPushList.length > 0) {
    for (let i = companionPushList.length - 1; i >= 0; i--) {
      const p = companionPushList[i];
      p.t -= dt;
      if (p.t <= 0 || !p.z || p.z.dead || p.z.hp <= 0) {
        companionPushList.splice(i, 1);
        continue;
      }
      p.z.root.position.x += p.vx * dt;
      p.z.root.position.z += p.vz * dt;
      p.vx *= (1 - dt * 4.5);
      p.vz *= (1 - dt * 4.5);
    }
  }

  // 1. COMBAT DOG
  if (companion.type === 'dog') {
    const dog = companion;
    dog.atkCd = Math.max(0, dog.atkCd - dt);
    dog.aiTimer = (dog.aiTimer || 0) + dt;

    if (dog.aiTimer >= COMPANION_AI_TICK) {
      dog.aiTimer = 0;
      let best = null;
      let minD = stats.attackRange || 18;
      for (let i = 0; i < zombies.length; i++) {
        const z = zombies[i];
        if (z.hp <= 0 || z.dead) continue;
        const d = dist2(px, pz, z.root.position.x, z.root.position.z);
        if (d < minD && compCanHit(z, dog.root.position.x, dog.root.position.z)) {
          minD = d;
          best = z;
        }
      }
      dog.targetZombie = best;
    }

    let tx = px + 1.3;
    let tz = pz + 1.3;
    const moveSpeed = stats.moveSpeed || 6.6;
    let isAttacking = false;

    if (dog.targetZombie && !dog.targetZombie.dead && dog.targetZombie.hp > 0) {
      const target = dog.targetZombie;
      tx = target.root.position.x;
      tz = target.root.position.z;
      const dToT = dist2(dog.root.position.x, dog.root.position.z, tx, tz);

      if (dToT < 1.5 && compCanHit(target, dog.root.position.x, dog.root.position.z)) {
        isAttacking = true;
        if (dog.atkCd <= 0) {
          dog.atkCd = stats.fireCooldown || 1.05;
          const rawDmg = stats.damage || 28;
          const armorResist = target.armorResist || 0;
          const finalDmg = Math.max(4, Math.round(rawDmg * (1 - armorResist)));

          target.hp -= finalDmg;
          target.hitFlash = 0.16;
          spawnFloatingDamage(tx, tz, finalDmg, false);
          spawnBurst(tx, tz, 0xff3b3b, 8, 0.6, 2.4);
          if (sfx && sfx.hit) sfx.hit();

          if (target.hp <= 0) {
            dog.targetZombie = null;
            const idx = zombies.indexOf(target);
            if (idx !== -1) killZombie(idx);
          }
        }
      }
    } else {
      dog.targetZombie = null;
    }

    // Leash to player if too far away
    const dFromPlayer = dist2(dog.root.position.x, dog.root.position.z, px, pz);
    if (dFromPlayer > 22) {
      dog.root.position.set(px + 1.2, 0, pz + 1.2);
      dog.vx = 0; dog.vz = 0;
    }

    const dx = tx - dog.root.position.x;
    const dz = tz - dog.root.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.8) {
      let desVx = (dx / dist) * moveSpeed;
      let desVz = (dz / dist) * moveSpeed;
      const steered = steerObstacles(dog.root.position, 0.45, desVx, desVz, dog);
      dog.vx = lerp(dog.vx, steered.vx, 1 - Math.exp(-dt * 10));
      dog.vz = lerp(dog.vz, steered.vz, 1 - Math.exp(-dt * 10));
      dog.root.position.x += dog.vx * dt;
      dog.root.position.z += dog.vz * dt;
      dog.root.rotation.y = Math.atan2(desVx, desVz);
    } else {
      dog.vx = lerp(dog.vx, 0, dt * 8);
      dog.vz = lerp(dog.vz, 0, dt * 8);
    }

    const spd = Math.hypot(dog.vx, dog.vz);
    dog.trotTime += spd * dt * 2.8;
    if (spd > 0.4) {
      const trot = Math.sin(dog.trotTime);
      dog.legFL.hip.rotation.x =  trot * 0.6;
      dog.legFR.hip.rotation.x = -trot * 0.6;
      dog.legBL.hip.rotation.x = -trot * 0.6;
      dog.legBR.hip.rotation.x =  trot * 0.6;
      dog.body.position.y = 0.52 + Math.abs(trot) * 0.05;
    } else {
      dog.legFL.hip.rotation.x = lerp(dog.legFL.hip.rotation.x, 0, dt * 8);
      dog.legFR.hip.rotation.x = lerp(dog.legFR.hip.rotation.x, 0, dt * 8);
      dog.legBL.hip.rotation.x = lerp(dog.legBL.hip.rotation.x, 0, dt * 8);
      dog.legBR.hip.rotation.x = lerp(dog.legBR.hip.rotation.x, 0, dt * 8);
      dog.body.position.y = 0.52;
    }
    dog.tailPiv.rotation.y = Math.sin(clock.elapsedTime * 12) * 0.35;
    if (isAttacking) dog.headPiv.rotation.x = -0.4;
    else dog.headPiv.rotation.x = lerp(dog.headPiv.rotation.x, 0, dt * 8);
  }

  // 2. TACTICAL LASER DRONE
  else if (companion.type === 'drone') {
    const drone = companion;
    drone.orbitAngle += dt * 2.2;
    const tx = px + Math.cos(drone.orbitAngle) * 1.85;
    const tz = pz + Math.sin(drone.orbitAngle) * 1.85;
    drone.root.position.set(tx, 2.35 + Math.sin(clock.elapsedTime * 5) * 0.12, tz);

    drone.atkCd = Math.max(0, drone.atkCd - dt);
    drone.aiTimer = (drone.aiTimer || 0) + dt;

    if (drone.aiTimer >= COMPANION_AI_TICK) {
      drone.aiTimer = 0;
      let best = null;
      let minD = stats.attackRange || 20;
      for (const z of zombies) {
        if (z.hp <= 0 || z.dead) continue;
        const d = dist2(tx, tz, z.root.position.x, z.root.position.z);
        if (d < minD && compCanHit(z, tx, tz)) {
          minD = d;
          best = z;
        }
      }
      drone.targetZombie = best;
    }

    if (drone.atkCd <= 0 && drone.targetZombie && !drone.targetZombie.dead && drone.targetZombie.hp > 0) {
      const best = drone.targetZombie;
      if (compCanHit(best, tx, tz)) {
        drone.atkCd = stats.fireCooldown || 0.76;
        const dx = best.root.position.x - tx;
        const dz = best.root.position.z - tz;
        const len = Math.hypot(dx, dz) || 1;
        drone.root.rotation.y = Math.atan2(dx, dz);

        const dir = new THREE.Vector3(dx / len, 0, dz / len);
        if (!_compLaserMat) {
          _compLaserMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.95 });
        }
        const mesh = new THREE.Mesh(bulletGeo, _compLaserMat);
        mesh.position.set(tx, 1.35, tz);
        mesh.lookAt(mesh.position.clone().add(dir));
        scene.add(mesh);
        bullets.push({
          mesh,
          dir,
          speed: 46,
          life: 0,
          range: stats.attackRange || 20,
          damage: stats.damage || 20,
          fromCompanion: true
        });
      }
    }
  }

  // 3. ROBOT COMPANION (DEFENSE & CC)
  else if (companion.type === 'robot') {
    const rob = companion;
    rob.defCd = Math.max(0, rob.defCd - dt);

    // Barrier lifetime decay
    if (player.compBarrierT > 0) {
      player.compBarrierT -= dt;
      if (rob.barrierMesh) {
        rob.barrierMesh.visible = true;
        rob.barrierMesh.rotation.y += dt * 1.5;
      }
      if (player.compBarrierT <= 0) {
        player.compBarrier = 0;
        player.compBarrierT = 0;
        if (rob.barrierMesh) rob.barrierMesh.visible = false;
        showToast('🛡️ Barrier Expired');
      }
    } else if (rob.barrierMesh) {
      rob.barrierMesh.visible = false;
    }

    // Follow player (slightly to the left flank)
    const slotX = px - 1.5;
    const slotZ = pz + 1.2;
    const dFromPlayer = dist2(rob.root.position.x, rob.root.position.z, px, pz);
    if (dFromPlayer > 22) {
      rob.root.position.set(slotX, 0, slotZ);
      rob.vx = 0; rob.vz = 0;
    }

    const dx = slotX - rob.root.position.x;
    const dz = slotZ - rob.root.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.6) {
      let desVx = (dx / dist) * 5.6;
      let desVz = (dz / dist) * 5.6;
      const steered = steerObstacles(rob.root.position, 0.55, desVx, desVz, rob);
      rob.vx = lerp(rob.vx, steered.vx, 1 - Math.exp(-dt * 8));
      rob.vz = lerp(rob.vz, steered.vz, 1 - Math.exp(-dt * 8));
      rob.root.position.x += rob.vx * dt;
      rob.root.position.z += rob.vz * dt;
      rob.root.rotation.y = Math.atan2(desVx, desVz);
    } else {
      rob.vx = lerp(rob.vx, 0, dt * 6);
      rob.vz = lerp(rob.vz, 0, dt * 6);
      rob.root.rotation.y = lerp(rob.root.rotation.y, player.angle, dt * 5);
    }

    const spd = Math.hypot(rob.vx, rob.vz);
    rob.trotTime += spd * dt * 2.4;
    if (spd > 0.3) {
      const stride = Math.sin(rob.trotTime);
      rob.legL.rotation.x = stride * 0.45;
      rob.legR.rotation.x = -stride * 0.45;
      rob.armL.rotation.x = -stride * 0.35;
      rob.armR.rotation.x = stride * 0.35;
    } else {
      rob.legL.rotation.x = lerp(rob.legL.rotation.x, 0, dt * 6);
      rob.legR.rotation.x = lerp(rob.legR.rotation.x, 0, dt * 6);
      rob.armL.rotation.x = lerp(rob.armL.rotation.x, 0, dt * 6);
      rob.armR.rotation.x = lerp(rob.armR.rotation.x, 0, dt * 6);
    }

    // Trigger condition: cooldown ready AND (>=3 nearby zombies OR HP <= 50% with >=1 nearby)
    if (rob.defCd <= 0) {
      let nearbyCount = 0;
      for (const z of zombies) {
        if (z.hp <= 0 || z.dead) continue;
        if (dist2(px, pz, z.root.position.x, z.root.position.z) <= (stats.pushRadius || 5.0)) {
          nearbyCount++;
        }
      }

      const hpRatio = player.hp / (player.maxHp || 100);
      const shouldTrigger = (nearbyCount >= 3) || (hpRatio <= 0.50 && nearbyCount >= 1);

      if (shouldTrigger) {
        rob.defCd = stats.defenseCooldown || 22;
        player.compBarrier = stats.barrierHp || 45;
        player.compBarrierMax = stats.barrierHp || 45;
        player.compBarrierT = stats.barrierDuration || 4.0;
        if (rob.barrierMesh) rob.barrierMesh.visible = true;

        // Push nearby valid on-screen zombies away (pure crowd control, zero damage)
        const pushR = stats.pushRadius || 5.0;
        const pushForce = stats.pushForce || 7.0;
        for (const z of zombies) {
          if (z.hp <= 0 || z.dead) continue;
          const d = dist2(px, pz, z.root.position.x, z.root.position.z);
          if (d <= pushR && compCanHit(z, px, pz)) {
            const zx = z.root.position.x - px;
            const zz = z.root.position.z - pz;
            const zlen = Math.hypot(zx, zz) || 1;
            const bossScale = (z.type === 'boss' || z.isMiniBoss) ? 0.35 : 1.0;
            companionPushList.push({
              z,
              vx: (zx / zlen) * pushForce * bossScale,
              vz: (zz / zlen) * pushForce * bossScale,
              t: 0.45
            });
          }
        }
        spawnBurst(px, pz, 0x38bdf8, 16, 1.2, 4.0);
        showToast(`🛡️ Robot Barrier Activated! (+${player.compBarrier} HP)`);
        if (sfx && sfx.pickup) sfx.pickup();
        updateHUD();
      }
    }
  }

  // 4. MEDICAL PET (HEALER)
  else if (companion.type === 'medic') {
    const med = companion;
    med.healCd = Math.max(0, med.healCd - dt);

    // Refresh charges when wave increments
    if (run && run.wave !== med.lastWave) {
      med.lastWave = run.wave;
      med.chargesLeft = stats.chargesPerWave || 2;
    }

    // Hover bob animation behind player
    med.hoverAngle += dt * 2.0;
    const slotX = px + Math.cos(med.hoverAngle) * 1.6;
    const slotZ = pz + Math.sin(med.hoverAngle) * 1.6;
    const dFromPlayer = dist2(med.root.position.x, med.root.position.z, px, pz);
    if (dFromPlayer > 22) {
      med.root.position.set(slotX, 0, slotZ);
    } else {
      med.root.position.x = lerp(med.root.position.x, slotX, dt * 7);
      med.root.position.z = lerp(med.root.position.z, slotZ, dt * 7);
    }
    med.chassis.position.y = 1.15 + Math.sin(clock.elapsedTime * 4.5) * 0.12;

    // Expand & fade healing visual ring
    if (med.ringT > 0) {
      med.ringT -= dt * 1.5;
      med.healRing.material.opacity = Math.max(0, med.ringT);
      med.healRing.scale.setScalar(1 + (1 - med.ringT) * 0.8);
    }

    // Trigger condition: HP <= 50%, HP > 0 (never revive), charges > 0, cooldown ready
    const hpRatio = player.hp / (player.maxHp || 100);
    if (hpRatio <= 0.50 && player.hp > 0 && med.chargesLeft > 0 && med.healCd <= 0) {
      med.healCd = stats.healCooldown || 14;
      med.chargesLeft--;
      const healAmt = stats.healAmount || 22;
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      med.ringT = 1.0;
      spawnBurst(px, pz, 0x10b981, 14, 0.8, 3.2);
      showToast(`💖 Medical Pet Restored +${healAmt} HP! (${med.chargesLeft} charges left)`);
      if (sfx && sfx.pickup) sfx.pickup();
      updateHUD();
    }
  }
}

function updateGame(dt) {
  if (hitStopTimer > 0) {
    hitStopTimer -= dt;
    return;
  }
  if (run) {
    run.overchargeTimer = Math.max(0, (run.overchargeTimer || 0) - dt);
    run.cryoTimer = Math.max(0, (run.cryoTimer || 0) - dt);
  }
  refreshChunks();
  updateAimAssist(dt);
  updateCompanion(dt);
  updatePlayer(dt);
  updateBullets(dt);
  updateThrownGrenades(dt);
  updateEnemyBullets(dt);
  updateToxicPools(dt);
  updateZombies(dt);
  updateActiveZombieGroans(dt);
  updateDyingZombies(dt);
  updatePickups(dt);
  updateParticles(dt);
  updateShockwaves(dt);
  updateSpawning(dt);
  updateFlashlight();
  updateHUD();

  run.comboT -= dt;
  if (run.comboT <= 0) run.combo = 0;

  if (player.hp <= 0) {
    player.hp = 0;
    if (DEBUG_BALANCE && waveStats.active) waveStats.deaths++;
    gameOver();
  }
}

function updateMenuScene(dt) {
  refreshChunks();
  player.moveBob += dt * 1.1;
  if(player.torso) player.torso.position.y = 1.1 + Math.sin(player.moveBob * 2.5) * 0.04;
  player.root.rotation.y += dt * 0.35;
  updateFlashlight();
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);

  if (screen === 'game' && !paused) {
    if (DEBUG_BALANCE && waveStats.active) {
      const updateStart = performance.now();
      updateGame(dt);
      waveStats.updateTimeTotal += performance.now() - updateStart;
      waveStats.updateTimeSamples++;
      waveStats.frames++;
      waveStats.maxActiveZombies = Math.max(waveStats.maxActiveZombies, zombies.length);
    } else {
      updateGame(dt);
    }
  } else if (screen === 'menu') {
    updateMenuScene(dt);
  } else {
    updateParticles(dt);
    updateFlashlight();
  }

  updateCamera(dt);

  // FX
  screenFlash = Math.max(0, screenFlash - dt * 3.2);
  hurtVignette = screen === 'game' ? Math.max(0, hurtVignette - dt * 1.5) : 0;
  if (hurtVignetteEl) hurtVignetteEl.style.opacity = hurtVignette > 0.01 ? hurtVignette.toFixed(3) : '0';
  const fogPulse = Math.min(1, (run ? run.wave : 1) / 10);
  scene.fog.color.setRGB(0.008 + fogPulse * 0.03, 0.016 - fogPulse * 0.005, 0.026 - fogPulse * 0.008);
  scene.background.copy(scene.fog.color);
  stars.rotation.y += dt * 0.01;

  renderer.render(scene, camera);

  // screen flash overlay via renderer dom style filter
  renderer.domElement.style.filter = screenFlash > 0.01 ? `brightness(${1 + screenFlash * 0.18}) saturate(${1 + screenFlash * 0.2})` : 'none';
}

/* Initial setup */
initScene();
initAudio();
setTimeout(() => initAudio(), 180);
window.addEventListener('focus', initAudio);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) initAudio();
});
renderMeta();
renderMissions();
updateHUD();
animate();

  }
}





