// Android Native Billing Bridge

export class BillingService {
  static getProducts(onProducts: (products: any[]) => void) {
    if ((window as any).ZombieNative?.getProducts) {
      (window as any).ZombieOnProductsLoaded = (productsJson: string) => {
        try {
          onProducts(JSON.parse(productsJson));
        } catch(e) {
          onProducts([]);
        }
        delete (window as any).ZombieOnProductsLoaded;
      };
      (window as any).ZombieNative.getProducts();
    } else {
      console.log('[Web Fallback] Get Products');
      onProducts([
        { id: 'bones_pack_small', title: 'Pequeno Pacote de Ossos', price: '0.99€' },
        { id: 'bones_pack_large', title: 'Grande Pacote de Ossos', price: '4.99€' }
      ]);
    }
  }

  static purchaseProduct(productId: string, onSuccess: () => void, onError: (err: string) => void) {
    if ((window as any).ZombieNative?.purchaseProduct) {
      (window as any).ZombieOnPurchaseSuccess = (id: string) => {
        if (id === productId) onSuccess();
        delete (window as any).ZombieOnPurchaseSuccess;
        delete (window as any).ZombieOnPurchaseError;
      };
      (window as any).ZombieOnPurchaseError = (err: string) => {
        onError(err);
        delete (window as any).ZombieOnPurchaseSuccess;
        delete (window as any).ZombieOnPurchaseError;
      };
      (window as any).ZombieNative.purchaseProduct(productId);
    } else {
      console.log('[Web Fallback] Purchase Product', productId);
      setTimeout(() => onSuccess(), 1000);
    }
  }
}
