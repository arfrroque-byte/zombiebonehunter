const STORAGE_KEY = 'neon_deadlands_3d_meta';
// Maximum number of grenades the player can carry / have equipped in the tactical pouch
export const MAX_EQUIPPED_GRENADES = 3;

export let meta: any = null;

export interface MissionDef {
  id: string;
  type: 'daily' | 'weekly';
  title: string;
  desc: string;
  target: number;
  reward: number;
  key: string;
}

export interface ShopItemDef {
  id: string;
  category: 'weapon' | 'gear' | 'companion' | 'consumable' | 'skin';
  title: string;
  desc: string;
  cost: number;
  icon: string;
  upgradeCostBase?: number;
  maxLevel?: number;
}

export const shopItemDefs: ShopItemDef[] = [
  {
    id: 'wep_shotgun',
    category: 'weapon',
    title: 'HEAVY SHOTGUN (PRIMARY)',
    desc: 'Devastating close-range pump shotgun firing 6–8 pellets with high impact. Upgradeable to Lv.5.',
    cost: 200,
    icon: '💥',
    upgradeCostBase: 140,
    maxLevel: 5
  },
  {
    id: 'wep_sniper',
    category: 'weapon',
    title: 'SNIPER RIFLE (PRIMARY)',
    desc: 'High-precision long-range rifle with armor penetration, critical bonus & piercing shots. Upgradeable to Lv.5.',
    cost: 320,
    icon: '🎯',
    upgradeCostBase: 160,
    maxLevel: 5
  },
  {
    id: 'wep_minigun',
    category: 'weapon',
    title: 'MINIGUN (PRIMARY)',
    desc: '6-barrel rotary cannon with rapid spin-up acceleration and relentless suppressive fire. Upgradeable to Lv.5.',
    cost: 450,
    icon: '🔥',
    upgradeCostBase: 180,
    maxLevel: 5
  },
  {
    id: 'wep_rocket',
    category: 'weapon',
    title: 'ROCKET LAUNCHER (PRIMARY)',
    desc: 'Heavy warhead launcher dealing massive explosive area-of-effect damage on impact. Upgradeable to Lv.5.',
    cost: 550,
    icon: '🚀',
    upgradeCostBase: 220,
    maxLevel: 5
  },
  {
    id: 'wep_carbine',
    category: 'weapon',
    title: 'ASSAULT RIFLE (PRIMARY)',
    desc: 'Versatile automatic tactical rifle with balanced damage, accuracy & fire rate. Upgradeable to Lv.5.',
    cost: 0,
    icon: '🔫',
    upgradeCostBase: 100,
    maxLevel: 5
  },
  {
    id: 'gear_kevlar',
    category: 'gear',
    title: 'KEVLAR VEST (ARMOR)',
    desc: 'Tactical Kevlar Vest providing a full Shield Bar & extra Max HP. Upgradeable to Lv.5.',
    cost: 150,
    icon: '🦺',
    upgradeCostBase: 120,
    maxLevel: 5
  },
  {
    id: 'companion_dog',
    category: 'companion',
    title: 'COMBAT DOG',
    desc: 'Fierce cyber-hound tracking nearby zombies, biting with high damage. Upgradeable to Lv.5.',
    cost: 250,
    icon: '🐕',
    upgradeCostBase: 120,
    maxLevel: 5
  },
  {
    id: 'companion_drone',
    category: 'companion',
    title: 'TACTICAL LASER DRONE',
    desc: 'Autonomous hovering drone firing precision cyan lasers at zombies. Upgradeable to Lv.5.',
    cost: 400,
    icon: '🤖',
    upgradeCostBase: 150,
    maxLevel: 5
  },
  {
    id: 'companion_robot',
    category: 'companion',
    title: 'SHIELD ROBOT',
    desc: 'Mechanical protector deploying an energy barrier & defensive push against crowding zombies. Upgradeable to Lv.5.',
    cost: 500,
    icon: '🦾',
    upgradeCostBase: 160,
    maxLevel: 5
  },
  {
    id: 'companion_medic',
    category: 'companion',
    title: 'MEDICAL PET (HEALER)',
    desc: 'Nanotech support pet providing emergency HP restoration when health drops below 50%. Upgradeable to Lv.5.',
    cost: 450,
    icon: '🩺',
    upgradeCostBase: 140,
    maxLevel: 5
  },
  {
    id: 'consumable_grenades',
    category: 'consumable',
    title: 'GRENADES (PACK OF 3)',
    desc: '3 Explosive fragmentation grenades with 3D parabolic throw & blast.',
    cost: 100,
    icon: '💣'
  },
  {
    id: 'skin_cyber',
    category: 'skin',
    title: 'CYBERPUNK NEON SUIT',
    desc: 'Glowing magenta & cyan synthwave tactical armor skin.',
    cost: 220,
    icon: '🔮'
  },
  {
    id: 'skin_hazmat',
    category: 'skin',
    title: 'BIO-HAZMAT SUIT',
    desc: 'Radioactive yellow bio-suit built for toxic zombie zones.',
    cost: 260,
    icon: '☣️'
  }
];

export const dailyStreakRewards = [50, 75, 100, 150, 200, 300, 500];

export const missionDefs: MissionDef[] = [
  // Daily Missions
  { id: 'sec_kill_50', type: 'daily', title: 'Zombie Purge', desc: 'Kill 50 zombies across any run.', target: 50, reward: 120, key: 'totalKills' },
  { id: 'sec_runner_20', type: 'daily', title: 'Speed Demon', desc: 'Kill 20 Runner zombies.', target: 20, reward: 150, key: 'runnerKills' },
  { id: 'sec_bones_150', type: 'daily', title: 'Bone Collector', desc: 'Collect 150 total bones.', target: 150, reward: 180, key: 'totalBonesCollected' },
  { id: 'sec_spitter_15', type: 'daily', title: 'Acid Cleanup', desc: 'Kill 15 Spitter zombies.', target: 15, reward: 160, key: 'spitterKills' },

  // Weekly Missions
  { id: 'week_wave_8', type: 'weekly', title: 'Legendary Survivor', desc: 'Reach Wave 8 in any run.', target: 8, reward: 400, key: 'bestWave' },
  { id: 'week_kill_300', type: 'weekly', title: 'Mass Annihilation', desc: 'Kill 300 total zombies.', target: 300, reward: 500, key: 'totalKills' },
  { id: 'week_brute_15', type: 'weekly', title: 'Titan Breaker', desc: 'Defeat 15 Brute or Boss zombies.', target: 15, reward: 450, key: 'bruteKills' },
  { id: 'week_score_2000', type: 'weekly', title: 'Neon Master', desc: 'Achieve a score record of 2,000 points.', target: 2000, reward: 600, key: 'bestScore' }
];

export function loadMeta() {
  let data = null;
  try { data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (e) {}
  meta = Object.assign({
    playerName: 'NEON ACE',
    playerLevel: 3,
    playerRank: 'ROOKIE HUNTER',
    bankBones: 289,
    totalBonesCollected: 0,
    bestWave: 1,
    bestScore: 207516,
    totalKills: 40,
    runnerKills: 0,
    bruteKills: 0,
    spitterKills: 0,
    lastDailyClaim: 0,
    dailyStreak: 0,
    masterMuted: false,
    musicMuted: false,
    masterVolume: 80,
    musicVolume: 60,
    aimAssistEnabled: true,
    hasAssaultRifle: true,
    hasShotgun: false,
    hasSniper: false,
    hasMinigun: false,
    hasRocket: false,
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
  meta.hasAssaultRifle = true;
  const validWeapons = ['carbine', 'shotgun', 'sniper', 'minigun', 'rocket'];
  if (!validWeapons.includes(meta.equippedWeapon)) {
    meta.equippedWeapon = 'carbine';
  }
  if (meta.equippedWeapon === 'shotgun' && !meta.hasShotgun) meta.equippedWeapon = 'carbine';
  if (meta.equippedWeapon === 'sniper' && !meta.hasSniper) meta.equippedWeapon = 'carbine';
  if (meta.equippedWeapon === 'minigun' && !meta.hasMinigun) meta.equippedWeapon = 'carbine';
  if (meta.equippedWeapon === 'rocket' && !meta.hasRocket) meta.equippedWeapon = 'carbine';

  const validCompanions = ['none', 'dog', 'drone', 'robot', 'medic'];
  if (!validCompanions.includes(meta.equippedCompanion)) {
    meta.equippedCompanion = 'none';
  }
  if (meta.equippedCompanion === 'dog' && !meta.hasGuardDog) meta.equippedCompanion = 'none';
  if (meta.equippedCompanion === 'drone' && !meta.hasDrone) meta.equippedCompanion = 'none';
  if (meta.equippedCompanion === 'robot' && !meta.hasRobot) meta.equippedCompanion = 'none';
  if (meta.equippedCompanion === 'medic' && !meta.hasMedic) meta.equippedCompanion = 'none';

  meta.grenadesCount = Math.max(0, Math.min(MAX_EQUIPPED_GRENADES, Math.floor(Number(meta.grenadesCount) || 0)));

  return meta;
}

export function saveMeta() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(meta)); } catch (e) {}
}

export function metaMax(key: string, v: number) {
  loadMeta();
  if (v > (meta[key] || 0)) { meta[key] = v; saveMeta(); }
}

export function metaAdd(key: string, v: number) {
  loadMeta();
  meta[key] = (meta[key] || 0) + v;
  saveMeta();
}

export function claimMissionReward(id: string): boolean {
  loadMeta();
  const m = missionDefs.find(item => item.id === id);
  if (!m) return false;
  const currentVal = meta[m.key] || 0;
  if (currentVal >= m.target && !meta.claimed[id]) {
    meta.claimed[id] = true;
    meta.bankBones += m.reward;
    saveMeta();
    return true;
  }
  return false;
}

export function canClaimDailyBonus(): boolean {
  loadMeta();
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  return now - (meta.lastDailyClaim || 0) >= ONE_DAY;
}

export function getNextDailyReward(): { day: number; reward: number } {
  loadMeta();
  const now = Date.now();
  const TWO_DAYS = 48 * 60 * 60 * 1000;
  let streak = meta.dailyStreak || 0;
  if (meta.lastDailyClaim && now - meta.lastDailyClaim > TWO_DAYS) {
    streak = 0;
  }
  const dayIndex = streak % 7;
  return { day: dayIndex + 1, reward: dailyStreakRewards[dayIndex] };
}

export function claimDailyBonus(): { claimed: boolean; day: number; reward: number } {
  loadMeta();
  if (canClaimDailyBonus()) {
    const info = getNextDailyReward();
    meta.lastDailyClaim = Date.now();
    meta.dailyStreak = info.day;
    meta.bankBones += info.reward;
    if (info.day === 7) {
      meta.grenadesCount = Math.min(MAX_EQUIPPED_GRENADES, (meta.grenadesCount || 0) + 3);
    }
    saveMeta();
    return { claimed: true, day: info.day, reward: info.reward };
  }
  const info = getNextDailyReward();
  return { claimed: false, day: info.day, reward: info.reward };
}

export function updatePlayerName(newName: string) {
  loadMeta();
  if (newName && newName.trim().length > 0) {
    meta.playerName = newName.trim().toUpperCase();
    saveMeta();
  }
}

export function toggleMasterMute(): boolean {
  loadMeta();
  meta.masterMuted = !meta.masterMuted;
  saveMeta();
  return meta.masterMuted;
}

export function toggleMusicMute(): boolean {
  loadMeta();
  meta.musicMuted = !meta.musicMuted;
  saveMeta();
  return meta.musicMuted;
}

export function toggleAimAssist(): boolean {
  loadMeta();
  meta.aimAssistEnabled = !meta.aimAssistEnabled;
  saveMeta();
  return meta.aimAssistEnabled;
}

export function setMasterVolume(v: number) {
  loadMeta();
  meta.masterVolume = Math.max(0, Math.min(100, v));
  saveMeta();
}

export function setMusicVolume(v: number) {
  loadMeta();
  meta.musicVolume = Math.max(0, Math.min(100, v));
  saveMeta();
}

export function isItemOwned(id: string, state: any = meta): boolean {
  const m = state || loadMeta();
  if (id === 'wep_carbine') return true;
  if (id === 'wep_shotgun') return !!m.hasShotgun;
  if (id === 'wep_sniper') return !!m.hasSniper;
  if (id === 'wep_minigun') return !!m.hasMinigun;
  if (id === 'wep_rocket') return !!m.hasRocket;
  if (id === 'gear_kevlar') return !!m.hasKevlar;
  if (id === 'companion_dog') return !!m.hasGuardDog;
  if (id === 'companion_drone') return !!m.hasDrone;
  if (id === 'companion_robot') return !!m.hasRobot;
  if (id === 'companion_medic') return !!m.hasMedic;
  if (id === 'consumable_grenades') return (m.grenadesCount || 0) > 0;
  if (id === 'skin_cyber') return !!m.hasSkinCyber;
  if (id === 'skin_hazmat') return !!m.hasSkinHazmat;
  return false;
}

export function isItemEquipped(id: string, state: any = meta): boolean {
  const m = state || loadMeta();
  if (id === 'wep_carbine') return (m.equippedWeapon || 'carbine') === 'carbine';
  if (id === 'wep_shotgun') return !!m.hasShotgun && m.equippedWeapon === 'shotgun';
  if (id === 'wep_sniper') return !!m.hasSniper && m.equippedWeapon === 'sniper';
  if (id === 'wep_minigun') return !!m.hasMinigun && m.equippedWeapon === 'minigun';
  if (id === 'wep_rocket') return !!m.hasRocket && m.equippedWeapon === 'rocket';
  if (id === 'gear_kevlar') return !!m.hasKevlar && m.equippedGear === 'kevlar';
  if (id === 'companion_dog') return !!m.hasGuardDog && m.equippedCompanion === 'dog';
  if (id === 'companion_drone') return !!m.hasDrone && m.equippedCompanion === 'drone';
  if (id === 'companion_robot') return !!m.hasRobot && m.equippedCompanion === 'robot';
  if (id === 'companion_medic') return !!m.hasMedic && m.equippedCompanion === 'medic';
  if (id === 'consumable_grenades') return (m.grenadesCount || 0) > 0 && m.equippedGrenades !== false;
  if (id === 'skin_cyber') return !!m.hasSkinCyber && m.equippedSkin === 'cyber';
  if (id === 'skin_hazmat') return !!m.hasSkinHazmat && m.equippedSkin === 'hazmat';
  return false;
}

export function getItemLevel(id: string, state: any = meta): number {
  const m = state || loadMeta();
  if (id === 'wep_carbine') return m.carbineLevel || 1;
  if (id === 'wep_shotgun') return m.shotgunLevel || 1;
  if (id === 'wep_sniper') return m.sniperLevel || 1;
  if (id === 'wep_minigun') return m.minigunLevel || 1;
  if (id === 'wep_rocket') return m.rocketLevel || 1;
  if (id === 'gear_kevlar') return m.kevlarLevel || 1;
  if (id === 'companion_dog') return m.dogLevel || 1;
  if (id === 'companion_drone') return m.droneLevel || 1;
  if (id === 'companion_robot') return m.robotLevel || 1;
  if (id === 'companion_medic') return m.medicLevel || 1;
  return 1;
}

export function getUpgradeCost(id: string, state: any = meta): number {
  const item = shopItemDefs.find(i => i.id === id);
  if (!item || !item.upgradeCostBase) return 0;
  const lvl = getItemLevel(id, state);
  return item.upgradeCostBase * lvl;
}

export function upgradeItem(id: string): { success: boolean; msg: string } {
  loadMeta();
  const item = shopItemDefs.find(i => i.id === id);
  if (!item || !item.maxLevel) return { success: false, msg: 'Item cannot be upgraded.' };
  if (!isItemOwned(id, meta)) return { success: false, msg: 'Buy this item first!' };

  const curLvl = getItemLevel(id, meta);
  if (curLvl >= item.maxLevel) return { success: false, msg: `${item.title} is already MAX LEVEL!` };

  const cost = getUpgradeCost(id, meta);
  if (meta.bankBones < cost) return { success: false, msg: `Need ${cost} Shards to upgrade!` };

  meta.bankBones -= cost;
  if (id === 'wep_carbine') meta.carbineLevel = curLvl + 1;
  if (id === 'wep_shotgun') meta.shotgunLevel = curLvl + 1;
  if (id === 'wep_sniper') meta.sniperLevel = curLvl + 1;
  if (id === 'wep_minigun') meta.minigunLevel = curLvl + 1;
  if (id === 'wep_rocket') meta.rocketLevel = curLvl + 1;
  if (id === 'gear_kevlar') meta.kevlarLevel = curLvl + 1;
  if (id === 'companion_dog') meta.dogLevel = curLvl + 1;
  if (id === 'companion_drone') meta.droneLevel = curLvl + 1;
  if (id === 'companion_robot') meta.robotLevel = curLvl + 1;
  if (id === 'companion_medic') meta.medicLevel = curLvl + 1;
  saveMeta();
  return { success: true, msg: `⬆️ ${item.title} upgraded to LEVEL ${curLvl + 1}!` };
}

export function equipItem(id: string): { success: boolean; msg: string } {
  loadMeta();
  if (id === 'wep_carbine') {
    meta.equippedWeapon = 'carbine';
    saveMeta();
    if ((window as any).ZombieEngine?.refreshPlayerSkin) (window as any).ZombieEngine.refreshPlayerSkin();
    return { success: true, msg: '🔫 Assault Rifle Equipped as Primary!' };
  } else if (id === 'wep_shotgun') {
    if (!meta.hasShotgun) return { success: false, msg: 'Heavy Shotgun not owned!' };
    meta.equippedWeapon = meta.equippedWeapon === 'shotgun' ? 'carbine' : 'shotgun';
    saveMeta();
    if ((window as any).ZombieEngine?.refreshPlayerSkin) (window as any).ZombieEngine.refreshPlayerSkin();
    return {
      success: true,
      msg: meta.equippedWeapon === 'shotgun' ? '💥 Heavy Shotgun Equipped as Primary!' : '🔫 Assault Rifle Active as Primary!'
    };
  } else if (id === 'wep_sniper') {
    if (!meta.hasSniper) return { success: false, msg: 'Sniper Rifle not owned!' };
    meta.equippedWeapon = meta.equippedWeapon === 'sniper' ? 'carbine' : 'sniper';
    saveMeta();
    if ((window as any).ZombieEngine?.refreshPlayerSkin) (window as any).ZombieEngine.refreshPlayerSkin();
    return {
      success: true,
      msg: meta.equippedWeapon === 'sniper' ? '🎯 Sniper Rifle Equipped as Primary!' : '🔫 Assault Rifle Active as Primary!'
    };
  } else if (id === 'wep_minigun') {
    if (!meta.hasMinigun) return { success: false, msg: 'Minigun not owned!' };
    meta.equippedWeapon = meta.equippedWeapon === 'minigun' ? 'carbine' : 'minigun';
    saveMeta();
    if ((window as any).ZombieEngine?.refreshPlayerSkin) (window as any).ZombieEngine.refreshPlayerSkin();
    return {
      success: true,
      msg: meta.equippedWeapon === 'minigun' ? '🔥 Minigun Equipped as Primary!' : '🔫 Assault Rifle Active as Primary!'
    };
  } else if (id === 'wep_rocket') {
    if (!meta.hasRocket) return { success: false, msg: 'Rocket Launcher not owned!' };
    meta.equippedWeapon = meta.equippedWeapon === 'rocket' ? 'carbine' : 'rocket';
    saveMeta();
    if ((window as any).ZombieEngine?.refreshPlayerSkin) (window as any).ZombieEngine.refreshPlayerSkin();
    return {
      success: true,
      msg: meta.equippedWeapon === 'rocket' ? '🚀 Rocket Launcher Equipped as Primary!' : '🔫 Assault Rifle Active as Primary!'
    };
  } else if (id === 'gear_kevlar') {
    if (!meta.hasKevlar) return { success: false, msg: 'Kevlar Vest not owned!' };
    meta.equippedGear = meta.equippedGear === 'kevlar' ? 'none' : 'kevlar';
    saveMeta();
    return {
      success: true,
      msg: meta.equippedGear === 'kevlar' ? '🦺 Kevlar Vest Equipped!' : 'Kevlar Vest Unequipped!'
    };
  } else if (id === 'companion_dog') {
    if (!meta.hasGuardDog) return { success: false, msg: 'Combat Dog not owned!' };
    meta.equippedCompanion = meta.equippedCompanion === 'dog' ? 'none' : 'dog';
    saveMeta();
    return {
      success: true,
      msg: meta.equippedCompanion === 'dog' ? '🐕 Combat Dog Equipped!' : 'Combat Dog Unequipped!'
    };
  } else if (id === 'companion_drone') {
    if (!meta.hasDrone) return { success: false, msg: 'Tactical Laser Drone not owned!' };
    meta.equippedCompanion = meta.equippedCompanion === 'drone' ? 'none' : 'drone';
    saveMeta();
    return {
      success: true,
      msg: meta.equippedCompanion === 'drone' ? '🤖 Tactical Laser Drone Equipped!' : 'Tactical Laser Drone Unequipped!'
    };
  } else if (id === 'companion_robot') {
    if (!meta.hasRobot) return { success: false, msg: 'Shield Robot not owned!' };
    meta.equippedCompanion = meta.equippedCompanion === 'robot' ? 'none' : 'robot';
    saveMeta();
    return {
      success: true,
      msg: meta.equippedCompanion === 'robot' ? '🦾 Shield Robot Equipped!' : 'Shield Robot Unequipped!'
    };
  } else if (id === 'companion_medic') {
    if (!meta.hasMedic) return { success: false, msg: 'Medical Pet not owned!' };
    meta.equippedCompanion = meta.equippedCompanion === 'medic' ? 'none' : 'medic';
    saveMeta();
    return {
      success: true,
      msg: meta.equippedCompanion === 'medic' ? '🩺 Medical Pet Equipped!' : 'Medical Pet Unequipped!'
    };
  } else if (id === 'consumable_grenades') {
    if ((meta.grenadesCount || 0) <= 0) return { success: false, msg: 'No Grenades owned!' };
    meta.equippedGrenades = meta.equippedGrenades === false ? true : false;
    saveMeta();
    return {
      success: true,
      msg: meta.equippedGrenades ? '💣 Grenades Equipped!' : 'Grenades Unequipped!'
    };
  } else if (id === 'skin_cyber') {
    if (!meta.hasSkinCyber) return { success: false, msg: 'Cyberpunk Suit not owned!' };
    meta.equippedSkin = meta.equippedSkin === 'cyber' ? 'default' : 'cyber';
    saveMeta();
    if ((window as any).ZombieEngine?.refreshPlayerSkin) (window as any).ZombieEngine.refreshPlayerSkin();
    return {
      success: true,
      msg: meta.equippedSkin === 'cyber' ? '🔮 Cyberpunk Neon Suit Equipped!' : 'Default Tactical Suit Active'
    };
  } else if (id === 'skin_hazmat') {
    if (!meta.hasSkinHazmat) return { success: false, msg: 'Bio-Hazmat Suit not owned!' };
    meta.equippedSkin = meta.equippedSkin === 'hazmat' ? 'default' : 'hazmat';
    saveMeta();
    if ((window as any).ZombieEngine?.refreshPlayerSkin) (window as any).ZombieEngine.refreshPlayerSkin();
    return {
      success: true,
      msg: meta.equippedSkin === 'hazmat' ? '☣️ Bio-Hazmat Suit Equipped!' : 'Default Tactical Suit Active'
    };
  }
  return { success: false, msg: 'Item cannot be equipped.' };
}

export function buyShopItem(id: string): { success: boolean; msg: string } {
  loadMeta();
  const item = shopItemDefs.find(i => i.id === id);
  if (!item) return { success: false, msg: 'Item not found' };

  if (meta.bankBones < item.cost) {
    return { success: false, msg: 'Not enough Shards/Bones!' };
  }

  if (id === 'wep_carbine') {
    meta.hasAssaultRifle = true;
    meta.equippedWeapon = 'carbine';
  } else if (id === 'wep_shotgun') {
    if (meta.hasShotgun) return { success: false, msg: 'Heavy Shotgun already unlocked!' };
    meta.hasShotgun = true;
    meta.equippedWeapon = 'shotgun';
  } else if (id === 'wep_sniper') {
    if (meta.hasSniper) return { success: false, msg: 'Sniper Rifle already unlocked!' };
    meta.hasSniper = true;
    meta.equippedWeapon = 'sniper';
  } else if (id === 'wep_minigun') {
    if (meta.hasMinigun) return { success: false, msg: 'Minigun already unlocked!' };
    meta.hasMinigun = true;
    meta.equippedWeapon = 'minigun';
  } else if (id === 'wep_rocket') {
    if (meta.hasRocket) return { success: false, msg: 'Rocket Launcher already unlocked!' };
    meta.hasRocket = true;
    meta.equippedWeapon = 'rocket';
  } else if (id === 'gear_kevlar') {
    if (meta.hasKevlar) return { success: false, msg: 'Kevlar Vest already owned!' };
    meta.hasKevlar = true;
    meta.equippedGear = 'kevlar';
  } else if (id === 'companion_dog') {
    if (meta.hasGuardDog) return { success: false, msg: 'Combat Dog already owned!' };
    meta.hasGuardDog = true;
    meta.equippedCompanion = 'dog';
  } else if (id === 'companion_drone') {
    if (meta.hasDrone) return { success: false, msg: 'Tactical Laser Drone already owned!' };
    meta.hasDrone = true;
    meta.equippedCompanion = 'drone';
  } else if (id === 'companion_robot') {
    if (meta.hasRobot) return { success: false, msg: 'Shield Robot already owned!' };
    meta.hasRobot = true;
    meta.equippedCompanion = 'robot';
  } else if (id === 'companion_medic') {
    if (meta.hasMedic) return { success: false, msg: 'Medical Pet already owned!' };
    meta.hasMedic = true;
    meta.equippedCompanion = 'medic';
  } else if (id === 'consumable_grenades') {
    if ((meta.grenadesCount || 0) >= MAX_EQUIPPED_GRENADES) {
      return { success: false, msg: `Grenade pouch full (${MAX_EQUIPPED_GRENADES}/${MAX_EQUIPPED_GRENADES})!` };
    }
    meta.grenadesCount = Math.min(MAX_EQUIPPED_GRENADES, (meta.grenadesCount || 0) + 3);
    meta.equippedGrenades = true;
  } else if (id === 'skin_cyber') {
    if (meta.hasSkinCyber) return { success: false, msg: 'Cyberpunk Suit already owned!' };
    meta.hasSkinCyber = true;
    meta.equippedSkin = 'cyber';
  } else if (id === 'skin_hazmat') {
    if (meta.hasSkinHazmat) return { success: false, msg: 'Bio-Hazmat Suit already owned!' };
    meta.hasSkinHazmat = true;
    meta.equippedSkin = 'hazmat';
  }

  meta.bankBones -= item.cost;
  saveMeta();
  if ((window as any).ZombieEngine?.refreshPlayerSkin) (window as any).ZombieEngine.refreshPlayerSkin();
  return { success: true, msg: `Purchased & Equipped ${item.title}! Available in Inventory.` };
}

if (typeof window !== 'undefined') {
  (window as any).ZombieMetaSystem = {
    loadMeta,
    saveMeta,
    equipItem,
    buyShopItem,
    upgradeItem,
    isItemOwned,
    isItemEquipped
  };
}
