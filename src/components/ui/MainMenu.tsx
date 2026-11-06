import React, { useState, useEffect, useRef } from 'react';
import {
  loadMeta,
  missionDefs,
  shopItemDefs,
  dailyStreakRewards,
  claimMissionReward,
  canClaimDailyBonus,
  getNextDailyReward,
  claimDailyBonus,
  updatePlayerName,
  toggleMasterMute,
  toggleMusicMute,
  toggleAimAssist,
  setMasterVolume,
  setMusicVolume,
  buyShopItem,
  equipItem,
  upgradeItem,
  getItemLevel,
  getUpgradeCost,
  isItemOwned,
  isItemEquipped,
  MissionDef,
  ShopItemDef
} from '../../game/systems/MetaSystem';
import WeaponIcon, { getWeaponKeyFromItemId } from './WeaponIcon';
import { CompanionIcon, getCompanionKeyFromItemId } from './CompanionIcon';
import { getCompanionStatLine, CompanionId } from '../../game/systems/CompanionConfig';

export default function MainMenu({ onPlay }: { onPlay: () => void }) {
  const [metaState, setMetaState] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<'none' | 'missions' | 'settings' | 'store' | 'inventory' | 'daily'>('none');
  const modalOpenTimeRef = useRef<number>(0);

  useEffect(() => {
    if (activeModal !== 'none') {
      modalOpenTimeRef.current = Date.now();
    }
  }, [activeModal]);

  const handleOpenModal = (modal: 'none' | 'missions' | 'settings' | 'store' | 'inventory' | 'daily') => {
    const now = Date.now();
    if (now - modalOpenTimeRef.current < 400) return;
    modalOpenTimeRef.current = now;
    setActiveModal(modal);
  };

  const handleModalCloseSafe = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (Date.now() - modalOpenTimeRef.current < 400) return;
    setActiveModal('none');
  };

  const [missionTab, setMissionTab] = useState<'daily' | 'weekly'>('daily');
  const [storeTab, setStoreTab] = useState<'armory' | 'shards'>('armory');
  const [shopCategory, setShopCategory] = useState<'all' | 'weapon' | 'gear' | 'companion' | 'skin' | 'consumable'>('all');
  const [invCategory, setInvCategory] = useState<'all' | 'weapon' | 'gear' | 'companion' | 'skin' | 'consumable'>('all');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('NEON ACE');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadMeta();
    setMetaState({ ...loaded });
    if (loaded && loaded.playerName) {
      setNameInput(loaded.playerName);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleClaimDaily = () => {
    const res = claimDailyBonus();
    if (res.claimed) {
      setMetaState({ ...loadMeta() });
      showToast(`Day ${res.day} Streak Claimed: +${res.reward} Shards${res.day === 7 ? ' + 3 Grenades!' : '!'}`);
    } else {
      setActiveModal('daily');
    }
  };

  const handleClaimMission = (id: string) => {
    if (claimMissionReward(id)) {
      setMetaState({ ...loadMeta() });
      showToast('Mission reward claimed successfully!');
    }
  };

  const handleBuyShopItem = (id: string) => {
    const res = buyShopItem(id);
    setMetaState({ ...loadMeta() });
    showToast(res.msg);
  };

  const handleUpgradeItem = (id: string) => {
    const res = upgradeItem(id);
    setMetaState({ ...loadMeta() });
    showToast(res.msg);
  };

  const handleSaveName = () => {
    updatePlayerName(nameInput);
    setMetaState({ ...loadMeta() });
    setIsEditingName(false);
    showToast('Name updated!');
  };

  const handleToggleMaster = () => {
    toggleMasterMute();
    setMetaState({ ...loadMeta() });
    if ((window as any).ZombieEngine && (window as any).ZombieEngine.updateAudioVolumes) {
      (window as any).ZombieEngine.updateAudioVolumes();
    }
  };

  const handleToggleMusic = () => {
    toggleMusicMute();
    setMetaState({ ...loadMeta() });
    if ((window as any).ZombieEngine && (window as any).ZombieEngine.updateAudioVolumes) {
      (window as any).ZombieEngine.updateAudioVolumes();
    }
  };

  const handleToggleAimAssist = () => {
    toggleAimAssist();
    const updated = loadMeta();
    setMetaState({ ...updated });
    showToast(updated?.aimAssistEnabled ? 'Aim Assist Activated!' : 'Aim Assist Disabled');
  };

  const handleMasterVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setMasterVolume(val);
    setMetaState({ ...loadMeta() });
    if ((window as any).ZombieEngine && (window as any).ZombieEngine.updateAudioVolumes) {
      (window as any).ZombieEngine.updateAudioVolumes();
    }
  };

  const handleMusicVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setMusicVolume(val);
    setMetaState({ ...loadMeta() });
    if ((window as any).ZombieEngine && (window as any).ZombieEngine.updateAudioVolumes) {
      (window as any).ZombieEngine.updateAudioVolumes();
    }
  };

  const handleEquipItem = (id: string) => {
    const res = equipItem(id);
    setMetaState({ ...loadMeta() });
    showToast(res.msg);
  };

  // Missions ready to claim appear first at the top, followed by in-progress, then claimed
  const activeMissions = missionDefs
    .filter((m) => m.type === missionTab)
    .sort((a, b) => {
      const valA = metaState ? metaState[a.key] || 0 : 0;
      const isDoneA = valA >= a.target;
      const isClaimedA = metaState?.claimed ? metaState.claimed[a.id] : false;
      const canClaimA = isDoneA && !isClaimedA;

      const valB = metaState ? metaState[b.key] || 0 : 0;
      const isDoneB = valB >= b.target;
      const isClaimedB = metaState?.claimed ? metaState.claimed[b.id] : false;
      const canClaimB = isDoneB && !isClaimedB;

      // 1. Ready to claim first
      if (canClaimA && !canClaimB) return -1;
      if (!canClaimA && canClaimB) return 1;

      // 2. In progress second (unclaimed before claimed)
      if (!isClaimedA && isClaimedB) return -1;
      if (isClaimedA && !isClaimedB) return 1;

      return 0;
    });

  const formatLeading = (val: number, len = 7) => {
    const s = String(val || 0);
    return s.padStart(len, '0');
  };

  const renderLevelStars = (lvl: number, maxLvl?: number) => {
    if (!maxLvl) return null;
    return (
      <span className="zbh-stars-row" title={`Level ${lvl} of ${maxLvl}`}>
        {Array.from({ length: maxLvl }).map((_, i) => (
          <span key={i} className={`zbh-star ${i < lvl ? 'filled' : ''}`}>★</span>
        ))}
      </span>
    );
  };

  const isDailyReady = canClaimDailyBonus();
  const nextDaily = getNextDailyReward();

  const equippedWeaponLabel =
    metaState?.equippedWeapon === 'shotgun' && metaState?.hasShotgun
      ? `Heavy Shotgun LV.${metaState?.shotgunLevel || 1}`
      : metaState?.equippedWeapon === 'sniper' && metaState?.hasSniper
      ? `Sniper Rifle LV.${metaState?.sniperLevel || 1}`
      : metaState?.equippedWeapon === 'minigun' && metaState?.hasMinigun
      ? `Minigun LV.${metaState?.minigunLevel || 1}`
      : metaState?.equippedWeapon === 'rocket' && metaState?.hasRocket
      ? `Rocket Launcher LV.${metaState?.rocketLevel || 1}`
      : `Assault Rifle LV.${metaState?.carbineLevel || 1}`;

  const equippedArmorLabel =
    metaState?.equippedGear === 'kevlar' && metaState?.hasKevlar
      ? `Kevlar Vest LV.${metaState?.kevlarLevel || 1}`
      : 'No Vest';

  const equippedCompLabel =
    metaState?.equippedCompanion === 'drone' && metaState?.hasDrone
      ? `Laser Drone LV.${metaState?.droneLevel || 1}`
      : metaState?.equippedCompanion === 'dog' && metaState?.hasGuardDog
      ? `Combat Dog LV.${metaState?.dogLevel || 1}`
      : metaState?.equippedCompanion === 'robot' && metaState?.hasRobot
      ? `Shield Robot LV.${metaState?.robotLevel || 1}`
      : metaState?.equippedCompanion === 'medic' && metaState?.hasMedic
      ? `Medical Pet LV.${metaState?.medicLevel || 1}`
      : 'No Companion';

  const equippedSkinLabel =
    metaState?.equippedSkin === 'cyber' && metaState?.hasSkinCyber
      ? 'Cyberpunk'
      : metaState?.equippedSkin === 'hazmat' && metaState?.hasSkinHazmat
      ? 'Bio-Hazmat'
      : 'Default';

  const equippedGrenadesCount = metaState?.equippedGrenades !== false ? (metaState?.grenadesCount || 0) : 0;

  const ownedItems = shopItemDefs.filter((item) => isItemOwned(item.id, metaState));
  const filteredShopItems = shopItemDefs.filter((item) => shopCategory === 'all' || item.category === shopCategory);
  const filteredInvItems = ownedItems.filter((item) => invCategory === 'all' || item.category === invCategory);

  return (
    <div id="zbhMenuOverlay" className="zbh-menu-container pe">
      {/* CINEMATIC APOCALYPTIC NIGHT ILLUSTRATION BACKDROP */}
      <div className="zbh-scenic-backdrop" aria-hidden="true">
        <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" className="zbh-scenic-svg">
          <defs>
            <radialGradient id="skyGlow" cx="55%" cy="32%" r="65%">
              <stop offset="0%" stopColor="#1b3042" stopOpacity="0.88" />
              <stop offset="45%" stopColor="#0d1822" stopOpacity="0.94" />
              <stop offset="100%" stopColor="#05080c" stopOpacity="0.98" />
            </radialGradient>
            <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff8e7" stopOpacity="1" />
              <stop offset="30%" stopColor="#fae2a0" stopOpacity="0.85" />
              <stop offset="65%" stopColor="#ffd166" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffd166" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#09131d" stopOpacity="0" />
              <stop offset="50%" stopColor="#0e1d2c" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#09131d" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="cityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0c1622" />
              <stop offset="100%" stopColor="#05090f" />
            </linearGradient>
            <linearGradient id="fogGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#122536" stopOpacity="0" />
              <stop offset="70%" stopColor="#0a1520" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#04080c" stopOpacity="0.98" />
            </linearGradient>
          </defs>

          {/* Night Sky with deep moody tint */}
          <rect width="1920" height="1080" fill="#070c12" />
          <rect width="1920" height="1080" fill="url(#skyGlow)" />

          {/* Distant stars */}
          <g fill="#e0f2fe" opacity="0.5">
            <circle cx="140" cy="110" r="1.5" />
            <circle cx="280" cy="80" r="1.2" />
            <circle cx="420" cy="140" r="1.8" />
            <circle cx="580" cy="95" r="1" />
            <circle cx="760" cy="70" r="1.5" />
            <circle cx="920" cy="120" r="1.2" />
            <circle cx="1180" cy="85" r="1.6" />
            <circle cx="1680" cy="90" r="1.4" />
            <circle cx="1790" cy="150" r="1.2" />
            <circle cx="1840" cy="80" r="1.8" />
          </g>

          {/* Massive Glowing Full Moon with Crater Details */}
          <g transform="translate(1420, 240)">
            <circle cx="0" cy="0" r="160" fill="url(#moonGlow)" />
            <circle cx="0" cy="0" r="92" fill="#fdf4dc" />
            <circle cx="-25" cy="-20" r="28" fill="#e5d0a6" opacity="0.45" />
            <circle cx="28" cy="15" r="34" fill="#dfc796" opacity="0.4" />
            <circle cx="15" cy="-35" r="18" fill="#dfc796" opacity="0.35" />
            <circle cx="-35" cy="30" r="22" fill="#d8bc85" opacity="0.45" />
            <circle cx="-8" cy="10" r="16" fill="#cfb278" opacity="0.3" />
            <circle cx="42" cy="-12" r="14" fill="#cfb278" opacity="0.35" />
            <circle cx="2" cy="45" r="19" fill="#cfb278" opacity="0.35" />
          </g>

          {/* Drifting Eerie Clouds across the Moon */}
          <path d="M1100,220 Q1260,190 1440,215 T1750,225 Q1600,260 1420,245 T1100,220 Z" fill="url(#cloudGrad)" opacity="0.85" />
          <path d="M1250,270 Q1380,250 1520,275 T1820,290 Q1680,315 1500,305 T1250,270 Z" fill="url(#cloudGrad)" opacity="0.7" />
          <path d="M100,180 Q350,150 650,185 T1150,190 Q850,230 550,210 T100,180 Z" fill="url(#cloudGrad)" opacity="0.6" />

          {/* Far Distant Ruined City Silhouette */}
          <path
            d="M0,560 L40,560 L40,510 L70,510 L70,560 L120,560 L120,480 L145,480 L145,560 L190,560 L190,450 L205,450 L205,420 L215,420 L215,450 L230,450 L230,560 L290,560 L290,520 L330,520 L330,560 L410,560 L410,490 L450,490 L450,560 L520,560 L520,460 L560,460 L560,560 L680,560 L680,510 L720,510 L720,560 L800,560 L800,470 L840,470 L840,560 L920,560 L920,530 L970,530 L970,560 L1060,560 L1060,480 L1110,480 L1110,560 L1190,560 L1190,440 L1210,440 L1210,560 L1280,560 L1280,510 L1320,510 L1320,560 L1390,560 L1390,490 L1430,490 L1430,560 L1500,560 L1500,460 L1540,460 L1540,560 L1620,560 L1620,520 L1670,520 L1670,560 L1750,560 L1750,470 L1790,470 L1790,560 L1860,560 L1860,510 L1920,510 L1920,1080 L0,1080 Z"
            fill="#080e15"
            opacity="0.85"
          />

          {/* Midground Destroyed Industrial Skyline & Ruins */}
          <path
            d="M0,640 L60,640 L60,560 L80,560 L95,540 L110,560 L130,560 L130,640 L220,640 L220,580 L250,580 L250,640 L340,640 L340,530 L355,510 L370,510 L385,530 L400,530 L400,640 L480,640 L480,570 L530,570 L530,640 L620,640 L620,550 L645,530 L670,550 L690,550 L690,640 L780,640 L780,590 L820,590 L820,640 L900,640 L900,560 L940,560 L940,640 L1040,640 L1040,540 L1080,540 L1080,640 L1160,640 L1160,580 L1210,580 L1210,640 L1300,640 L1300,520 L1330,500 L1360,520 L1380,520 L1380,640 L1480,640 L1480,570 L1530,570 L1530,640 L1620,640 L1620,550 L1650,530 L1680,550 L1700,640 L1780,640 L1780,580 L1830,580 L1830,640 L1920,640 L1920,1080 L0,1080 Z"
            fill="url(#cityGrad)"
          />

          {/* Apocalyptic Windmill on the Right */}
          <g transform="translate(1720, 390)" stroke="#091017" strokeWidth="3" fill="#091017">
            <line x1="-30" y1="260" x2="-8" y2="40" />
            <line x1="30" y1="260" x2="8" y2="40" />
            <line x1="-24" y1="200" x2="24" y2="200" />
            <line x1="-18" y1="140" x2="18" y2="140" />
            <line x1="-12" y1="80" x2="12" y2="80" />
            <line x1="-24" y1="200" x2="18" y2="140" />
            <line x1="24" y1="200" x2="-18" y2="140" />
            <line x1="-18" y1="140" x2="12" y2="80" />
            <line x1="18" y1="140" x2="-12" y2="80" />
            <circle cx="0" cy="30" r="10" />
            <g transform="translate(0, 30)">
              {Array.from({ length: 16 }).map((_, i) => (
                <line
                  key={i}
                  x1="0"
                  y1="0"
                  x2={Math.cos((i * Math.PI) / 8) * 75}
                  y2={Math.sin((i * Math.PI) / 8) * 75}
                  strokeWidth="3.5"
                />
              ))}
              <circle cx="0" cy="0" r="75" fill="none" strokeWidth="2" strokeDasharray="6 4" />
              <circle cx="0" cy="0" r="45" fill="none" strokeWidth="1.5" />
            </g>
            <polygon points="12,24 60,18 55,38 12,34" />
          </g>

          {/* Radio Antennas in distance */}
          <g stroke="#091017" strokeWidth="2" opacity="0.8">
            <line x1="260" y1="560" x2="260" y2="390" />
            <line x1="260" y1="410" x2="330" y2="395" />
            <line x1="260" y1="410" x2="220" y2="415" />
            <line x1="1120" y1="560" x2="1120" y2="430" />
            <line x1="1110" y1="450" x2="1130" y2="450" />
            <line x1="1114" y1="470" x2="1126" y2="470" />
          </g>

          {/* Giant Zombie Arm Rising from Grave on Left */}
          <g transform="translate(210, 520)" fill="#05080c" stroke="#000000" strokeWidth="2">
            <path d="M-40,240 L-30,120 L-45,60 L-35,-20 L-10,-40 L10,-35 L20,-10 L15,60 L30,120 L40,240 Z" />
            <path d="M-35,-20 L-50,-70 L-25,-95 L20,-85 L35,-45 L20,-10 Z" />
            <path d="M-45,-45 L-80,-60 L-95,-50 L-85,-35 L-40,-30 Z" />
            <path d="M-35,-85 L-55,-150 L-45,-175 L-30,-170 L-20,-140 L-15,-88 Z" />
            <path d="M-15,-92 L-10,-175 L-2,-205 L15,-198 L12,-160 L5,-90 Z" />
            <path d="M8,-88 L25,-160 L38,-185 L52,-178 L42,-145 L22,-82 Z" />
            <path d="M25,-65 L55,-125 L70,-140 L80,-130 L65,-105 L35,-50 Z" />
            <polygon points="-45,-175 -52,-192 -35,-178" fill="#111827" />
            <polygon points="-2,-205 3,-225 12,-208" fill="#111827" />
            <polygon points="38,-185 46,-204 52,-188" fill="#111827" />
            <polygon points="70,-140 85,-155 82,-138" fill="#111827" />
          </g>

          {/* Broken Wooden Fence on Foreground Left */}
          <g fill="#070b10" stroke="#020406" strokeWidth="2">
            <polygon points="40,780 55,620 68,610 80,620 70,780" />
            <polygon points="90,790 102,640 115,630 128,640 120,790" />
            <polygon points="140,800 155,660 166,650 178,660 170,800" />
            <polygon points="20,710 190,680 190,705 20,735" />
          </g>

          {/* Foreground Atmosphere & Toxic Mist */}
          <rect y="480" width="1920" height="600" fill="url(#fogGrad)" />

          {/* Bottom Grass / Foliage Silhouette */}
          <g fill="#06120b">
            {Array.from({ length: 48 }).map((_, i) => {
              const x = i * 42;
              const h = 50 + ((i * 37) % 55);
              return (
                <path
                  key={i}
                  d={`M${x - 20},1080 Q${x - 10},${1080 - h} ${x},${1080 - h - 20} Q${x + 8},${1080 - h + 10} ${x + 20},1080 Z`}
                  opacity="0.95"
                />
              );
            })}
          </g>
        </svg>

        {/* User-supplied photo backdrop hook */}
        <div className="zbh-scenic-photo" />
        <div className="zbh-scenic-shade" />
      </div>

      {/* TOP HEADER ROW */}
      <div className="zbh-top-header-row">
        {/* TOP BAR LEFT - Profile */}
        <div className="zbh-top-left-profile">
          <div className="zbh-avatar-box">
            <svg viewBox="0 0 24 24" className="zbh-skull-icon">
              <path
                fill="currentColor"
                d="M12 2C7.03 2 3 5.8 3 10.5c0 2.9 1.54 5.46 3.9 6.96V21c0 .55.45 1 1 1h8.2c.55 0 1-.45 1-1v-3.54c2.36-1.5 3.9-4.06 3.9-6.96C21 5.8 16.97 2 12 2zm-3.2 7.5h2.4v2.8H8.8V9.5zm6.4 0h-2.4v2.8h2.4V9.5zm-4.4 5.2h2.4L12 17l-1.2-2.3zm-1.8 3.8h1.2v2h-1.2v-2zm2.4 0h1.2v2h-1.2v-2zm2.4 0H15v2h-1.2v-2z"
              />
            </svg>
          </div>

          <div className="zbh-player-info">
            <div className="zbh-name-row">
              {isEditingName ? (
                <div className="zbh-name-edit-box">
                  <input
                    type="text"
                    className="zbh-name-input"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    maxLength={14}
                  />
                  <button className="zbh-save-name-btn" onClick={handleSaveName}>OK</button>
                </div>
              ) : (
                <>
                  <span className="zbh-player-name">{metaState?.playerName || 'NEON ACE'}</span>
                  <button className="zbh-edit-icon" onClick={() => setIsEditingName(true)} title="Edit Name">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="#ffae00">
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                    </svg>
                  </button>
                </>
              )}
            </div>

            <div className="zbh-badges-row">
              <span className="zbh-lvl-badge">LVL {metaState?.playerLevel || 3}</span>
              <span className="zbh-rank-badge">{metaState?.playerRank || 'ROOKIE HUNTER'}</span>
            </div>
          </div>
        </div>

        {/* TOP BAR RIGHT - Currency Shards & Settings Gear */}
        <div className="zbh-top-right-bar">
          <div className="zbh-currency-box">
            <svg viewBox="0 0 32 32" className="zbh-gem-svg">
              <polygon points="8,4 24,4 30,12 2,12" fill="#80ecff" />
              <polygon points="2,12 30,12 16,29" fill="#00b0ff" />
              <polygon points="10,12 22,12 16,29" fill="#40c4ff" />
              <polygon points="8,4 12,12 2,12" fill="#40c4ff" />
              <polygon points="24,4 30,12 20,12" fill="#0091ea" />
              <polygon points="12,12 20,12 16,4" fill="#b3f5ff" />
            </svg>
            <span className="zbh-gem-val">{metaState?.bankBones || 0}</span>
            <button
              className="zbh-plus-btn"
              onClick={() => { setStoreTab('shards'); setActiveModal('store'); }}
              title="Buy Shards"
            >
              +
            </button>
          </div>

          <button
            className="zbh-settings-gear-btn"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenModal('settings');
            }}
            title="Settings"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
          </button>
        </div>
      </div>

      {/* CENTER HERO LOGO */}
      <div className="zbh-center-logo-box">
        <div className="zbh-logo-splatter-wrap">
          <div className="zbh-title-zombie-row">
            <span className="zbh-title-zombie">ZOMB</span>
            <span className="zbh-o-hand">
              <span className="zbh-title-zombie">I</span>
              <svg viewBox="0 0 24 32" className="zbh-o-hand-svg">
                <path
                  d="M10 28 L11 16 Q8 12 5 9 Q4 7 6 6 Q8 6 9 8 L11 13 Q11 8 10 4 Q10 2 12 2 Q14 2 14 5 L14 12 Q15 7 16 3 Q17 1 18 1 Q20 1 20 5 L19 13 Q20 8 22 5 Q23 4 24 5 Q25 6 24 9 L23 16 Q24 13 26 12 Q27 12 27 14 Q27 16 25 18 L22 22 L20 28 Z"
                  fill="#000000"
                  stroke="#1f2937"
                  strokeWidth="0.8"
                />
              </svg>
            </span>
            <span className="zbh-title-zombie">E</span>
          </div>

          <div className="zbh-title-bone-hunter" data-text="BONE HUNTER">
            BONE HUNTER
          </div>

          <div className="zbh-subtitle-studio-row">
            <span className="zbh-studio-line" />
            <span className="zbh-game-subtitle">LLCGAMES STUDIO</span>
            <span className="zbh-studio-line" />
          </div>
        </div>
      </div>

      {/* 5 HORIZONTAL PARALLELOGRAM CHAMFERED ACTION BUTTONS (Matching Reference Image) */}
      <div className="zbh-buttons-row">
        {/* 1. START GAME (Fiery Orange Chamfered) */}
        <button className="zbh-skew-btn zbh-skew-start" onClick={onPlay}>
          <div className="zbh-skew-inner">
            <div className="zbh-skew-icon-wrap start-icon">
              <svg viewBox="0 0 32 32" className="zbh-btn-svg">
                <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" />
                <circle cx="16" cy="16" r="3" fill="currentColor" />
                <line x1="16" y1="2" x2="16" y2="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="16" y1="24" x2="16" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="2" y1="16" x2="8" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="24" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="zbh-start-label">START GAME</span>
            <span className="zbh-start-chevrons">
              <svg viewBox="0 0 32 32" width="24" height="24" fill="currentColor">
                <polygon points="4,6 12,6 20,16 12,26 4,26 12,16" />
                <polygon points="14,6 22,6 30,16 22,26 14,26 22,16" />
              </svg>
            </span>
          </div>
        </button>

        {/* 2. MISSIONS (Tactical Cyan Chamfered) */}
        <button className="zbh-skew-btn zbh-skew-missions" onClick={() => setActiveModal('missions')}>
          <div className="zbh-skew-inner">
            <div className="zbh-skew-icon-wrap blue-icon">
              <svg viewBox="0 0 24 24" className="zbh-btn-svg">
                <path
                  fill="currentColor"
                  d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"
                />
              </svg>
            </div>
            <div className="zbh-skew-text-col">
              <span className="zbh-skew-title">MISSIONS</span>
              <span className="zbh-skew-sub blue-sub">1/6 CLAIM</span>
            </div>
          </div>
        </button>

        {/* 3. STREAK (Neon Green Chamfered) */}
        <button
          className={`zbh-skew-btn zbh-skew-streak ${isDailyReady ? 'ready' : ''}`}
          onClick={() => setActiveModal('daily')}
        >
          <div className="zbh-skew-inner">
            <div className="zbh-skew-icon-wrap green-icon">
              <svg viewBox="0 0 24 24" className="zbh-btn-svg">
                <path
                  fill="currentColor"
                  d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM10.5 15.5l-2.5-2.5 1.4-1.4 1.1 1.1 4.6-4.6 1.4 1.4-6 6z"
                />
              </svg>
            </div>
            <div className="zbh-skew-text-col">
              <span className="zbh-skew-title green-title">STREAK</span>
              <span className="zbh-skew-sub green-sub">
                DAY {metaState?.dailyStreak ? `${(metaState.dailyStreak % 7) || 1}/7` : '1/7'}
              </span>
            </div>
          </div>
        </button>

        {/* 4. INVENTORY (Crimson Red Chamfered) */}
        <button className="zbh-skew-btn zbh-skew-inventory" onClick={() => setActiveModal('inventory')}>
          <div className="zbh-skew-inner">
            <div className="zbh-skew-icon-wrap red-icon">
              <svg viewBox="0 0 24 24" className="zbh-btn-svg">
                <path
                  fill="currentColor"
                  d="M20 8v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V8c0-1.86 1.28-3.41 3-3.86V3c0-.55.45-1 1-1h8c.55 0 1 .45 1 1v1.14c1.72.45 3 2 3 3.86zM9 4v1h6V4H9zm9 6H6v10h12V10zm-2 2v4H8v-4h8z"
                />
              </svg>
            </div>
            <div className="zbh-skew-text-col">
              <span className="zbh-skew-title">INVENTORY</span>
              <span className="zbh-skew-sub white-sub">{ownedItems.length}/8 OWNED</span>
            </div>
          </div>
        </button>

        {/* 5. SURVIVAL SHOP (Gunmetal & Gold Chamfered) */}
        <button
          className="zbh-skew-btn zbh-skew-shop"
          onClick={() => { setStoreTab('armory'); setActiveModal('store'); }}
        >
          <div className="zbh-skew-inner shop-layout">
            <div className="zbh-shop-top-row">
              <div className="zbh-skew-icon-wrap gold-icon">
                <svg viewBox="0 0 24 24" className="zbh-btn-svg">
                  <path
                    fill="currentColor"
                    d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1.003 1.003 0 0 0 20 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"
                  />
                </svg>
              </div>
              <div className="zbh-skew-text-col">
                <span className="zbh-skew-title">SURVIVAL SHOP</span>
              </div>
            </div>
            <span className="zbh-shop-bottom-sub">WEAPONS · DRONE · SKINS</span>
          </div>
        </button>
      </div>

      {/* BOTTOM CHAMFERED STATS BAR */}
      <div className="zbh-bottom-stats-bar">
        <div className="zbh-stat-box">
          <svg viewBox="0 0 24 24" className="zbh-stat-icon gold">
            <path
              fill="currentColor"
              d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"
            />
          </svg>
          <span className="lbl">BEST SCORE</span>
          <span className="val gold">{formatLeading(metaState?.bestScore || 0, 7)}</span>
        </div>

        <div className="zbh-stat-divider" />

        <div className="zbh-stat-box">
          <svg viewBox="0 0 24 24" className="zbh-stat-icon cyan">
            <path
              fill="currentColor"
              d="M3 10c2.5-2.5 5.5-2.5 8 0 2.5 2.5 5.5 2.5 8 0l2 2c-3.5 3.5-7.5 3.5-11 0-2-2-4-2-6 0l-1-2zm0 6c2.5-2.5 5.5-2.5 8 0 2.5 2.5 5.5 2.5 8 0l2 2c-3.5 3.5-7.5 3.5-11 0-2-2-4-2-6 0l-1-2z"
            />
          </svg>
          <span className="lbl">BEST WAVE</span>
          <span className="val green">WAVE {metaState?.bestWave || 1}</span>
        </div>

        <div className="zbh-stat-divider" />

        <div className="zbh-stat-box">
          <svg viewBox="0 0 24 24" className="zbh-stat-icon white">
            <path
              fill="currentColor"
              d="M12 2C7.58 2 4 5.58 4 10c0 2.84 1.48 5.34 3.73 6.74L7 19c-.15.46.2.92.68.92h8.64c.48 0 .83-.46.68-.92l-.73-2.26C18.52 15.34 20 12.84 20 10c0-4.42-3.58-8-8-8zm-3 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"
            />
          </svg>
          <span className="lbl">TOTAL KILLS</span>
          <span className="val gold">{formatLeading(metaState?.totalKills || 0, 7)}</span>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toastMsg && <div className="zbh-toast-popup">{toastMsg}</div>}

      {/* MODAL: SETTINGS */}
      {activeModal === 'settings' && (
        <div className="zbh-modal-backdrop pe" onPointerDown={(e) => { if (e.target === e.currentTarget) handleModalCloseSafe(e); }}>
          <div className="zbh-modal-card" onPointerDown={(e) => e.stopPropagation()}>
            <div className="zbh-modal-header">
              <h2>⚙️ GAME SETTINGS</h2>
              <button className="zbh-modal-close" onPointerDown={handleModalCloseSafe}>✕</button>
            </div>

            <div className="zbh-settings-grid">
              <div className="zbh-set-card">
                <h3>AUDIO & SOUND</h3>
                <div className="s-row" style={{ alignItems: 'center' }}>
                  <span>MASTER SOUND ({metaState?.masterVolume ?? 80}%)</span>
                  <button
                    className={`m-btn ${metaState?.masterMuted ? 'locked' : 'ready'}`}
                    onClick={handleToggleMaster}
                  >
                    {metaState?.masterMuted ? 'MUTED' : 'ACTIVE'}
                  </button>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={metaState?.masterVolume ?? 80}
                  onChange={handleMasterVolumeChange}
                  className="zbh-vol-slider"
                />

                <div className="s-row" style={{ alignItems: 'center', marginTop: 4 }}>
                  <span>AMBIENT MUSIC ({metaState?.musicVolume ?? 60}%)</span>
                  <button
                    className={`m-btn ${metaState?.musicMuted ? 'locked' : 'ready'}`}
                    onClick={handleToggleMusic}
                  >
                    {metaState?.musicMuted ? 'MUTED' : 'ACTIVE'}
                  </button>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={metaState?.musicVolume ?? 60}
                  onChange={handleMusicVolumeChange}
                  className="zbh-vol-slider"
                />
              </div>

              <div className="zbh-set-card">
                <h3>GAMEPLAY & CONTROLS</h3>
                <div className="s-row" style={{ alignItems: 'center' }}>
                  <span>AIM ASSIST LOCK</span>
                  <button
                    className={`m-btn ${metaState?.aimAssistEnabled ? 'ready' : 'locked'}`}
                    onClick={handleToggleAimAssist}
                  >
                    {metaState?.aimAssistEnabled ? 'ENABLED' : 'MANUAL'}
                  </button>
                </div>
                <div className="s-row">
                  <span>CONTROL SCHEME</span>
                  <strong>DUAL VIRTUAL JOYSTICKS</strong>
                </div>
                <div className="s-row">
                  <span>CAMERA PROJECTION</span>
                  <strong>ISOMETRIC TOP-DOWN 3D</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DAILY STREAK */}
      {activeModal === 'daily' && (
        <div className="zbh-modal-backdrop pe" onPointerDown={(e) => { if (e.target === e.currentTarget) handleModalCloseSafe(e); }}>
          <div className="zbh-modal-card" onPointerDown={(e) => e.stopPropagation()}>
            <div className="zbh-modal-header">
              <h2>DAILY LOGIN STREAK</h2>
              <button className="zbh-modal-close" onPointerDown={handleModalCloseSafe}>✕</button>
            </div>

            <p style={{ fontSize: 13, color: '#aaa', margin: '4px 0 16px' }}>
              Claim consecutive daily logins to earn massive Shard rewards! Day 7 unlocks 3 Free Frag Grenades!
            </p>

            <div className="zbh-daily-grid">
              {dailyStreakRewards.map((reward, i) => {
                const dayNum = i + 1;
                const curStreak = metaState?.dailyStreak || 0;
                const isPast = dayNum <= curStreak && !isDailyReady;
                const isToday = (dayNum === curStreak + 1 && isDailyReady) || (curStreak === 0 && dayNum === 1 && isDailyReady);

                return (
                  <div key={dayNum} className={`zbh-daily-cell ${isToday ? 'today' : ''} ${isPast ? 'claimed' : ''}`}>
                    <span className="d-day">DAY {dayNum}</span>
                    <span className="d-reward">+{reward}</span>
                    <span className="d-icon">💎</span>
                    {dayNum === 7 && (
                      <span style={{ fontSize: 9, color: 'var(--gold)', fontWeight: 800, marginTop: 2 }}>
                        + 3 FRAG GRENADES!
                      </span>
                    )}
                    {isPast ? (
                      <span className="m-btn claimed" style={{ marginTop: 4 }}>CLAIMED ✓</span>
                    ) : isToday ? (
                      <button className="m-btn ready" style={{ marginTop: 4 }} onClick={handleClaimDaily}>
                        CLAIM NOW!
                      </button>
                    ) : (
                      <span className="m-btn locked" style={{ marginTop: 4 }}>LOCKED</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MISSIONS */}
      {activeModal === 'missions' && (
        <div className="zbh-modal-backdrop pe" onPointerDown={(e) => { if (e.target === e.currentTarget) handleModalCloseSafe(e); }}>
          <div className="zbh-modal-card" onPointerDown={(e) => e.stopPropagation()}>
            <div className="zbh-modal-header">
              <h2>MISSION BOARD</h2>
              <button className="zbh-modal-close" onPointerDown={handleModalCloseSafe}>✕</button>
            </div>

            <div className="zbh-subtabs-row">
              <button
                className={`zbh-subtab ${missionTab === 'daily' ? 'active' : ''}`}
                onClick={() => setMissionTab('daily')}
              >
                DAILY MISSIONS
              </button>
              <button
                className={`zbh-subtab ${missionTab === 'weekly' ? 'active' : ''}`}
                onClick={() => setMissionTab('weekly')}
              >
                WEEKLY MISSIONS
              </button>
            </div>

            <div className="zbh-missions-scroll">
              {activeMissions.map((m: MissionDef) => {
                const val = metaState ? metaState[m.key] || 0 : 0;
                const isDone = val >= m.target;
                const isClaimed = metaState?.claimed ? metaState.claimed[m.id] : false;
                const pct = Math.min(100, Math.floor((val / m.target) * 100));

                return (
                  <div key={m.id} className={`zbh-mission-item ${isDone ? 'completed' : ''} ${isClaimed ? 'claimed' : ''}`}>
                    <div className="m-left">
                      <span className={`m-badge ${m.type}`}>{m.type === 'daily' ? 'DAILY' : 'WEEKLY'}</span>
                      <h4>{m.title}</h4>
                      <p>{m.desc}</p>
                      <div className="m-prog-bar"><div style={{ width: `${pct}%` }}></div></div>
                      <span className="m-prog-num">{val} / {m.target} ({pct}%)</span>
                    </div>

                    <div className="m-right">
                      <span className="m-reward">+ {m.reward} SHARDS 💎</span>
                      {isClaimed ? (
                        <button className="m-btn claimed" disabled>CLAIMED</button>
                      ) : isDone ? (
                        <button className="m-btn ready" onClick={() => handleClaimMission(m.id)}>CLAIM</button>
                      ) : (
                        <button className="m-btn locked" disabled>IN PROGRESS</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SURVIVAL SHOP & SHARDS */}
      {activeModal === 'store' && (
        <div className="zbh-modal-backdrop pe" onPointerDown={(e) => { if (e.target === e.currentTarget) handleModalCloseSafe(e); }}>
          <div className="zbh-modal-card" onPointerDown={(e) => e.stopPropagation()}>
            <div className="zbh-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2>SURVIVAL SHOP & ARMORY</h2>
                <span className="zbh-lvl-badge" style={{ fontSize: 12, padding: '2px 8px' }}>
                  💎 {metaState?.bankBones || 0} SHARDS
                </span>
              </div>
              <button className="zbh-modal-close" onPointerDown={handleModalCloseSafe}>✕</button>
            </div>

            <div className="zbh-subtabs-row" style={{ flexWrap: 'wrap' }}>
              <button
                className={`zbh-subtab ${storeTab === 'armory' ? 'active' : ''}`}
                onClick={() => setStoreTab('armory')}
              >
                ARMORY & GEAR
              </button>
              <button
                className={`zbh-subtab ${storeTab === 'shards' ? 'active' : ''}`}
                onClick={() => setStoreTab('shards')}
              >
                GET MORE SHARDS
              </button>
              <button
                className="zbh-subtab"
                style={{ marginLeft: 'auto', borderColor: 'var(--gold)', color: 'var(--gold)' }}
                onClick={() => setActiveModal('inventory')}
              >
                OPEN INVENTORY ({ownedItems.length})
              </button>
            </div>

            {storeTab === 'armory' && (
              <>
                <div className="zbh-filter-pills-row">
                  {[
                    { key: 'all', label: 'ALL ITEMS' },
                    { key: 'weapon', label: 'WEAPONS' },
                    { key: 'gear', label: 'ARMOR' },
                    { key: 'companion', label: 'COMPANIONS' },
                    { key: 'skin', label: 'SKINS' },
                    { key: 'consumable', label: 'GRENADES' }
                  ].map((c) => (
                    <button
                      key={c.key}
                      className={`zbh-filter-pill ${shopCategory === c.key ? 'active' : ''}`}
                      onClick={() => setShopCategory(c.key as any)}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <div className="zbh-missions-scroll">
                  {filteredShopItems.map((item: ShopItemDef) => {
                    const owned = isItemOwned(item.id, metaState);
                    const equipped = isItemEquipped(item.id, metaState);
                    const lvl = getItemLevel(item.id, metaState);
                    const upgCost = getUpgradeCost(item.id, metaState);
                    const compKey = getCompanionKeyFromItemId(item.id);
                    const compStatLine = compKey ? getCompanionStatLine(compKey as CompanionId, lvl) : null;

                    return (
                      <div key={item.id} className={`zbh-mission-item ${owned ? 'completed' : ''}`}>
                        <div className="m-left">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {getWeaponKeyFromItemId(item.id) ? (
                              <div className="zbh-item-icon-box weapon">
                                <WeaponIcon weaponKey={getWeaponKeyFromItemId(item.id)!} className="zbh-item-wep-svg" />
                              </div>
                            ) : compKey ? (
                              <div className="zbh-item-icon-box weapon">
                                <CompanionIcon companionKey={compKey} size={36} />
                              </div>
                            ) : (
                              <div className="zbh-item-icon-box">{item.icon}</div>
                            )}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <h4>{item.title}</h4>
                                {owned && item.maxLevel && (
                                  <>
                                    <span className="zbh-lvl-badge">LVL {lvl}/{item.maxLevel}</span>
                                    {renderLevelStars(lvl, item.maxLevel)}
                                  </>
                                )}
                              </div>
                              <p>{item.desc}</p>
                              {compStatLine && (
                                <div style={{ color: 'var(--cyan)', fontSize: 11, fontWeight: 700, marginTop: 2 }}>
                                  {compStatLine}
                                </div>
                              )}
                              {item.id === 'consumable_grenades' && (
                                <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 10 }}>
                                  IN POUCH: {metaState?.grenadesCount || 0} 💣
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="m-right">
                          {item.id === 'consumable_grenades' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                              <span className="m-reward">{item.cost} SHARDS 💎</span>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  className="m-btn ready"
                                  onClick={() => handleBuyShopItem(item.id)}
                                >
                                  BUY (+3 💣)
                                </button>
                                {owned && (
                                  <button
                                    className={`m-btn ${equipped ? 'claimed' : 'ready'}`}
                                    style={equipped ? { border: '1px solid var(--green-main)', opacity: 1 } : {}}
                                    onClick={() => handleEquipItem(item.id)}
                                  >
                                    {equipped ? 'EQUIPPED ✓' : 'EQUIP'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : owned ? (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {item.maxLevel && lvl < item.maxLevel && (
                                <button
                                  className="m-btn ready"
                                  style={{ background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)' }}
                                  onClick={() => handleUpgradeItem(item.id)}
                                >
                                  ⬆️ UPGRADE ({upgCost} 💎)
                                </button>
                              )}
                              <button
                                className={`m-btn ${equipped ? 'claimed' : 'ready'}`}
                                style={equipped ? { border: '1px solid var(--green-main)', opacity: 1 } : {}}
                                onClick={() => handleEquipItem(item.id)}
                              >
                                {equipped ? 'EQUIPPED ✓' : 'EQUIP'}
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                              <span className="m-reward">{item.cost} SHARDS 💎</span>
                              <button
                                className="m-btn ready"
                                onClick={() => handleBuyShopItem(item.id)}
                              >
                                BUY & EQUIP
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {storeTab === 'shards' && (
              <div className="zbh-store-grid">
                <div className="zbh-store-card">
                  <div className="s-icon">💎</div>
                  <h3>1,000 SHARDS PACK</h3>
                  <p>Instantly top up your vault with 1,000 Shards.</p>
                  <button className="zbh-store-buy-btn" onClick={() => {
                    if ((window as any).ZombieNative && (window as any).ZombieNative.purchaseProduct) {
                      (window as any).ZombieNative.purchaseProduct('bones_pack_small');
                    } else {
                      showToast('Store active on Google Play Billing mobile build!');
                    }
                  }}>
                    BUY NOW
                  </button>
                </div>

                <div className="zbh-store-card gold">
                  <div className="s-icon">💎💎</div>
                  <h3>5,000 SHARDS PACK</h3>
                  <p>Instantly receive 5,000 Shards + Survivor Bonus!</p>
                  <button className="zbh-store-buy-btn gold" onClick={() => {
                    if ((window as any).ZombieNative && (window as any).ZombieNative.purchaseProduct) {
                      (window as any).ZombieNative.purchaseProduct('bones_pack_large');
                    } else {
                      showToast('Store active on Google Play Billing mobile build!');
                    }
                  }}>
                    BUY BONUS PACK
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: INVENTORY & LOADOUT */}
      {activeModal === 'inventory' && (
        <div className="zbh-modal-backdrop pe" onPointerDown={(e) => { if (e.target === e.currentTarget) handleModalCloseSafe(e); }}>
          <div className="zbh-modal-card" onPointerDown={(e) => e.stopPropagation()}>
            <div className="zbh-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h2>HUNTER INVENTORY & LOADOUT</h2>
                <span className="zbh-lvl-badge" style={{ fontSize: 12, padding: '2px 8px' }}>
                  💎 {metaState?.bankBones || 0} SHARDS
                </span>
              </div>
              <button className="zbh-modal-close" onPointerDown={handleModalCloseSafe}>✕</button>
            </div>

            <div className="zbh-inv-slots-grid">
              <div className="zbh-inv-slot-box">
                <span className="slot-lbl">PRIMARY WEAPON</span>
                <strong className="slot-val">{equippedWeaponLabel}</strong>
              </div>
              <div className="zbh-inv-slot-box">
                <span className="slot-lbl">BODY ARMOR</span>
                <strong className="slot-val">{equippedArmorLabel}</strong>
              </div>
              <div className="zbh-inv-slot-box">
                <span className="slot-lbl">COMPANION</span>
                <strong className="slot-val">{equippedCompLabel}</strong>
              </div>
              <div className="zbh-inv-slot-box">
                <span className="slot-lbl">HUNTER SKIN</span>
                <strong className="slot-val">{equippedSkinLabel}</strong>
              </div>
              <div className="zbh-inv-slot-box">
                <span className="slot-lbl">TACTICAL POUCH</span>
                <strong className="slot-val">{equippedGrenadesCount} GRENADES</strong>
              </div>
            </div>

            <div className="zbh-filter-pills-row">
              {[
                { key: 'all', label: `ALL OWNED (${ownedItems.length})` },
                { key: 'weapon', label: 'WEAPONS' },
                { key: 'gear', label: 'ARMOR' },
                { key: 'companion', label: 'COMPANIONS' },
                { key: 'skin', label: 'SKINS' },
                { key: 'consumable', label: 'GRENADES' }
              ].map((c) => (
                <button
                  key={c.key}
                  className={`zbh-filter-pill ${invCategory === c.key ? 'active' : ''}`}
                  onClick={() => setInvCategory(c.key as any)}
                >
                  {c.label}
                </button>
              ))}
              <button
                className="zbh-filter-pill"
                style={{ marginLeft: 'auto', borderColor: 'var(--gold)', color: 'var(--gold)' }}
                onClick={() => { setStoreTab('armory'); setActiveModal('store'); }}
              >
                BUY MORE IN SHOP
              </button>
            </div>

            <div className="zbh-missions-scroll">
              {filteredInvItems.length === 0 ? (
                <div className="zbh-set-card" style={{ alignItems: 'center', textAlign: 'center', padding: 24 }}>
                  <p style={{ fontSize: 13, color: '#ccc', marginBottom: 10 }}>
                    No owned items in this category yet. Visit the Survival Shop to unlock weapons, armor, companions, skins, and grenades!
                  </p>
                  <button
                    className="m-btn ready"
                    onClick={() => { setStoreTab('armory'); setActiveModal('store'); }}
                  >
                    GO TO SURVIVAL SHOP
                  </button>
                </div>
              ) : (
                filteredInvItems.map((item: ShopItemDef) => {
                  const equipped = isItemEquipped(item.id, metaState);
                  const lvl = getItemLevel(item.id, metaState);
                  const upgCost = getUpgradeCost(item.id, metaState);
                  const compKey = getCompanionKeyFromItemId(item.id);
                  const compStatLine = compKey ? getCompanionStatLine(compKey as CompanionId, lvl) : null;

                  return (
                    <div key={item.id} className="zbh-mission-item completed">
                      <div className="m-left">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {getWeaponKeyFromItemId(item.id) ? (
                            <div className="zbh-item-icon-box weapon">
                              <WeaponIcon weaponKey={getWeaponKeyFromItemId(item.id)!} className="zbh-item-wep-svg" />
                            </div>
                          ) : compKey ? (
                            <div className="zbh-item-icon-box weapon">
                              <CompanionIcon companionKey={compKey} size={36} />
                            </div>
                          ) : (
                            <div className="zbh-item-icon-box">{item.icon}</div>
                          )}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <h4>{item.title}</h4>
                              {item.maxLevel && (
                                <>
                                  <span className="zbh-lvl-badge">LVL {lvl}/{item.maxLevel}</span>
                                  {renderLevelStars(lvl, item.maxLevel)}
                                </>
                              )}
                            </div>
                            <p>{item.desc}</p>
                            {compStatLine && (
                              <div style={{ color: 'var(--cyan)', fontSize: 11, fontWeight: 700, marginTop: 2 }}>
                                {compStatLine}
                              </div>
                            )}
                            {item.id === 'consumable_grenades' && (
                              <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 10 }}>
                                IN POUCH: {metaState?.grenadesCount || 0} 💣
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="m-right">
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          {item.maxLevel && lvl < item.maxLevel && (
                            <button
                              className="m-btn ready"
                              style={{ background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)' }}
                              onClick={() => handleUpgradeItem(item.id)}
                            >
                              ⬆️ UPGRADE ({upgCost} 💎)
                            </button>
                          )}
                          <button
                            className={`m-btn ${equipped ? 'claimed' : 'ready'}`}
                            style={equipped ? { border: '1px solid var(--green-main)', opacity: 1 } : {}}
                            onClick={() => handleEquipItem(item.id)}
                          >
                            {equipped ? 'EQUIPPED ✓' : 'EQUIP'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
