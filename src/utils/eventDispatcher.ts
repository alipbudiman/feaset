// utils/eventDispatcher.ts
// Global event dispatcher untuk auto-refresh system

interface ProductData {
  name?: string;
  stock?: number;
  image?: string;
  product_category?: string;
  product_location?: string;
  visible_to_user?: boolean;
  id_product?: string;
  [key: string]: unknown;
}

export class EventDispatcher {
  private static instance: EventDispatcher;
  private eventTarget: EventTarget;

  private constructor() {
    this.eventTarget = new EventTarget();
  }

  public static getInstance(): EventDispatcher {
    if (!EventDispatcher.instance) {
      EventDispatcher.instance = new EventDispatcher();
    }
    return EventDispatcher.instance;
  }

  // Dispatch events untuk operasi CRUD
  public dispatchProductAdded(productData?: ProductData): void {
    console.log('🆕 Event: Product added', productData);
    const event = new CustomEvent('productAdded', { 
      detail: productData 
    });
    this.eventTarget.dispatchEvent(event);
    
    // Also dispatch general data refresh event
    this.dispatchDataRefresh('productAdded');
  }

  public dispatchProductUpdated(productId: string, productData?: ProductData): void {
    console.log('✏️ Event: Product updated', { productId, productData });
    const event = new CustomEvent('productUpdated', { 
      detail: { productId, productData }
    });
    this.eventTarget.dispatchEvent(event);
    
    // Also dispatch general data refresh event
    this.dispatchDataRefresh('productUpdated');
  }

  public dispatchProductDeleted(productId: string): void {
    console.log('🗑️ Event: Product deleted', { productId });
    const event = new CustomEvent('productDeleted', { 
      detail: { productId }
    });
    this.eventTarget.dispatchEvent(event);
    
    // Also dispatch general data refresh event
    this.dispatchDataRefresh('productDeleted');
  }

  public dispatchDataRefresh(reason?: string): void {
    console.log('🔄 Event: Data refresh requested', { reason });
    const event = new CustomEvent('dataRefresh', { 
      detail: { reason, timestamp: Date.now() }
    });
    this.eventTarget.dispatchEvent(event);
    
    // Also dispatch window events for backward compatibility
    window.dispatchEvent(new CustomEvent('dataRefresh', { 
      detail: { reason, timestamp: Date.now() }
    }));
  }

  // Event listeners
  public onProductAdded(callback: (detail: ProductData) => void): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail);
    };
    
    this.eventTarget.addEventListener('productAdded', handler);
    
    return () => {
      this.eventTarget.removeEventListener('productAdded', handler);
    };
  }

  public onProductUpdated(callback: (detail: { productId: string; productData: ProductData }) => void): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail);
    };
    
    this.eventTarget.addEventListener('productUpdated', handler);
    
    return () => {
      this.eventTarget.removeEventListener('productUpdated', handler);
    };
  }

  public onProductDeleted(callback: (detail: { productId: string }) => void): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail);
    };
    
    this.eventTarget.addEventListener('productDeleted', handler);
    
    return () => {
      this.eventTarget.removeEventListener('productDeleted', handler);
    };
  }

  public onDataRefresh(callback: (detail: { reason?: string; timestamp: number }) => void): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail);
    };
    
    this.eventTarget.addEventListener('dataRefresh', handler);
    
    return () => {
      this.eventTarget.removeEventListener('dataRefresh', handler);
    };
  }

  // Utility untuk clear semua event listeners (untuk cleanup)
  public clearAllListeners(): void {
    this.eventTarget = new EventTarget();
  }
}

// Export singleton instance
export const eventDispatcher = EventDispatcher.getInstance();

// Helper hooks untuk React components
export const useProductEvents = () => {
  return {
    productAdded: (productData?: ProductData) => eventDispatcher.dispatchProductAdded(productData),
    productUpdated: (productId: string, productData?: ProductData) => eventDispatcher.dispatchProductUpdated(productId, productData),
    productDeleted: (productId: string) => eventDispatcher.dispatchProductDeleted(productId),
    dataRefresh: (reason?: string) => eventDispatcher.dispatchDataRefresh(reason)
  };
};
