import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from './types';

const STORAGE_KEY = 'freshsave-mobile-products-v3';
const STORE_KEY = 'freshsave-current-store-v1';

const today = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 86400000).toISOString().split('T')[0];

const DEFAULT_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Organic Chicken Breast', category: 'meat', originalPrice: 12.99, expiryDate: today(0), status: 'pending', dateAdded: new Date().toISOString(), storeId: 'store-downtown' },
  { id: 'p2', name: 'Ground Beef 1lb', category: 'meat', originalPrice: 8.49, expiryDate: today(0), status: 'pending', dateAdded: new Date().toISOString(), storeId: 'store-downtown' },
  { id: 'p3', name: 'Greek Yogurt 32oz', category: 'dairy', originalPrice: 5.99, expiryDate: today(0), status: 'pending', dateAdded: new Date().toISOString(), storeId: 'store-downtown' },
  { id: 'p4', name: 'Fresh Strawberries 1lb', category: 'fruit', originalPrice: 4.99, expiryDate: today(1), status: 'pending', dateAdded: new Date().toISOString(), storeId: 'store-downtown' },
  { id: 'p5', name: 'Salmon Fillet 12oz', category: 'meat', originalPrice: 14.99, expiryDate: today(1), status: 'pending', dateAdded: new Date().toISOString(), storeId: 'store-downtown' },
  { id: 'p6', name: 'Fresh Blueberries 6oz', category: 'fruit', originalPrice: 3.99, expiryDate: today(1), status: 'pending', dateAdded: new Date().toISOString(), storeId: 'store-downtown' },
  { id: 'p7', name: 'Whole Milk 1gal', category: 'dairy', originalPrice: 3.49, expiryDate: today(3), status: 'pending', dateAdded: new Date().toISOString(), storeId: 'store-downtown' },
  { id: 'p8', name: 'Cheddar Cheese 8oz', category: 'dairy', originalPrice: 4.29, expiryDate: today(3), status: 'pending', dateAdded: new Date().toISOString(), storeId: 'store-downtown' },
  { id: 'p9', name: 'Organic Baby Spinach', category: 'fruit', originalPrice: 3.99, expiryDate: today(2), status: 'pending', dateAdded: new Date().toISOString(), storeId: 'store-downtown' },
  { id: 'p10', name: 'Pork Chops 2lb', category: 'meat', originalPrice: 9.99, expiryDate: today(0), status: 'discounted', discountedPrice: 4.99, discountPercentage: 50, dateAdded: new Date().toISOString(), storeId: 'store-downtown' },
  { id: 'p11', name: 'Turkey Breast Sliced', category: 'meat', originalPrice: 7.99, expiryDate: today(1), status: 'pending', dateAdded: new Date().toISOString(), storeId: 'store-westside' },
  { id: 'p12', name: 'Orange Juice 52oz', category: 'dairy', originalPrice: 4.49, expiryDate: today(2), status: 'pending', dateAdded: new Date().toISOString(), storeId: 'store-westside' },
  { id: 'p13', name: 'Bagels 6pk', category: 'dry', originalPrice: 3.99, expiryDate: today(2), status: 'pending', dateAdded: new Date().toISOString(), storeId: 'store-westside' },
  { id: 'p14', name: 'Rotisserie Chicken', category: 'meat', originalPrice: 8.99, expiryDate: today(0), status: 'pending', dateAdded: new Date().toISOString(), storeId: 'store-eastgate' },
  { id: 'p15', name: 'Raspberries 6oz', category: 'fruit', originalPrice: 3.49, expiryDate: today(1), status: 'pending', dateAdded: new Date().toISOString(), storeId: 'store-eastgate' },
  { id: 'p16', name: 'Cream Cheese 8oz', category: 'dairy', originalPrice: 3.99, expiryDate: today(2), status: 'pending', dateAdded: new Date().toISOString(), storeId: 'store-eastgate' },
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
        setProducts(stored ? JSON.parse(stored) : DEFAULT_PRODUCTS);
        if (savedStore) setCurrentStoreId(savedStore);
        if (!stored) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
      } catch (e) {
        setProducts(DEFAULT_PRODUCTS);
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
