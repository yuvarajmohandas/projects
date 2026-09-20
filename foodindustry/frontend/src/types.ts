export type Role = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  productCount?: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  unit: string;
  price: number;
  vatRate: number;
  allergens: string[];
  imageEmoji: string;
  stockQty: number;
  isActive: boolean;
  categoryId: string;
  category?: Category;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
  isDefault: boolean;
}

export type FulfillmentType = 'DELIVERY' | 'PICKUP';
export type PaymentMethod = 'CASH_ON_RECEIPT' | 'CARD_ON_RECEIPT';
export type OrderStatus = 'PLACED' | 'PREPARING' | 'READY_OR_OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  userId: string;
  fulfillmentType: FulfillmentType;
  slotLabel: string;
  deliveryAddressId: string | null;
  deliveryAddress?: Address | null;
  promoCodeId: string | null;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  validFrom: string | null;
  validUntil: string | null;
  usageLimit: number | null;
  usageCount: number;
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  qty: number;
}

export type HomepageSectionType = 'hero' | 'image-text' | 'categories' | 'products' | 'spacer';

export interface HomepageSection {
  id: string;
  type: HomepageSectionType;
  sortOrder: number;
  isActive: boolean;
  content: {
    title?: string;
    description?: string;
    imageUrl?: string;
    buttonText?: string;
    buttonLink?: string;
  };
}

export interface HomepageLayout {
  sections: HomepageSection[];
  header: {
    order: string[];
    alignment: 'left' | 'center' | 'right';
  };
}
