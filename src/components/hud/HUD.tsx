import React, { useState, useRef } from 'react';

export default function HUD({ engine, hudData, toastMsg, banner }: any) {
  const [knobOffset, setKnobOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastSettingsToggleRef = useRef<number>(0);

  if (!hudData) return null;

  const hpPct = Math.max(0, Math.min(100, (hudData.hp / (hudData.maxHp || 100)) * 100));
  const isLowHp = hpPct < 30;

  const shieldPct = Math.max(0, Math.min(100, ((hudData.shield || 0) / (hudData.maxShield || 100)) * 100));
  const bossPct = hudData.boss ? Math.max(0, Math.min(100, (hudData.boss.hp / hudData.boss.maxHp) * 100)) : 0;

  const handlePauseClick = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const now = Date.now();
    if (now - lastSettingsToggleRef.current < 400) return;
    lastSettingsToggleRef.current = now;

    if (engine && engine.pauseGame) {
      engine.pauseGame();
    } else if ((window as any).ZombieEngine && (window as any).ZombieEngine.pauseGame) {
      (window as any).ZombieEngine.pauseGame();
    } else if (window.dispatchEvent) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyP' }));
    }
  };

  const handleJoystickPointer = (e: React.PointerEvent) => {
    if (hudData?.paused || (engine && engine.isPaused && engine.isPaused())) return;
    if (e.target && (e.target as any).closest && (e.target as any).closest('#settingsBtn, .zbh-tr-settings-btn, #pauseScreen, .zbh-pause-overlay')) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = (e.clientX - centerX) / (rect.width / 2);
    let dy = (e.clientY - centerY) / (rect.height / 2);
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      dx /= dist;
      dy /= dist;
    }
    setKnobOffset({ x: dx * 38, y: dy * 38 });
    if (engine && engine.setJoystick) {
      engine.setJoystick(dx, dy);
    }
  };

  const resetJoystick = () => {
    setKnobOffset({ x: 0, y: 0 });
    if (engine && engine.setJoystick) {
      engine.setJoystick(0, 0);
    }
  };

  const slotLabel = 'PRIMARY';
  const weaponTitle = `${hudData.weapon || 'Assault Rifle'}${hudData.weaponLevel > 1 ? ` LV. ${hudData.weaponLevel}` : ' LV. 1'}`;

  const renderWeaponSilhouette = () => {
    if (hudData.weaponKey === 'shotgun') {
      return (
        <svg viewBox="0 0 88 28" className="zbh-wep-svg">
          <path d="M4 22 L24 14 L26 20 L8 26 Z" fill="#8b5a2b" />
          <rect x="24" y="10" width="22" height="7" rx="1" fill="#4a5560" />
          <rect x="46" y="10" width="38" height="3.2" fill="#788896" />
          <rect x="46" y="14" width="30" height="2.6" fill="#37414a" />
          <rect x="50" y="13.5" width="16" height="4.5" rx="1" fill="#a06832" />
        </svg>
      );
    }
    if (hudData.weaponKey === 'sniper') {
      return (
        <svg viewBox="0 0 88 28" className="zbh-wep-svg">
          <path d="M2 14 L20 12 L20 20 L4 22 Z" fill="#2e3b30" />
          <rect x="20" y="11" width="26" height="6.5" rx="1" fill="#435246" />
          <rect x="22" y="5.5" width="24" height="4" rx="1" fill="#1e262c" />
          <rect x="45" y="5" width="3" height="5" fill="#00e5ff" />
          <path d="M23 17.5 L28 17.5 L26 25 L21 25 Z" fill="#1e262c" />
          <rect x="33" y="17.5" width="8" height="6" fill="#2b343c" />
          <rect x="46" y="12.2" width="36" height="2.6" fill="#8494a4" />
          <rect x="81" y="11" width="5" height="5" rx="0.8" fill="#2b343c" />
        </svg>
      );
    }
    if (hudData.weaponKey === 'minigun') {
      return (
        <svg viewBox="0 0 88 28" className="zbh-wep-svg">
          <rect x="10" y="9" width="28" height="12" rx="2" fill="#36404a" />
          <path d="M22 9 L22 4 L34 4 L34 9" fill="none" stroke="#6c7a86" strokeWidth="2.5" />
          <rect x="18" y="20" width="14" height="6" rx="1.5" fill="#4e5d28" />
          <rect x="38" y="9.5" width="44" height="2.2" fill="#8898a8" />
          <rect x="38" y="13.5" width="44" height="2.2" fill="#687888" />
          <rect x="38" y="17.5" width="44" height="2.2" fill="#8898a8" />
          <rect x="54" y="8.5" width="3.5" height="12" fill="#222a30" />
          <rect x="74" y="8.5" width="4" height="12" fill="#222a30" />
        </svg>
      );
    }
    if (hudData.weaponKey === 'rocket') {
      return (
        <svg viewBox="0 0 88 28" className="zbh-wep-svg">
          <polygon points="2,7 12,10 12,18 2,21" fill="#2a322b" />
          <rect x="12" y="9" width="58" height="10" rx="1.5" fill="#3b5238" />
          <rect x="56" y="9" width="5" height="10" fill="#ffb300" />
          <rect x="28" y="19" width="5" height="6" fill="#1e2428" />
          <rect x="46" y="19" width="5" height="6" fill="#1e2428" />
          <rect x="36" y="5" width="8" height="4" fill="#1e2428" />
          <polygon points="70,8 85,14 70,20" fill="#d32f2f" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 88 28" className="zbh-wep-svg">
        <path d="M4 12 L20 11 L20 18 L6 20 Z" fill="#2f3842" />
        <rect x="20" y="10" width="36" height="7.5" rx="1" fill="#4d5b68" />
        <rect x="28" y="6" width="12" height="4" rx="1" fill="#252d34" />
        <path d="M24 17 L30 17 L27 25 L21 25 Z" fill="#252d34" />
        <path d="M38 17 L44 17 L47 26 L40 26 Z" fill="#323c46" />
        <rect x="56" y="11.5" width="26" height="3.2" fill="#7c8b99" />
      </svg>
    );
  };

  return (
    <>
      {isLowHp && <div className="zbh-low-hp-vignette" />}
      <div id="crosshair"><span /></div>
      <div id="floatingDmgContainer" className="zbh-floating-dmg-layer" />

      {hudData.boss && (
        <div className="zbh-boss-hud-box">
          <div className="zbh-boss-header">
            <span className="zbh-boss-badge">BOSS FIGHT</span>
            <span className="zbh-boss-title">{hudData.boss.name}</span>
            <span className="zbh-boss-hp-num">{Math.ceil(hudData.boss.hp)} / {hudData.boss.maxHp}</span>
          </div>
          <div className="zbh-boss-bar-track">
            <div className="zbh-boss-bar-fill" style={{ width: `${bossPct}%` }} />
          </div>
        </div>
      )}

      {/* TOP LEFT STATUS PANEL */}
      <div className="zbh-tl-status-panel pe">
        <div className="zbh-tl-avatar-col">
          <div className="zbh-tl-avatar-frame">
            <svg viewBox="0 0 64 64" className="zbh-tl-avatar-svg">
              <polygon points="16,12 48,12 52,20 12,20" fill="#4e311d" />
              <rect x="14" y="16" width="36" height="10" fill="#3d2515" />
              <rect x="16" y="22" width="32" height="24" fill="#d6966b" />
              <rect x="38" y="22" width="10" height="24" fill="#ba7b52" />
              <rect x="14" y="20" width="6" height="12" fill="#3d2515" />
              <rect x="44" y="20" width="6" height="12" fill="#2e1b0f" />
              <rect x="20" y="20" width="14" height="5" fill="#4e311d" />
              <rect x="20" y="28" width="8" height="2.5" fill="#331e10" />
              <rect x="36" y="28" width="8" height="2.5" fill="#331e10" />
              <rect x="21" y="32" width="6" height="4" fill="#ffffff" />
              <rect x="23" y="32" width="4" height="4" fill="#14181f" />
              <rect x="37" y="32" width="6" height="4" fill="#ffffff" />
              <rect x="39" y="32" width="4" height="4" fill="#14181f" />
              <rect x="30" y="35" width="4" height="4" fill="#b5744c" />
              <rect x="27" y="41" width="10" height="2.2" fill="#7d482b" />
              <rect x="24" y="46" width="16" height="5" fill="#b87b52" />
              <polygon points="8,50 56,50 60,64 4,64" fill="#1d4b75" />
              <rect x="18" y="51" width="28" height="13" fill="#266094" />
              <rect x="29" y="54" width="6" height="4" fill="#d4956a" />
            </svg>
          </div>
          <div className="zbh-tl-lvl-badge">LVL {hudData.playerLevel || 3}</div>
        </div>

        <div className="zbh-tl-bars-col">
          {/* HEALTH BAR (Neon Green, Red when low) */}
          <div className="zbh-tl-bar-row">
            <span className={`zbh-tl-bar-icon ${isLowHp ? 'danger' : 'hp'}`}>
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </span>
            <div className="zbh-tl-bar-track">
              <div className={`zbh-tl-bar-fill ${isLowHp ? 'danger' : 'hp'}`} style={{ width: `${hpPct}%` }} />
            </div>
            <span className={`zbh-tl-bar-val ${isLowHp ? 'danger' : 'hp'}`}>{Math.ceil(hudData.hp)}</span>
          </div>

          {/* STAMINA BAR (Yellow) */}
          <div className="zbh-tl-bar-row">
            <span className="zbh-tl-bar-icon stamina">
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
              </svg>
            </span>
            <div className="zbh-tl-bar-track">
              <div className="zbh-tl-bar-fill stamina" style={{ width: '100%' }} />
            </div>
            <span className="zbh-tl-bar-val stamina">∞</span>
          </div>

          {/* SHIELD BAR (Blue) */}
          <div className="zbh-tl-bar-row">
            <span className="zbh-tl-bar-icon shield">
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
            </span>
            <div className="zbh-tl-bar-track">
              <div className="zbh-tl-bar-fill shield" style={{ width: `${shieldPct}%` }} />
            </div>
            <span className="zbh-tl-bar-val shield">{Math.ceil(hudData.shield || 0)}</span>
          </div>

          {/* Active Powerups / Companion subtle row if active */}
          {(hudData.overcharge > 0 || hudData.cryo > 0 || (hudData.companion && hudData.companion !== 'none')) && (
            <div className="zbh-hud-mini-tags">
              {hudData.companion && hudData.companion !== 'none' && (
                <span className="zbh-hud-mini-tag comp">
                  {hudData.companion === 'drone'
                    ? 'DRONE'
                    : hudData.companion === 'dog'
                    ? 'DOG'
                    : hudData.companion === 'robot'
                    ? 'ROBOT'
                    : hudData.companion === 'medic'
                    ? 'MEDIC'
                    : 'COMP'}
                  {hudData.companionLevel ? ` LV.${hudData.companionLevel}` : ''}
                  {hudData.companionExtra ? ` [${hudData.companionExtra}]` : ''}
                </span>
              )}
              {hudData.overcharge > 0 && (
                <span className="zbh-hud-mini-tag stamina">2X FIRE {Math.ceil(hudData.overcharge)}s</span>
              )}
              {hudData.cryo > 0 && (
                <span className="zbh-hud-mini-tag comp">CRYO {Math.ceil(hudData.cryo)}s</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* TOP RIGHT WAVE / KILLS / SCORE HUD ROW */}
      <div className="zbh-tr-hud-row pe">
        <div className="zbh-tr-pill">
          <svg viewBox="0 0 24 24" className="zbh-tr-icon gold">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="zbh-tr-text"><strong className="gold-txt">WAVE</strong> {hudData.wave}</span>
        </div>

        <div className="zbh-tr-pill danger">
          <svg viewBox="0 0 24 24" className="zbh-tr-icon red">
            <path fill="currentColor" d="M12 2a9 9 0 0 0-9 9c0 3.1 1.56 5.82 3.95 7.45V21a1 1 0 0 0 1 1h8.1a1 1 0 0 0 1-1v-2.55C19.44 16.82 21 14.1 21 11a9 9 0 0 0-9-9zm-3 8a1.8 1.8 0 1 1 0 3.6A1.8 1.8 0 0 1 9 10zm6 0a1.8 1.8 0 1 1 0 3.6 1.8 1.8 0 0 1 0-3.6zm-3 4.5l1.5 2.5h-3L12 14.5z" />
          </svg>
          <span className="zbh-tr-text red-txt">{hudData.left} LEFT</span>
        </div>

        <div className="zbh-tr-pill">
          <svg viewBox="0 0 24 24" className="zbh-tr-icon blue">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
          </svg>
          <span className="zbh-tr-text">{hudData.score} PTS</span>
        </div>

        <div className="zbh-tr-pill">
          <svg viewBox="0 0 24 24" className="zbh-tr-icon gold">
            <path fill="currentColor" d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z" />
          </svg>
          <span className="zbh-tr-text">{hudData.bones}</span>
        </div>

        <button
          id="settingsBtn"
          className="zbh-tr-settings-btn pe"
          title="Settings (Pauses Game)"
          onPointerDown={handlePauseClick}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style={{ pointerEvents: 'none' }}>
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </button>
      </div>

      <div id="toastWrap">{toastMsg && <div className="toast">{toastMsg}</div>}</div>

      <div id="waveBanner" className={banner ? 'show' : ''}>
        <h2>{banner?.title}</h2>
        <p>{banner?.sub}</p>
      </div>

      {/* TOUCH CONTROLS */}
      <div id="touchControls">
        <div
          id="joystickZone"
          className="pe"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            handleJoystickPointer(e);
          }}
          onPointerMove={(e) => {
            if (e.buttons > 0) handleJoystickPointer(e);
          }}
          onPointerUp={resetJoystick}
          onPointerCancel={resetJoystick}
        >
          <div id="joystickBase">
            <svg viewBox="0 0 140 140" className="zbh-joy-arrows">
              <polygon points="70,12 63,22 77,22" />
              <polygon points="70,128 63,118 77,118" />
              <polygon points="12,70 22,63 22,77" />
              <polygon points="128,70 118,63 118,77" />
            </svg>
          </div>
          <div
            id="joystickKnob"
            style={{ transform: `translate(calc(-50% + ${knobOffset.x}px), calc(-50% + ${knobOffset.y}px))` }}
          />
        </div>

        <div id="firePad" className="pe">
          <div className="zbh-action-btns-row">
            <div
              id="grenadeBtn"
              className={(hudData.grenades || 0) <= 0 ? 'empty' : ''}
              title="Throw Grenade (Key G)"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (engine && engine.throwGrenade) engine.throwGrenade();
              }}
            >
              <svg viewBox="0 0 48 48" className="zbh-grenade-svg">
                <path d="M26 8h6l4 9" fill="none" stroke="#90a4ae" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="20" y="6" width="8" height="5" rx="1" fill="#90a4ae" />
                <rect x="14" y="12" width="20" height="27" rx="9" fill="#78909c" />
                <line x1="14" y1="20" x2="34" y2="20" stroke="#18222c" strokeWidth="2.2" />
                <line x1="14" y1="28" x2="34" y2="28" stroke="#18222c" strokeWidth="2.2" />
                <line x1="24" y1="12" x2="24" y2="39" stroke="#18222c" strokeWidth="2.2" />
              </svg>
              <span className="zbh-grenade-badge">{hudData.grenades || 0}</span>
            </div>

            <div
              id="fireBtn"
              onPointerDown={(e) => {
                e.preventDefault();
                if (engine && engine.fireWeapon) engine.fireWeapon();
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                if (engine && engine.stopFire) engine.stopFire();
              }}
              onPointerLeave={(e) => {
                e.preventDefault();
                if (engine && engine.stopFire) engine.stopFire();
              }}
            >
              <svg viewBox="0 0 48 48" className="zbh-bullet-svg">
                <g transform="rotate(16 24 24)">
                  <path d="M20 16 C20 9, 24 5, 24 5 C24 5, 28 9, 28 16 Z" fill="#aeea00" />
                  <rect x="19.5" y="17.5" width="9" height="19" rx="1.5" fill="#39ff14" />
                  <rect x="19" y="37.5" width="10" height="3.5" rx="1" fill="#76ff03" />
                </g>
              </svg>
            </div>
          </div>

          <button
            id="swapBtn"
            onClick={() => engine && engine.swapWeapon && engine.swapWeapon()}
            title="Swap Primary / Secondary Weapon"
          >
            <div className="zbh-wep-icon-wrap">{renderWeaponSilhouette()}</div>
            <div className="zbh-wep-info-col">
              <div className="zbh-wep-slot-row">
                <span className="zbh-wep-slot-lbl">{slotLabel}</span>
                <span className={`zbh-wep-ammo-tag ${hudData?.isReloading ? 'reloading' : ''}`}>
                  {hudData?.isReloading ? 'RELOADING...' : `${hudData?.ammo ?? 0} / ∞`}
                </span>
              </div>
              <span className="zbh-wep-name-lbl">{weaponTitle}</span>
            </div>
            <div className="zbh-wep-swap-arrow">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
