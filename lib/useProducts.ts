import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from './types';

const STORAGE_KEY = 'freshesave-mobile-products';

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Organic Chicken Breast',
    category: 'meat',
    originalPrice: 12.99,
    expiryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    status: 'pending',
    dateAdded: new Date().toISOString(),
    storeId: 'store-downtown',
  },
  {
    id: 'p2',
    name: 'Fresh Strawberries 1lb',
    category: 'fruit',
    originalPrice: 4.99,
    expiryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    status: 'pending',
    dateAdded: new Date().toISOString(),
    storeId: 'store-downtown',
  },
  {
    id: 'p3',
    name: 'Whole Milk 1gal',
    category: 'dairy',
    originalPrice: 3.49,
    expiryDate: new Date(Date.now() + 259200000).toISOString().split('T')[0],
    status: 'pending',
    dateAdded: new Date().toISOString(),
    storeId: 'store-downtown',
  },
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

  // Load from storage
  useEffect(() => {
    async function load() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setProducts(JSON.parse(stored));
        } else {
          setProducts(DEFAULT_PRODUCTS);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
        }
      } catch (e) {
        setProducts(DEFAULT_PRODUCTS);
      }
      setIsLoaded(true);
    }
    load();
  }, []);

  // Save whenever products change
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products)).catch(() => {});
    }
  }, [products, isLoaded]);

  const storeProducts = products.filter(p => p.storeId === currentStoreId);

  const applySmartDiscount = (productId: string) => {
    setProducts(current =>
      current.map(p => {
        if (p.id === productId) {
          // Simple simulation of discount (in real would use calculateDiscountInfo)
          const discount = p.category === 'meat' ? 45 : p.category === 'fruit' ? 35 : 25;
          const discountedPrice = Math.round(p.originalPrice * (1 - discount / 100) * 100) / 100;
          return {
            ...p,
            status: 'discounted' as const,
            discountedPrice,
            discountPercentage: discount,
          };
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

  const switchStore = (storeId: string) => {
    setCurrentStoreId(storeId);
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
