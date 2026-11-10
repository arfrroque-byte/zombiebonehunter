let pendingRevivePopupAfterAd = false;
window.isAdActive = false;

// 1. Popup para Reviver o Jogador (REVIVE & CONTINUE WAVE)
export function showRevivePopup() {
    if (document.getElementById('zbh-revive-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'zbh-revive-modal';
    modal.className = 'zbh-modal-backdrop pe';
    modal.style.zIndex = '9999';
    modal.innerHTML = `
        <div class="zbh-modal-card zbh-revive-card" style="max-width:480px;height:auto;margin:auto;border-radius:12px;padding:24px;text-align:center;align-self:center;box-shadow:0 0 30px #39ff1459;border:2px solid #39ff14;">
            <div style="font-size:36px;margin-bottom:8px;">💖</div>
            <h2 style="font-family:Teko,sans-serif;font-size:34px;color:#39ff14;margin-bottom:8px;line-height:1;">REVIVE & CONTINUE WAVE</h2>
            <p style="font-size:13px;color:#cfd8e3;line-height:1.4;margin-bottom:20px;">
                Watch a quick video ad to revive with <strong>FULL HP</strong> and keep your current wave & score progress!
            </p>
            <div style="display:flex;justify-content:center;gap:12px;margin-top:10px;">
                <button id="zbh-revive-ad-btn" class="zbh-btn zbh-btn-daily" style="padding:10px 22px;font-size:18px;">WATCH AD TO REVIVE 🎬</button>
                <button id="zbh-revive-cancel-btn" class="zbh-btn zbh-btn-shelter" style="padding:10px 16px;font-size:16px;">NO THANKS</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeReviveModal = () => {
        const elem = document.getElementById('zbh-revive-modal');
        if (elem) elem.remove();
    };

    // Se recusar reviver ("NO THANKS"), fecha o popup de reviver e exibe o Popup Rate Us
    document.getElementById('zbh-revive-cancel-btn').onclick = () => {
        closeReviveModal();
        setTimeout(showRateUsPopup, 400);
    };

    // Se aceitar reviver ("WATCH AD TO REVIVE")
    document.getElementById('zbh-revive-ad-btn').onclick = () => {
        closeReviveModal();
        if (window.ZombieNative && window.ZombieNative.showRewarded) {
            window.ZombieNative.showRewarded();
        } else {
            if (window.ZombieEngine && window.ZombieEngine.revivePlayer) {
                window.ZombieEngine.revivePlayer();
            }
        }
    };
}

// 2. Popup para Avaliar na Google Play (Rate Us)
export function showRateUsPopup() {
    if (document.getElementById('zbh-rate-us-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'zbh-rate-us-modal';
    modal.className = 'zbh-modal-backdrop pe';
    modal.style.zIndex = '9999';
    modal.innerHTML = `
        <div class="zbh-modal-card zbh-rate-card" style="max-width:480px;height:auto;margin:auto;border-radius:12px;padding:24px;text-align:center;align-self:center;box-shadow:0 0 30px #ffae0059;border:2px solid #ffae00;">
            <div style="font-size:32px;margin-bottom:8px;color:#ffc400;">⭐⭐⭐⭐⭐</div>
            <h2 style="font-family:Teko,sans-serif;font-size:32px;color:#ffae00;margin-bottom:8px;">RATE US ON GOOGLE PLAY</h2>
            <p style="font-size:13px;color:#cfd8e3;line-height:1.4;margin-bottom:18px;">
                Enjoying <strong>Zombie Bone Hunter</strong>? Please rate us 5 stars on Google Play to support future game updates and new weapons!
            </p>
            <div style="display:flex;justify-content:center;gap:12px;margin-top:10px;">
                <button id="zbh-rate-now-btn" class="zbh-btn zbh-btn-start" style="padding:10px 24px;font-size:18px;">RATE NOW ➔</button>
                <button id="zbh-rate-close-btn" class="zbh-btn zbh-btn-shelter" style="padding:10px 16px;font-size:16px;">LATER</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closePopup = () => {
        const elem = document.getElementById('zbh-rate-us-modal');
        if (elem) elem.remove();
    };

    document.getElementById('zbh-rate-close-btn').onclick = closePopup;

    document.getElementById('zbh-rate-now-btn').onclick = () => {
        closePopup();
        if (window.ZombieNative && window.ZombieNative.openPlayStoreRating) {
            window.ZombieNative.openPlayStoreRating();
        } else {
            window.open('https://play.google.com/store/apps/details?id=com.sarfen1.zombiebonehunter', '_blank');
        }
    };
}

export function initAndroidBridge(playerParams, pauseGame, resumeGame) {
    // 1. Quando um anúncio abre -> PARAR A MÚSICA DE FUNDO E OS SONS IMEDIATAMENTE
    window.ZombieOnAdOpened = () => {
        console.log("Anúncio Aberto! Parando música de fundo e efeitos de som...");
        window.isAdActive = true;
        if (pauseGame) pauseGame();
        if (window.bgMusicManager) window.bgMusicManager.stopMusic();
        if (window.ZombieSoundManager) window.ZombieSoundManager.stopAllZombieSounds();
    };

    // 2. Quando o anúncio fecha -> RETOMAR A MÚSICA DE FUNDO
    window.ZombieOnAdClosed = () => {
        console.log("Anúncio Fechado! Retomando áudio...");
        window.isAdActive = false;
        if (resumeGame) resumeGame();
        if (window.bgMusicManager) window.bgMusicManager.playMusic();
        if (pendingRevivePopupAfterAd) {
            pendingRevivePopupAfterAd = false;
            setTimeout(showRevivePopup, 400);
        }
    };

    window.ZombieOnAdFailedToLoad = () => {
        console.log("Falha ao carregar anúncio!");
        window.isAdActive = false;
        if (pendingRevivePopupAfterAd) {
            pendingRevivePopupAfterAd = false;
            setTimeout(showRevivePopup, 400);
        }
    };

    // 3. Quando o jogador morre (Game Over) -> Anúncio Fullscreen primeiro
    window.ZombieOnPlayerDied = () => {
        console.log("Jogador morreu! Exibindo anúncio do AdMob...");
        pendingRevivePopupAfterAd = true;
        if (window.ZombieNative && window.ZombieNative.showInterstitial) {
            window.ZombieNative.showInterstitial();
        } else {
            pendingRevivePopupAfterAd = false;
            setTimeout(showRevivePopup, 500);
        }
    };

    // 4. Recompensa do Vídeo -> Reviver o Jogador
    window.ZombieOnRewarded = () => {
        pendingRevivePopupAfterAd = false; // Fix: Evita que o popup de revive reapareça depois de ver o anúncio
        console.log("Vídeo assistido com sucesso! Revivendo jogador...");
        if (window.ZombieEngine && window.ZombieEngine.revivePlayer) {
            window.ZombieEngine.revivePlayer();
        }
        if (playerParams && playerParams.addBones) {
            playerParams.addBones(50);
        }
    };

    // 5. Quando a Loja Google Play estiver pronta
    window.ZombieOnBillingReady = (isReady) => {
        if (isReady && window.ZombieNative) {
            console.log("Google Play conectada. Buscando produtos...");
            window.ZombieNative.getProducts();
        }
    };

    // 6. Sucesso ao comprar pacote de ossos
    window.ZombieOnPurchaseSuccess = (productId) => {
        if (playerParams && playerParams.addBones) {
            if (productId === 'bones_pack_small') {
                playerParams.addBones(1000);
            } else if (productId === 'bones_pack_medium') {
                playerParams.addBones(5000);
            } else if (productId === 'bones_pack_large') {
                playerParams.addBones(15000);
            }
        }
    };
}
