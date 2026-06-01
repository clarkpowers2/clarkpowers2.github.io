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
