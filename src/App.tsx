import React, { useState, useEffect, useRef } from 'react';
import { GameEngine } from './game/engine/GameEngine';
import MainMenu from './components/ui/MainMenu';
import PauseScreen from './components/ui/PauseScreen';
import GameOverScreen from './components/ui/GameOverScreen';
import HUD from './components/hud/HUD';
import { loadMeta } from './game/systems/MetaSystem';

type ScreenState = 'menu' | 'game' | 'pause' | 'gameover';

function App() {
  const [screen, setScreen] = useState<ScreenState>('menu');
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<any>(null);

  const [hudData, setHudData] = useState<any>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [banner, setBanner] = useState<any>(null);

  useEffect(() => {
    loadMeta();
    try {
      if (window.screen && (window.screen as any).orientation && (window.screen as any).orientation.lock) {
        (window.screen as any).orientation.lock('landscape').catch(() => {});
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (gameContainerRef.current && !engine) {
      const eng = new GameEngine(gameContainerRef.current, {
        onStateChange: (state: ScreenState) => setScreen(state),
        onHUDUpdate: (data: any) => setHudData(data),
        onToast: (msg: string) => {
          setToastMsg(msg);
          setTimeout(() => setToastMsg(null), 2500);
        },
        onBanner: (title: string, sub: string) => {
          setBanner({ title, sub });
          setTimeout(() => setBanner(null), 2400);
        }
      });
      eng.init();
      setEngine(eng);
    }
  }, []);

  const handleStartGame = () => {
    if (engine) engine.startGame();
  };

  const handleResume = () => {
    if (engine) engine.resumeGame();
  };

  const handleRestart = () => {
    if (engine) {
      engine.quitToMenu();
      setTimeout(() => { engine.startGame(); }, 100);
    }
  };

  const handleMenu = () => {
    if (engine) engine.quitToMenu();
  };

  return (
    <>
      <div id="game" ref={gameContainerRef}></div>
      <div id="ui">
        {(screen === 'game' || screen === 'pause') && (
          <HUD engine={engine} hudData={hudData} toastMsg={toastMsg} banner={banner} />
        )}
        {screen === 'menu' && <MainMenu onPlay={handleStartGame} />}
        {screen === 'pause' && (
          <PauseScreen
            onResume={handleResume}
            onRestart={handleRestart}
            onMenu={handleMenu}
            hudData={hudData}
            engine={engine}
          />
        )}
        {screen === 'gameover' && (
          <GameOverScreen onRestart={handleRestart} onMenu={handleMenu} engine={engine} />
        )}
      </div>
    </>
  );
}

export default App;
