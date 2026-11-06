// Android Native Ads Bridge

export class AdsService {
  static showBanner() {
    if ((window as any).ZombieNative?.showBanner) {
      (window as any).ZombieNative.showBanner();
    } else {
      console.log('[Web Fallback] Show Banner');
    }
  }

  static hideBanner() {
    if ((window as any).ZombieNative?.hideBanner) {
      (window as any).ZombieNative.hideBanner();
    } else {
      console.log('[Web Fallback] Hide Banner');
    }
  }

  static showInterstitial(onClosed: () => void) {
    if ((window as any).ZombieNative?.showInterstitial) {
      (window as any).ZombieOnAdClosed = () => {
        delete (window as any).ZombieOnAdClosed;
        delete (window as any).ZombieOnAdFailedToLoad;
        onClosed();
      };
      (window as any).ZombieOnAdFailedToLoad = () => {
        delete (window as any).ZombieOnAdClosed;
        delete (window as any).ZombieOnAdFailedToLoad;
        onClosed(); // proceed anyway
      };
      (window as any).ZombieNative.showInterstitial();
    } else {
      console.log('[Web Fallback] Show Interstitial');
      setTimeout(onClosed, 500); // Simulate ad delay
    }
  }

  static showRewarded(onRewarded: () => void, onClosed: () => void) {
    if ((window as any).ZombieNative?.showRewarded) {
      let rewarded = false;
      (window as any).ZombieOnRewarded = () => { rewarded = true; };
      (window as any).ZombieOnAdClosed = () => {
        delete (window as any).ZombieOnRewarded;
        delete (window as any).ZombieOnAdClosed;
        delete (window as any).ZombieOnAdFailedToLoad;
        if (rewarded) onRewarded();
        onClosed();
      };
      (window as any).ZombieOnAdFailedToLoad = () => {
        delete (window as any).ZombieOnRewarded;
        delete (window as any).ZombieOnAdClosed;
        delete (window as any).ZombieOnAdFailedToLoad;
        onClosed();
      };
      (window as any).ZombieNative.showRewarded();
    } else {
      console.log('[Web Fallback] Show Rewarded');
      setTimeout(() => {
        onRewarded();
        onClosed();
      }, 1000);
    }
  }
}
