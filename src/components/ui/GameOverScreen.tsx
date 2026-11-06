import React, { useEffect, useState } from 'react';
import { meta } from '../../game/systems/MetaSystem';
import { AdsService } from '../../services/ads';

export default function GameOverScreen({ onRestart, onMenu, engine }: any) {
  const [stats, setStats] = useState<any>(null);
  const [reviving, setReviving] = useState<boolean>(false);

  useEffect(() => {
    if (engine && engine.getRunStats) {
      setStats(engine.getRunStats());
    }
  }, [engine]);

  const handleRevive = () => {
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

  const handleRateUs = () => {
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.sarfen1.zombiebonehunter';
    if (window.open) {
      window.open(playStoreUrl, '_blank');
    } else {
      window.location.href = playStoreUrl;
    }
  };

  const canRevive = stats && !stats.revivedOnce;
  const isNewRecord = stats && stats.score >= (meta?.bestScore || 0);

  return (
    <div id="gameOverScreen" className="zbh-modal-backdrop pe" style={{ overflow: 'hidden' }}>
      <div
        className="zbh-modal-card"
        style={{
          overflow: 'hidden',
          justifyContent: 'space-evenly',
          alignItems: 'center',
          textAlign: 'center',
          padding: '12px 32px',
          gap: 8
        }}
      >
        {/* Clean Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <span
            className="zbh-lvl-badge"
            style={{
              fontSize: 10,
              padding: '2px 10px',
              background: isNewRecord ? 'var(--gold)' : '#d32f2f',
              color: isNewRecord ? '#000' : '#fff'
            }}
          >
            {isNewRecord ? '🏆 NEW HIGH SCORE RECORD!' : `BEST RECORD: WAVE ${meta?.bestWave || 1} · ${meta?.bestScore || 0} PTS`}
          </span>
          <h1
            className="zbh-game-title"
            style={{
              fontSize: 'clamp(34px, 6vw, 54px)',
              background: 'linear-gradient(180deg, #ff6b6b 0%, #c62828 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text'
            }}
          >
            GAME OVER
          </h1>
        </div>

        {/* 4-Column Horizontal Run Summary (Zero vertical stacking!) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            width: 'min(860px, 94vw)'
          }}
        >
          <div className="zbh-set-card" style={{ padding: '10px 8px', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 10, color: '#99b89c', fontWeight: 800 }}>WAVE REACHED</span>
            <strong style={{ fontSize: 24, color: 'var(--gold)' }}>{stats?.wave || 1}</strong>
          </div>
          <div className="zbh-set-card" style={{ padding: '10px 8px', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 10, color: '#99b89c', fontWeight: 800 }}>ZOMBIES KILLED</span>
            <strong style={{ fontSize: 24, color: '#ff5252' }}>{stats?.kills || 0}</strong>
          </div>
          <div className="zbh-set-card" style={{ padding: '10px 8px', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 10, color: '#99b89c', fontWeight: 800 }}>TOTAL SCORE</span>
            <strong style={{ fontSize: 24, color: 'var(--green-main)' }}>{stats?.score || 0}</strong>
          </div>
          <div className="zbh-set-card" style={{ padding: '10px 8px', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 10, color: '#99b89c', fontWeight: 800 }}>BONES BANKED</span>
            <strong style={{ fontSize: 24, color: 'var(--gold)' }}>+{stats?.bones || 0} 🦴</strong>
          </div>
        </div>

        {/* Clean Action Buttons Row (No Scroll Needed) */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            width: 'min(860px, 94vw)'
          }}
        >
          {canRevive && (
            <button
              className="zbh-btn"
              style={{
                width: '100%',
                minHeight: 42,
                padding: '8px 16px',
                fontSize: 15,
                background: 'linear-gradient(180deg, #ffd86e 0%, #ff9800 100%)',
                border: '2px solid #fff3c4',
                color: '#000',
                textShadow: 'none'
              }}
              onClick={handleRevive}
              disabled={reviving}
            >
              {reviving ? '⏳ LOADING REVIVE...' : '🎬 REVIVE & CONTINUE WAVE (FREE AD)'}
            </button>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: 10, width: '100%' }}>
            <button
              className="zbh-btn zbh-btn-start"
              style={{ gridRow: 'auto', gridColumn: 'auto', minHeight: 44, fontSize: 16, padding: '8px 14px' }}
              onClick={onRestart}
            >
              🔄 PLAY AGAIN
            </button>
            <button
              className="zbh-btn zbh-btn-shelter"
              style={{ gridRow: 'auto', gridColumn: 'auto', minHeight: 44, fontSize: 15, padding: '8px 14px' }}
              onClick={onMenu}
            >
              🏠 MAIN MENU
            </button>
            <button
              className="zbh-btn zbh-btn-daily ready"
              style={{ gridRow: 'auto', gridColumn: 'auto', minHeight: 44, fontSize: 13, padding: '8px 12px' }}
              onClick={handleRateUs}
            >
              ⭐ RATE US
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
