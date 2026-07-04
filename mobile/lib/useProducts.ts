import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from './types';

// Bumped to v4: v3 stored absolute expiry dates that go stale over time
// (a device seeded days earlier showed "Expires in -4d"). v4 stores an
// expiryOffsetDays on every demo item and recomputes expiryDate on each load.
const STORAGE_KEY = 'freshsave-mobile-products-v4';
const STORE_KEY = 'freshsave-current-store-v1';

const today = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 86400000).toISOString().split('T')[0];

// Recompute expiry dates for seeded demo items relative to "now" so review/demo
// data is always fresh, no matter how long the build waits in the review queue.
const refreshDemoDates = (items: Product[]): Product[] =>
  items.map(p =>
    p.expiryOffsetDays == null ? p : { ...p, expiryDate: today(p.expiryOffsetDays) }
  );

const demo = (
  id: string,
  name: string,
  category: Product['category'],
  originalPrice: number,
  expiryOffsetDays: number,
  storeId: string,
  extra: Partial<Product> = {},
): Product => ({
  id,
  name,
  category,
  originalPrice,
  expiryOffsetDays,
  expiryDate: today(expiryOffsetDays),
  status: 'pending',
  dateAdded: new Date().toISOString(),
  storeId,
  ...extra,
});

const DEFAULT_PRODUCTS: Product[] = [
  demo('p1', 'Organic Chicken Breast', 'meat', 12.99, 0, 'store-downtown'),
  demo('p2', 'Ground Beef 1lb', 'meat', 8.49, 0, 'store-downtown'),
  demo('p3', 'Greek Yogurt 32oz', 'dairy', 5.99, 0, 'store-downtown'),
  demo('p4', 'Fresh Strawberries 1lb', 'fruit', 4.99, 1, 'store-downtown'),
  demo('p5', 'Salmon Fillet 12oz', 'meat', 14.99, 1, 'store-downtown'),
  demo('p6', 'Fresh Blueberries 6oz', 'fruit', 3.99, 1, 'store-downtown'),
  demo('p7', 'Whole Milk 1gal', 'dairy', 3.49, 3, 'store-downtown'),
  demo('p8', 'Cheddar Cheese 8oz', 'dairy', 4.29, 3, 'store-downtown'),
  demo('p9', 'Organic Baby Spinach', 'fruit', 3.99, 2, 'store-downtown'),
  demo('p10', 'Pork Chops 2lb', 'meat', 9.99, 0, 'store-downtown', { status: 'discounted', discountedPrice: 4.99, discountPercentage: 50 }),
  demo('p11', 'Turkey Breast Sliced', 'meat', 7.99, 1, 'store-westside'),
  demo('p12', 'Orange Juice 52oz', 'dairy', 4.49, 2, 'store-westside'),
  demo('p13', 'Bagels 6pk', 'dry-goods', 3.99, 2, 'store-westside'),
  demo('p14', 'Rotisserie Chicken', 'meat', 8.99, 0, 'store-eastgate'),
  demo('p15', 'Raspberries 6oz', 'fruit', 3.49, 1, 'store-eastgate'),
  demo('p16', 'Cream Cheese 8oz', 'dairy', 3.99, 2, 'store-eastgate'),
];

export const STORES = [
  { id: 'store-downtown', name: 'Downtown' },
  { id: 'store-westside', name: 'Westside' },
  { id: 'store-eastgate', name: 'Eastgate' },
];

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentStoreId, setCurrentStoreId] = useState('store-downtown');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [stored, savedStore] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(STORE_KEY),
        ]);
        const base: Product[] = stored ? JSON.parse(stored) : DEFAULT_PRODUCTS;
        const refreshed = refreshDemoDates(base);
        setProducts(refreshed);
        if (savedStore) setCurrentStoreId(savedStore);
        // Persist the date-refreshed set so demo expiries never drift into the past.
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed));
      } catch (e) {
        setProducts(refreshDemoDates(DEFAULT_PRODUCTS));
      }
      setIsLoaded(true);
    }
    load();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products)).catch(() => {});
    }
  }, [products, isLoaded]);

  const switchStore = async (storeId: string) => {
    setCurrentStoreId(storeId);
    await AsyncStorage.setItem(STORE_KEY, storeId);
  };

  const storeProducts = products.filter(p => p.storeId === currentStoreId);

  const applySmartDiscount = (productId: string) => {
    setProducts(current =>
      current.map(p => {
        if (p.id === productId) {
          const discount = p.category === 'meat' ? 50 : p.category === 'fruit' ? 35 : 25;
          const discountedPrice = Math.round(p.originalPrice * (1 - discount / 100) * 100) / 100;
          return { ...p, status: 'discounted' as const, discountedPrice, discountPercentage: discount };
        }
        return p;
      })
    );
  };

  const addProduct = (newProduct: Omit<Product, 'id' | 'dateAdded' | 'status' | 'storeId'>) => {
    const product: Product = {
      ...newProduct,
      id: 'prod-' + Date.now(),
      dateAdded: new Date().toISOString(),
      status: 'pending',
      storeId: currentStoreId,
    };
    setProducts(current => [...current, product]);
  };

  return {
    products: storeProducts,
    allProducts: products,
    currentStoreId,
    currentStore: STORES.find(s => s.id === currentStoreId)!,
    stores: STORES,
    isLoaded,
    applySmartDiscount,
    addProduct,
    switchStore,
  };
}
