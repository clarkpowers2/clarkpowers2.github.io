export type ProductCategory = 'fruit' | 'dairy' | 'meat' | 'dry-goods';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  originalPrice: number;
  expiryDate: string;
  status: 'pending' | 'discounted' | 'labeled' | 'sold';
  dateAdded: string;
  storeId: string;
  discountedPrice?: number;
  discountPercentage?: number;
  /**
   * Demo-only: days-from-now this item should expire. When present, expiryDate
   * is recomputed relative to the current date on every app load so seeded
   * demo/review data never goes stale (e.g. "Expires in -4d") while a build
   * sits in the App Store review queue.
   */
  expiryOffsetDays?: number;
}

export interface DiscountInfo {
  daysUntilExpiry: number;
  discountPercentage: number;
  discountedPrice: number;
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low' | 'expired';
  categoryModifier: number;
  timeModifier: number;
  baseDiscount?: number;
}
