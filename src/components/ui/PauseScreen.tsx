import React, { useState, useRef, useEffect } from 'react';
import {
  loadMeta,
  toggleMasterMute,
  toggleMusicMute,
  toggleAimAssist,
  setMasterVolume,
  setMusicVolume
} from '../../game/systems/MetaSystem';

export default function PauseScreen({ onResume, onRestart, onMenu, hudData }: any) {
  const [metaState, setMetaState] = useState<any>(() => loadMeta());
  const openTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    openTimeRef.current = Date.now();
  }, []);

  const handleResumeSafe = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (Date.now() - openTimeRef.current < 400) return;
    if (onResume) onResume();
  };

  const handleBackdropClick = (e: React.SyntheticEvent) => {
    if (e.target === e.currentTarget) {
      handleResumeSafe(e);
    }
  };

  const syncAudio = () => {
    setMetaState({ ...loadMeta() });
    if ((window as any).ZombieEngine && (window as any).ZombieEngine.updateAudioVolumes) {
      (window as any).ZombieEngine.updateAudioVolumes();
    }
  };

  const handleToggleMaster = () => {
    toggleMasterMute();
    syncAudio();
  };

  const handleToggleMusic = () => {
    toggleMusicMute();
    syncAudio();
  };

  const handleToggleAim = () => {
    toggleAimAssist();
    setMetaState({ ...loadMeta() });
  };

  const handleMasterVol = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMasterVolume(Number(e.target.value));
    syncAudio();
  };

  const handleMusicVol = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMusicVolume(Number(e.target.value));
    syncAudio();
  };

  const formatLeading = (num: number, digits: number) => {
    return String(num || 0).padStart(digits, '0');
  };

  const aimOn = metaState?.aimAssistEnabled !== false;

  return (
    <div id="pauseScreen" className="zbh-pause-overlay pe" onPointerDown={handleBackdropClick}>
      {/* TOP HEADER ROW - Same Chamfered Profile & Currency Bar as Main Menu */}
      <div className="zbh-top-header-row">
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
              <span className="zbh-player-name">{metaState?.playerName || 'NEON ACE'}</span>
            </div>
            <div className="zbh-badges-row">
              <span className="zbh-lvl-badge">LVL {metaState?.playerLevel || 3}</span>
              <span className="zbh-rank-badge">{hudData?.weapon || 'ASSAULT RIFLE'}</span>
            </div>
          </div>
        </div>

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
            <span className="zbh-gem-val">{(metaState?.bankBones || 0) + (hudData?.bones || 0)}</span>
          </div>

          <button
            className="zbh-settings-gear-btn"
            onPointerDown={handleResumeSafe}
            title="Resume Game"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      </div>

      {/* CENTER HERO TITLE: GAME PAUSED (Same Distressed Metallic + Fiery Orange Style) */}
      <div className="zbh-center-logo-box pause-logo-box">
        <div className="zbh-logo-splatter-wrap">
          <div className="zbh-title-zombie-row">
            <span className="zbh-title-zombie zbh-pause-tactical-title">TACTICAL</span>
          </div>
          <div
            className="zbh-title-bone-hunter zbh-pause-main-title"
            data-text="GAME PAUSED"
          >
            GAME PAUSED
          </div>
          <div className="zbh-subtitle-studio-row">
            <span className="zbh-studio-line" />
            <span className="zbh-game-subtitle zbh-pause-subtitle">COMBAT & AUDIO SETTINGS</span>
            <span className="zbh-studio-line" />
          </div>
        </div>
      </div>

      {/* CHAMFERED AUDIO SLIDERS BAR */}
      <div className="zbh-pause-audio-panel">
        {/* SFX Volume */}
        <div className="zbh-pause-audio-col">
          <div className="zbh-pause-audio-head">
            <div className="zbh-pause-audio-lbl">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="#ffae00">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
              <span>SFX VOLUME ({metaState?.masterVolume ?? 80}%)</span>
            </div>
            <button
              className={`zbh-pause-mute-chip ${metaState?.masterMuted ? 'muted' : 'active'}`}
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
            onChange={handleMasterVol}
            className="zbh-vol-slider"
          />
        </div>

        <div className="zbh-stat-divider" />

        {/* Music Volume */}
        <div className="zbh-pause-audio-col">
          <div className="zbh-pause-audio-head">
            <div className="zbh-pause-audio-lbl">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="#29b6f6">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
              <span>MUSIC VOLUME ({metaState?.musicVolume ?? 60}%)</span>
            </div>
            <button
              className={`zbh-pause-mute-chip ${metaState?.musicMuted ? 'muted' : 'active'}`}
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
            onChange={handleMusicVol}
            className="zbh-vol-slider"
          />
        </div>
      </div>

      {/* 4 HORIZONTAL PARALLELOGRAM CHAMFERED PAUSE ACTION BUTTONS (Same Style as Main Menu) */}
      <div className="zbh-buttons-row pause-buttons-row">
        {/* 1. RESUME GAME >> (Fiery Orange) */}
        <button className="zbh-skew-btn zbh-skew-start" onPointerDown={handleResumeSafe}>
          <div className="zbh-skew-inner">
            <div className="zbh-skew-icon-wrap start-icon">
              <svg viewBox="0 0 48 48" className="zbh-btn-svg">
                <circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" strokeWidth="3.5" />
                <polygon points="20,16 32,24 20,32" fill="currentColor" />
                <line x1="24" y1="3" x2="24" y2="10" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="24" y1="38" x2="24" y2="45" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="3" y1="24" x2="10" y2="24" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="38" y1="24" x2="45" y2="24" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="zbh-start-label">RESUME GAME</span>
            <span className="zbh-start-chevrons">
              <svg viewBox="0 0 32 32" width="26" height="26" fill="currentColor">
                <polygon points="4,6 12,6 20,16 12,26 4,26 12,16" />
                <polygon points="14,6 22,6 30,16 22,26 14,26 22,16" />
              </svg>
            </span>
          </div>
        </button>

        {/* 2. AIM ASSIST (Neon Green / Tactical Toggle) */}
        <button
          className={`zbh-skew-btn ${aimOn ? 'zbh-skew-streak' : 'zbh-skew-shop'}`}
          onClick={handleToggleAim}
        >
          <div className="zbh-skew-inner">
            <div className={`zbh-skew-icon-wrap ${aimOn ? 'green-icon' : 'gold-icon'}`}>
              <svg viewBox="0 0 48 48" className="zbh-btn-svg">
                <circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" strokeWidth="3.5" />
                <circle cx="24" cy="24" r="4" fill="currentColor" />
                <line x1="24" y1="4" x2="24" y2="13" stroke="currentColor" strokeWidth="3.5" />
                <line x1="24" y1="35" x2="24" y2="44" stroke="currentColor" strokeWidth="3.5" />
                <line x1="4" y1="24" x2="13" y2="24" stroke="currentColor" strokeWidth="3.5" />
                <line x1="35" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="3.5" />
              </svg>
            </div>
            <div className="zbh-skew-text-col">
              <span className={`zbh-skew-title ${aimOn ? 'green-title' : ''}`}>AIM ASSIST</span>
              <span className={`zbh-skew-sub ${aimOn ? 'green-sub' : 'white-sub'}`}>
                {aimOn ? 'STATUS: ON' : 'STATUS: OFF'}
              </span>
            </div>
          </div>
        </button>

        {/* 3. RESTART RUN (Tactical Blue) */}
        <button className="zbh-skew-btn zbh-skew-missions" onClick={onRestart}>
          <div className="zbh-skew-inner">
            <div className="zbh-skew-icon-wrap blue-icon">
              <svg viewBox="0 0 48 48" className="zbh-btn-svg">
                <path
                  fill="currentColor"
                  d="M24 8V2L14 12l10 10v-6c7.73 0 14 6.27 14 14s-6.27 14-14 14-14-6.27-14-14H6c0 9.94 8.06 18 18 18s18-8.06 18-18S33.94 8 24 8z"
                />
              </svg>
            </div>
            <div className="zbh-skew-text-col">
              <span className="zbh-skew-title">RESTART</span>
              <span className="zbh-skew-sub blue-sub">NEW RUN</span>
            </div>
          </div>
        </button>

        {/* 4. MAIN MENU (Crimson Red) */}
        <button className="zbh-skew-btn zbh-skew-inventory" onClick={onMenu}>
          <div className="zbh-skew-inner">
            <div className="zbh-skew-icon-wrap red-icon">
              <svg viewBox="0 0 48 48" className="zbh-btn-svg">
                <path
                  fill="currentColor"
                  d="M20 40V28h8v12h10V24h6L24 6 4 24h6v16h10z"
                />
              </svg>
            </div>
            <div className="zbh-skew-text-col">
              <span className="zbh-skew-title">MAIN MENU</span>
              <span className="zbh-skew-sub white-sub">SAVE & QUIT</span>
            </div>
          </div>
        </button>
      </div>

      {/* BOTTOM CHAMFERED LIVE RUN STATS BAR */}
      <div className="zbh-bottom-stats-bar">
        <div className="zbh-stat-box">
          <svg viewBox="0 0 24 24" className="zbh-stat-icon gold">
            <path
              fill="currentColor"
              d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"
            />
          </svg>
          <span className="lbl">RUN SCORE</span>
          <span className="val gold">{formatLeading(hudData?.score || 0, 7)}</span>
        </div>

        <div className="zbh-stat-divider" />

        <div className="zbh-stat-box">
          <svg viewBox="0 0 24 24" className="zbh-stat-icon cyan">
            <path
              fill="currentColor"
              d="M3 10c2.5-2.5 5.5-2.5 8 0 2.5 2.5 5.5 2.5 8 0l2 2c-3.5 3.5-7.5 3.5-11 0-2-2-4-2-6 0l-1-2zm0 6c2.5-2.5 5.5-2.5 8 0 2.5 2.5 5.5 2.5 8 0l2 2c-3.5 3.5-7.5 3.5-11 0-2-2-4-2-6 0l-1-2z"
            />
          </svg>
          <span className="lbl">CURRENT WAVE</span>
          <span className="val green">WAVE {hudData?.wave || 1}</span>
        </div>

        <div className="zbh-stat-divider" />

        <div className="zbh-stat-box">
          <svg viewBox="0 0 24 24" className="zbh-stat-icon white">
            <path
              fill="currentColor"
              d="M12 2C7.58 2 4 5.58 4 10c0 2.84 1.48 5.34 3.73 6.74L7 19c-.15.46.2.92.68.92h8.64c.48 0 .83-.46.68-.92l-.73-2.26C18.52 15.34 20 12.84 20 10c0-4.42-3.58-8-8-8zm-3 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"
            />
          </svg>
          <span className="lbl">RUN KILLS</span>
          <span className="val gold">{formatLeading(hudData?.kills || 0, 7)}</span>
        </div>
      </div>
    </div>
  );
}
