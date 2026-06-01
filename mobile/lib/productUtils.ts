import { Product, DiscountInfo } from './types';

export function calculateDaysUntilExpiry(expiryDate: string): number {
  try {
    if (!expiryDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    if (isNaN(expiry.getTime())) return 0;
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

function getCategoryModifier(category: Product['category']): number {
  const modifiers: Record<Product['category'], number> = {
    meat: 20,
    fruit: 15,
    dairy: 10,
    'dry-goods': 0,
  };
  return modifiers[category] ?? 0;
}

function getTimeModifier(): number {
  const hour = new Date().getHours();
  if (hour >= 18 && hour <= 21) return 10;
  if (hour >= 15 && hour <= 17) return 5;
  return 0;
}

function getBaseDiscountPercentage(days: number): number {
  if (days <= 0) return 0;
  if (days === 1) return 50;
  if (days === 2) return 30;
  if (days === 3) return 15;
  return 5;
}

export function calculateDiscountInfo(product: Product): DiscountInfo {
  const days = calculateDaysUntilExpiry(product.expiryDate);
  const base = getBaseDiscountPercentage(days);
  const catMod = getCategoryModifier(product.category);
  const timeMod = getTimeModifier();

  const total = Math.min(base + catMod + timeMod, 75);
  const discountedPrice = Math.max(product.originalPrice * (1 - total / 100), 0.01);

  let urgency: DiscountInfo['urgencyLevel'] = 'low';
  if (days <= 0) urgency = 'expired';
  else if (days === 1) urgency = 'critical';
  else if (days === 2) urgency = 'high';
  else if (days === 3) urgency = 'medium';

  return {
    daysUntilExpiry: days,
    discountPercentage: Math.round(total * 10) / 10,
    discountedPrice: Math.round(discountedPrice * 100) / 100,
    urgencyLevel: urgency,
    categoryModifier: catMod,
    timeModifier: timeMod,
    baseDiscount: base,
  };
}
