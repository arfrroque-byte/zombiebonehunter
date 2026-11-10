import React, { useEffect, useState } from 'react';
import { loadMeta } from '../../game/systems/MetaSystem';
import { AdsService } from '../../services/ads';

export default function GameOverScreen({ onRestart, onMenu, engine }: any) {
  const [stats, setStats] = useState<any>(null);
  const [metaState, setMetaState] = useState<any>(() => loadMeta());
  const [reviving, setReviving] = useState<boolean>(false);

  useEffect(() => {
    if (engine && engine.getRunStats) {
      setStats(engine.getRunStats());
    }
    setMetaState(loadMeta());
  }, [engine]);

  const handleRevive = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (reviving || !engine?.revivePlayer) return;
    setReviving(true);
    AdsService.showRewarded(
      () => {
        engine.revivePlayer();
      },
      () => {
        setReviving(false);
      }
    );
  };

  const handleRateUs = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.sarfen1.zombiebonehunter';
    if (window.open) {
      window.open(playStoreUrl, '_blank');
    } else {
      window.location.href = playStoreUrl;
    }
  };

  const handlePlayAgain = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRestart) onRestart();
  };

  const handleMainMenu = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMenu) onMenu();
  };

  const canRevive = stats && !stats.revivedOnce;
  const bestWave = Math.max(metaState?.bestWave || 1, stats?.wave || 1);
  const bestScore = Math.max(metaState?.bestScore || 0, stats?.score || 0);

  return (
    <div id="gameOverScreen" className="zbh-gameover-backdrop pe">
      {/* Cinematic Red Glow / Vignette at Top & Bottom */}
      <div className="zbh-gameover-vignette" />

      {/* Atmospheric Moon & Skyline Art */}
      <div className="zbh-gameover-art">
        {/* Glowing Full Moon */}
        <div
          style={{
            position: 'absolute',
            top: '4%',
            right: '17%',
            width: 82,
            height: 82,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #fffde7 0%, #fff59d 45%, #ffd54f 80%, #ffb300 100%)',
            boxShadow: '0 0 32px rgba(255, 235, 120, 0.45), 0 0 80px rgba(255, 190, 60, 0.22)',
            pointerEvents: 'none'
          }}
        >
          <div style={{ position: 'absolute', top: 22, left: 24, width: 14, height: 14, borderRadius: '50%', background: 'rgba(215, 160, 40, 0.26)' }} />
          <div style={{ position: 'absolute', top: 42, left: 45, width: 18, height: 18, borderRadius: '50%', background: 'rgba(215, 160, 40, 0.20)' }} />
          <div style={{ position: 'absolute', top: 48, left: 18, width: 10, height: 10, borderRadius: '50%', background: 'rgba(215, 160, 40, 0.22)' }} />
        </div>

        {/* City Skyline & Windmill Silhouette at Horizon */}
        <svg
          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '36%', pointerEvents: 'none', opacity: 0.45 }}
          viewBox="0 0 1200 300"
          preserveAspectRatio="none"
        >
          {/* Left Skyline */}
          <rect x="40" y="140" width="55" height="160" fill="#030508" />
          <rect x="110" y="80" width="70" height="220" fill="#020305" />
          <rect x="195" y="130" width="60" height="170" fill="#030508" />
          <rect x="270" y="100" width="80" height="200" fill="#020406" />
          <rect x="365" y="150" width="50" height="150" fill="#030508" />
          <rect x="430" y="115" width="90" height="185" fill="#020305" />

          {/* Right Skyline */}
          <rect x="760" y="130" width="65" height="170" fill="#030508" />
          <rect x="840" y="75" width="75" height="225" fill="#020305" />
          <rect x="930" y="125" width="55" height="175" fill="#030508" />

          {/* Windmill Silhouette on the far right */}
          <polygon points="1064,290 1086,290 1078,90 1072,90" fill="#020305" />
          <circle cx="1075" cy="90" r="5" fill="#020305" />
          <line x1="1075" y1="90" x2="1038" y2="35" stroke="#020305" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="1075" y1="90" x2="1112" y2="145" stroke="#020305" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="1075" y1="90" x2="1132" y2="55" stroke="#020305" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="1075" y1="90" x2="1018" y2="125" stroke="#020305" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* Main UI Content Container */}
      <div className="zbh-gameover-content">
        {/* 1. BEST RECORD PILL */}
        <div className="zbh-go-record-pill">
          BEST RECORD: WAVE {bestWave} • {bestScore} PTS
        </div>

        {/* 2. GAME OVER TITLE */}
        <h1 className="zbh-go-title">GAME OVER</h1>

        {/* 3. FOUR COLORED RUN STAT CARDS */}
        <div className="zbh-go-cards-grid">
          {/* Card 1: WAVE REACHED (Cyan) */}
          <div className="zbh-go-card cyan">
            <span className="zbh-go-card-title">WAVE REACHED</span>
            <div className="zbh-go-card-body">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#00e5ff" strokeWidth="2.8" strokeLinecap="round">
                <path d="M2 9c2.4-2 4.8-2 7.2 0s4.8 2 7.2 0 4.8-2 5.6 0" />
                <path d="M2 15c2.4-2 4.8-2 7.2 0s4.8 2 7.2 0 4.8-2 5.6 0" />
              </svg>
              <span className="zbh-go-card-val">{stats?.wave || 1}</span>
            </div>
          </div>

          {/* Card 2: ZOMBIES KILLED (Red) */}
          <div className="zbh-go-card red">
            <span className="zbh-go-card-title">ZOMBIES KILLED</span>
            <div className="zbh-go-card-body">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="#ff1744">
                <path d="M12 2C7.03 2 3 5.8 3 10.5c0 2.9 1.54 5.46 3.9 6.96V21c0 .55.45 1 1 1h8.2c.55 0 1-.45 1-1v-3.54c2.36-1.5 3.9-4.06 3.9-6.96C21 5.8 16.97 2 12 2zm-3.2 7.5h2.4v2.8H8.8V9.5zm6.4 0h-2.4v2.8h2.4V9.5zm-4.4 5.2h2.4L12 17l-1.2-2.3z" />
              </svg>
              <span className="zbh-go-card-val">{stats?.kills || 0}</span>
            </div>
          </div>

          {/* Card 3: TOTAL SCORE (Orange) */}
          <div className="zbh-go-card orange">
            <span className="zbh-go-card-title">TOTAL SCORE</span>
            <div className="zbh-go-card-body">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="#ffab00">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
              </svg>
              <span className="zbh-go-card-val">{stats?.score || 0}</span>
            </div>
          </div>

          {/* Card 4: BONES BANKED (Green) */}
          <div className="zbh-go-card green">
            <span className="zbh-go-card-title">BONES BANKED</span>
            <div className="zbh-go-card-body">
              <span className="zbh-go-card-val">+{stats?.bones || 0}</span>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="#f5e6cb" style={{ transform: 'rotate(45deg)' }}>
                <path d="M17 10c.7-.7 1.69 0 2.5 0a2.5 2.5 0 1 0 0-5 .5.5 0 0 1-.5-.5 2.5 2.5 0 1 0-5 0c0 .81.7 1.8 0 2.5l-7 7c-.7.7-1.69 0-2.5 0a2.5 2.5 0 0 0 0 5c.28 0 .5.22.5.5a2.5 2.5 0 1 0 5 0c0-.81-.7-1.8 0-2.5Z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 5. BOTTOM 3 ACTION BUTTONS */}
        <div className="zbh-go-actions-row">
          <button className="zbh-go-action-btn orange" onPointerDown={handlePlayAgain}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>PLAY AGAIN</span>
          </button>

          <button className="zbh-go-action-btn slate" onPointerDown={handleMainMenu}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span>MAIN MENU</span>
          </button>

          <button className="zbh-go-action-btn green" onPointerDown={handleRateUs}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#ffd700">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>RATE US</span>
          </button>
        </div>
      </div>
    </div>
  );
}
