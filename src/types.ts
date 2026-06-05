/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'owner' | 'cashier';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  description: string;
  image: string; // URL or base64
  base_price: number; // Harga jual
  cost_price: number; // Harga modal/HPP
  stock: number;
  minimum_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_type: 'Size' | 'Temperature' | 'Sugar' | 'Milk' | 'Add-on';
  variant_name: string;
  additional_price: number;
  sku?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  birth_date: string;
  gender: 'Laki-laki' | 'Perempuan' | 'Lainnya' | '';
  member_status: 'member' | 'non-member' | 'regular';
  points?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Discount {
  id: string;
  name: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_member_only: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  transaction_number: string;
  cashier_id: string;
  cashier_name?: string; // Denormalized for easy display
  customer_id: string | null;
  customer_name?: string; // Denormalized for easy display
  subtotal: number;
  discount_id: string | null;
  discount_amount: number;
  tax_amount: number; // 10% or similar
  service_charge: number; // e.g. service fee
  grand_total: number;
  payment_method: 'Cash' | 'QRIS' | 'Debit Card' | 'E-Wallet' | 'Transfer Bank';
  paid_amount: number;
  change_amount: number;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  variant_detail: string; // e.g., "Size: Medium, Temp: Ice"
  quantity: number;
  price: number;
  cost_price: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
}

export type InventoryLogType = 'restock' | 'sale' | 'adjustment' | 'waste' | 'return';

export interface InventoryLog {
  id: string;
  product_id: string;
  product_name?: string; // Denormalized helper
  user_id: string;
  user_name?: string; // Denormalized helper
  type: InventoryLogType;
  quantity_before: number;
  quantity_change: number;
  quantity_after: number;
  notes: string;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name?: string; // Denormalized helper
  action: string;
  description: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}
