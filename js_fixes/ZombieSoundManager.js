// Áudio Context Único e Partilhado para Evitar o Limite de Instâncias no Android WebView
function getSharedAudioContext() {
    if (!window.sharedAudioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            window.sharedAudioCtx = new AudioContext({ latencyHint: 'interactive' });
        }
    }
    return window.sharedAudioCtx;
}

// Gerenciador Exclusivo de Áudio MP3 Espacial 3D para Zumbis Normais e Bosses
class SpatialZombieSoundManager {
    constructor() {
        this.normalBuffer = null;
        this.bossBuffer = null;
        this.userInteracted = false;
        this.activeSources = [];
        this.lastNormalPlayTime = 0;
        this.lastBossPlayTime = 0;
        this.initAudioContext();
    }

    initAudioContext() {
        this.audioCtx = getSharedAudioContext();
        if (this.audioCtx && !this.normalBuffer) {
            this.loadAudioFiles();
        }
    }

    async loadAudioFiles() {
        if (!this.audioCtx) return;
        try {
            // 1. Zumbi Normal (dragon-studio-zombie-sound-357975.mp3)
            const normalRes = await fetch('./zombie_ambient.mp3');
            const normalArr = await normalRes.arrayBuffer();
            this.normalBuffer = await this.audioCtx.decodeAudioData(normalArr);

            // 2. Zumbi BOSS (freesound_community-zombie-moans-29924.mp3)
            const bossRes = await fetch('./boss_ambient.mp3');
            const bossArr = await bossRes.arrayBuffer();
            this.bossBuffer = await this.audioCtx.decodeAudioData(bossArr);

            console.log("Áudios MP3 originais puros de zumbis normais e BOSS carregados com sucesso!");
        } catch (e) {
            console.error("Erro ao carregar ficheiros MP3:", e);
        }
    }

    stopAllZombieSounds() {
        if (this.activeSources && this.activeSources.length > 0) {
            this.activeSources.forEach(source => {
                try {
                    source.stop(0);
                    source.disconnect();
                } catch (e) {}
            });
            this.activeSources = [];
        }
    }

    getMasterVolumeMultiplier() {
        try {
            const savedData = localStorage.getItem('neon_deadlands_3d_meta');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                if (parsed) {
                    if (parsed.masterMuted) return 0;
                    const vol = typeof parsed.masterVolume === 'number' ? parsed.masterVolume : 80;
                    return (vol / 100) * 0.65;
                }
            }
        } catch (e) {}
        return 0.52;
    }

    playSpatialZombieSound(dx, dz, dist, isBoss = false) {
        if (!this.audioCtx || !this.userInteracted) return;
        const buffer = isBoss ? this.bossBuffer : this.normalBuffer;
        if (!buffer) return;

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;

        if (this.activeSources.length >= 5) return;

        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = 1.0;

        let pannerNode = null;
        if (this.audioCtx.createStereoPanner) {
            pannerNode = this.audioCtx.createStereoPanner();
            const panValue = Math.max(-1.0, Math.min(1.0, dx / 14.0));
            pannerNode.pan.setValueAtTime(panValue, now);
        }

        const gainNode = this.audioCtx.createGain();
        const baseVol = this.getMasterVolumeMultiplier();
        if (baseVol <= 0) return;

        const maxDist = isBoss ? 45.0 : 32.0;
        const distanceAttenuation = Math.max(0.08, Math.min(1.0, 1.0 - (dist / maxDist)));
        const bossBoost = isBoss ? 1.3 : 1.0;
        const finalVolume = baseVol * distanceAttenuation * bossBoost;

        gainNode.gain.setValueAtTime(finalVolume, now);

        if (pannerNode) {
            source.connect(pannerNode);
            pannerNode.connect(gainNode);
        } else {
            source.connect(gainNode);
        }
        gainNode.connect(this.audioCtx.destination);

        this.activeSources.push(source);
        source.onended = () => {
            const idx = this.activeSources.indexOf(source);
            if (idx !== -1) this.activeSources.splice(idx, 1);
        };

        source.start(now);
    }

    updateSpatialAudio() {
        if (!this.userInteracted) return;

        const isPaused = document.querySelector('.pause-buttons-row, .zbh-pause-audio-panel') !== null;
        const isMenu = document.querySelector('.zbh-title-bone-hunter, .zbh-start-label') !== null;
        const isModalOpen = document.querySelector('.zbh-modal-backdrop') !== null;
        const bodyText = document.body ? document.body.innerText : '';
        const isGameOver = bodyText.includes('GAME OVER') || bodyText.includes('DEFEATED') || bodyText.includes('VICTORY');

        if (isPaused || isMenu || isModalOpen || isGameOver) {
            this.stopAllZombieSounds();
            return;
        }

        if (window.ZombieEngine && typeof window.ZombieEngine.getZombiesSpatialData === 'function') {
            const zombiesData = window.ZombieEngine.getZombiesSpatialData();
            if (zombiesData && zombiesData.length > 0) {
                const now = Date.now();

                const bossZombies = zombiesData.filter(z => z.isBoss);
                const normalZombies = zombiesData.filter(z => !z.isBoss);

                if (bossZombies.length > 0 && now - this.lastBossPlayTime > 2200 + Math.random() * 1500) {
                    this.lastBossPlayTime = now;
                    const closestBoss = bossZombies.sort((a, b) => a.dist - b.dist)[0];
                    this.playSpatialZombieSound(closestBoss.dx, closestBoss.dz, closestBoss.dist, true);
                }

                if (normalZombies.length > 0 && now - this.lastNormalPlayTime > 2000 + Math.random() * 1500) {
                    this.lastNormalPlayTime = now;
                    const chosenNormal = normalZombies[Math.floor(Math.random() * Math.min(3, normalZombies.length))];
                    if (chosenNormal) {
                        this.playSpatialZombieSound(chosenNormal.dx, chosenNormal.dz, chosenNormal.dist, false);
                    }
                }
            } else {
                this.stopAllZombieSounds();
            }
        }
    }
}

// Áudio MP3 de Dano do Jogador (freesound_community-male_hurt7-48124.mp3)
class PlayerHurtSoundManager {
    constructor() {
        this.audioBuffer = null;
        this.initAudioContext();
    }

    initAudioContext() {
        this.audioCtx = getSharedAudioContext();
        if (this.audioCtx && !this.audioBuffer) {
            this.loadHurtMP3();
        }
    }

    async loadHurtMP3() {
        if (!this.audioCtx) return;
        try {
            const res = await fetch('./player_hurt.mp3');
            const arr = await res.arrayBuffer();
            this.audioBuffer = await this.audioCtx.decodeAudioData(arr);
            console.log("Áudio MP3 de dano do jogador carregado com sucesso!");
        } catch (e) {
            console.error("Erro ao carregar MP3 de dano do jogador:", e);
        }
    }

    playHurtSound() {
        if (!this.audioCtx) this.initAudioContext();
        if (!this.audioCtx || !this.audioBuffer) return;

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;

        let volMultiplier = 0.8;
        try {
            const savedData = localStorage.getItem('neon_deadlands_3d_meta');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                if (parsed) {
                    if (parsed.masterMuted) return;
                    const vol = typeof parsed.masterVolume === 'number' ? parsed.masterVolume : 80;
                    volMultiplier = (vol / 100) * 0.95;
                }
            }
        } catch (e) {}

        const source = this.audioCtx.createBufferSource();
        source.buffer = this.audioBuffer;
        source.playbackRate.value = 0.94 + Math.random() * 0.12;

        const gainNode = this.audioCtx.createGain();
        gainNode.gain.setValueAtTime(volMultiplier, now);

        source.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        source.start(now);
    }
}

// Áudio MP3 de Recarregar Arma (reloadsound.mp3) - Volume 5% Mais Baixo
class ReloadSoundManager {
    constructor() {
        this.audioBuffer = null;
        this.initAudioContext();
    }

    initAudioContext() {
        this.audioCtx = getSharedAudioContext();
        if (this.audioCtx && !this.audioBuffer) {
            this.loadReloadMP3();
        }
    }

    async loadReloadMP3() {
        if (!this.audioCtx) return;
        try {
            const res = await fetch('./reloadsound.mp3');
            const arr = await res.arrayBuffer();
            this.audioBuffer = await this.audioCtx.decodeAudioData(arr);
            console.log("Áudio MP3 de recarga de arma carregado com sucesso!");
        } catch (e) {
            console.error("Erro ao carregar MP3 de recarga de arma:", e);
        }
    }

    playReloadSound() {
        if (!this.audioCtx) this.initAudioContext();
        if (!this.audioCtx || !this.audioBuffer) return;

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;

        let volMultiplier = 0.80; // Volume reduzido em 5%
        try {
            const savedData = localStorage.getItem('neon_deadlands_3d_meta');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                if (parsed) {
                    if (parsed.masterMuted) return;
                    const vol = typeof parsed.masterVolume === 'number' ? parsed.masterVolume : 80;
                    volMultiplier = (vol / 100) * 0.90; // Volume reduzido de 0.95 para 0.90
                }
            }
        } catch (e) {}

        const source = this.audioCtx.createBufferSource();
        source.buffer = this.audioBuffer;
        source.playbackRate.value = 1.0;

        const gainNode = this.audioCtx.createGain();
        gainNode.gain.setValueAtTime(volMultiplier, now);

        source.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        source.start(now);
    }
}

// Áudio MP3 de Disparo da Carbine / AK47 (carbine_shoot.mp3) Sincronizado por Bala
class CarbineShootingSoundManager {
    constructor() {
        this.audioBuffer = null;
        this.initAudioContext();
    }

    initAudioContext() {
        this.audioCtx = getSharedAudioContext();
        if (this.audioCtx && !this.audioBuffer) {
            this.loadCarbineMP3();
        }
    }

    async loadCarbineMP3() {
        if (!this.audioCtx) return;
        try {
            const res = await fetch('./carbine_shoot.mp3');
            const arr = await res.arrayBuffer();
            this.audioBuffer = await this.audioCtx.decodeAudioData(arr);
            console.log("Áudio MP3 de tiro da Carbine/AK47 carregado com sucesso!");
        } catch (e) {
            console.error("Erro ao carregar MP3 de tiro da Carbine:", e);
        }
    }

    playShot() {
        if (!this.audioCtx) this.initAudioContext();
        if (!this.audioCtx || !this.audioBuffer) return;

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;

        let volMultiplier = 0.85;
        try {
            const savedData = localStorage.getItem('neon_deadlands_3d_meta');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                if (parsed) {
                    if (parsed.masterMuted) return;
                    const vol = typeof parsed.masterVolume === 'number' ? parsed.masterVolume : 80;
                    volMultiplier = (vol / 100) * 0.90;
                }
            }
        } catch (e) {}

        const source = this.audioCtx.createBufferSource();
        source.buffer = this.audioBuffer;
        source.playbackRate.value = 0.96 + Math.random() * 0.08;

        const gainNode = this.audioCtx.createGain();
        gainNode.gain.setValueAtTime(volMultiplier, now);

        source.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        source.start(now);
    }
}

// Gerenciador da Música de Fundo MP3 (freesound_community-drama-stringsmp3-14627.mp3) via Web Audio API
class BackgroundMusicManager {
    constructor() {
        this.audioBuffer = null;
        this.currentSource = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.initAudioContext();
    }

    initAudioContext() {
        this.audioCtx = getSharedAudioContext();
        if (this.audioCtx && !this.audioBuffer) {
            this.loadMusicMP3();
        }
    }

    async loadMusicMP3() {
        if (!this.audioCtx) return;
        try {
            const res = await fetch('./bg_music.mp3');
            const arr = await res.arrayBuffer();
            this.audioBuffer = await this.audioCtx.decodeAudioData(arr);
            console.log("Música de Fundo MP3 carregada com sucesso!");
        } catch (e) {
            console.error("Erro ao carregar MP3 da música de fundo:", e);
        }
    }

    getMusicVolume() {
        try {
            const savedData = localStorage.getItem('neon_deadlands_3d_meta');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                if (parsed) {
                    if (parsed.musicMuted || parsed.masterMuted) return 0;
                    const vol = typeof parsed.musicVolume === 'number' ? parsed.musicVolume : 80;
                    return (vol / 100) * 0.8;
                }
            }
        } catch (e) {}
        return 0.7;
    }

    playMusic() {
        if (window.isAdActive) return;
        if (!this.audioCtx) this.initAudioContext();
        if (!this.audioCtx || !this.audioBuffer) return;

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const vol = this.getMusicVolume();
        if (vol <= 0) {
            this.stopMusic();
            return;
        }

        if (!this.isPlaying) {
            this.isPlaying = true;
            this.currentSource = this.audioCtx.createBufferSource();
            this.currentSource.buffer = this.audioBuffer;
            this.currentSource.loop = true;

            this.gainNode = this.audioCtx.createGain();
            this.gainNode.gain.setValueAtTime(vol, this.audioCtx.currentTime);

            this.currentSource.connect(this.gainNode);
            this.gainNode.connect(this.audioCtx.destination);

            this.currentSource.start(0);
        } else if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        }
    }

    stopMusic() {
        if (this.isPlaying && this.currentSource) {
            try {
                this.currentSource.stop(0);
                this.currentSource.disconnect();
            } catch (e) {}
            this.currentSource = null;
            this.isPlaying = false;
        }
    }
}

window.ZombieSoundManager = new SpatialZombieSoundManager();
window.playerHurtManager = new PlayerHurtSoundManager();
window.reloadSoundManager = new ReloadSoundManager();
window.carbineSoundManager = new CarbineShootingSoundManager();
window.bgMusicManager = new BackgroundMusicManager();

window.playPlayerHurtSound = () => {
    if (window.playerHurtManager) {
        window.playerHurtManager.playHurtSound();
    }
};

window.playReloadSound = () => {
    if (window.reloadSoundManager) {
        window.reloadSoundManager.playReloadSound();
    }
};

window.playCarbineShotSound = () => {
    if (window.carbineSoundManager) {
        window.carbineSoundManager.playShot();
    }
};

setInterval(() => {
    if (window.isAdActive) {
        if (window.bgMusicManager) window.bgMusicManager.stopMusic();
        if (window.ZombieSoundManager) window.ZombieSoundManager.stopAllZombieSounds();
        return;
    }

    if (window.ZombieSoundManager) {
        window.ZombieSoundManager.updateSpatialAudio();
    }

    const isPaused = document.querySelector('.pause-buttons-row, .zbh-pause-audio-panel') !== null;
    const isMenu = document.querySelector('.zbh-title-bone-hunter, .zbh-start-label') !== null;
    const isModalOpen = document.querySelector('.zbh-modal-backdrop') !== null;
    const bodyText = document.body ? document.body.innerText : '';
    const isGameOver = bodyText.includes('GAME OVER') || bodyText.includes('DEFEATED') || bodyText.includes('VICTORY');

    if (isPaused || isMenu || isModalOpen || isGameOver) {
        if (window.bgMusicManager) {
            window.bgMusicManager.playMusic();
        }
    } else {
        if (window.bgMusicManager) {
            window.bgMusicManager.stopMusic();
        }
    }
}, 100);

const unlockUserInteraction = () => {
    const ctx = getSharedAudioContext();
    if (ctx && ctx.state === 'suspended') {
        ctx.resume();
    }
    if (window.ZombieSoundManager) {
        window.ZombieSoundManager.userInteracted = true;
        window.ZombieSoundManager.initAudioContext();
    }
    if (window.playerHurtManager) {
        window.playerHurtManager.initAudioContext();
    }
    if (window.reloadSoundManager) {
        window.reloadSoundManager.initAudioContext();
    }
    if (window.carbineSoundManager) {
        window.carbineSoundManager.initAudioContext();
    }
    if (window.bgMusicManager) {
        window.bgMusicManager.initAudioContext();
    }
};

window.addEventListener('click', unlockUserInteraction, { once: true });
window.addEventListener('touchstart', unlockUserInteraction, { once: true });
window.addEventListener('pointerdown', unlockUserInteraction, { once: true });
