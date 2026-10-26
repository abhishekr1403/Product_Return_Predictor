// Enum options sourced from backend schemas.py

export const PRODUCT_CATEGORIES = [
  'Beauty', 'Books', 'Electronics', 'Fashion', 'Home', 'Sports', 'Toys',
];

export const SUB_CATEGORIES = [
  'Academic', 'Accessories', 'Action Figures', 'Audio', 'Decor', 'Educational',
  'Fiction', 'Fitness', 'Footwear', 'Furniture', 'Haircare', 'Kids', 'Kitchen',
  'Laptops', 'Makeup', 'Men', 'Mobiles', 'Non-Fiction', 'Outdoor', 'Outdoor Play',
  'Skincare', 'Team Sports', 'Women',
];

export const BRANDS = Array.from({ length: 30 }, (_, i) => `Brand_${i + 1}`);

export const FULFILLMENT_TYPES = ['Marketplace Fulfilled', 'Seller Fulfilled'];

export const PAYMENT_METHODS = ['COD', 'Credit Card', 'Debit Card', 'UPI', 'Wallet'];

// Map risk level to UI configuration
export const RISK_CONFIG = {
  Low: {
    icon: '🛡️',
    colorClass: 'low',
    headline: 'Low Risk',
    description: 'This order is unlikely to be returned. The product profile looks solid.',
    tip: 'Great choice — this product has a low return probability.',
  },
  Medium: {
    icon: '⚠️',
    colorClass: 'medium',
    headline: 'Medium Risk',
    description: 'There is a moderate chance of return. Consider reviewing the factors below.',
    tip: 'Some attributes increase return likelihood — monitor this order.',
  },
  High: {
    icon: '🔴',
    colorClass: 'high',
    headline: 'High Risk',
    description: 'This order has a high probability of being returned. Action recommended.',
    tip: 'High return risk detected — review product quality, delivery and pricing.',
  },
};
