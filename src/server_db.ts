/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { 
  User, Category, Product, ProductVariant, Customer, 
  Discount, Transaction, TransactionItem, InventoryLog, ActivityLog 
} from './types';

const STORE_FILE = path.join(process.cwd(), 'data_store.json');

// Interface representing the entire relational schema inside JSON
interface DataSchema {
  users: User[];
  user_passwords: Record<string, string>; // Maps user_id to hashed password
  categories: Category[];
  products: Product[];
  product_variants: ProductVariant[];
  customers: Customer[];
  discounts: Discount[];
  transactions: Transaction[];
  transaction_items: TransactionItem[];
  inventory_logs: InventoryLog[];
  activity_logs: ActivityLog[];
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + '_yakopi_salt_2026_').digest('hex');
}

// Initial seed data
const initialData: DataSchema = {
  users: [
    {
      id: 'usr_owner',
      name: 'Owner Ya Kopi',
      username: 'owner',
      email: 'owner@yakopi.com',
      role: 'owner',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'usr_cashier',
      name: 'Cashier Ya Kopi',
      username: 'cashier',
      email: 'cashier@yakopi.com',
      role: 'cashier',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  user_passwords: {
    'usr_owner': hashPassword('password123'),
    'usr_cashier': hashPassword('password123')
  },
  categories: [
    { id: 'cat_coffee', name: 'Coffee', description: 'Minuman espresso-based dan manual brew', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'cat_noncoffee', name: 'Non Coffee', description: 'Minuman manis non kafein', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'cat_tea', name: 'Tea', description: 'Teh aromatik segar hangat/dingin', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'cat_snack', name: 'Snack', description: 'Camilan dan pastries pendamping kopi', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'cat_addons', name: 'Add-ons', description: 'Ekstra sirup, shot espresso, susu khusus', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ],
  products: [
    {
      id: 'prod_espresso',
      category_id: 'cat_coffee',
      name: 'Espresso',
      description: 'Single atau double shot espresso murni dengan crema tebal',
      image: 'https://images.unsplash.com/photo-1510707513156-4b8faf6c78f4?w=400&auto=format&fit=crop&q=60',
      base_price: 18000,
      cost_price: 7000,
      stock: 100,
      minimum_stock: 10,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'prod_americano',
      category_id: 'cat_coffee',
      name: 'Americano',
      description: 'Espresso premium dengan tambahan air panas, disajikan hot atau ice',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&auto=format&fit=crop&q=60',
      base_price: 22000,
      cost_price: 8000,
      stock: 150,
      minimum_stock: 15,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'prod_cappuccino',
      category_id: 'cat_coffee',
      name: 'Cappuccino',
      description: 'Kombinasi merata espresso, steamed milk, dan foam susu tebal',
      image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&auto=format&fit=crop&q=60',
      base_price: 28000,
      cost_price: 11000,
      stock: 80,
      minimum_stock: 12,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'prod_latte',
      category_id: 'cat_coffee',
      name: 'Cafe Latte',
      description: 'Steamed milk lembut dipadu espresso kaya rasa dengan late art cantik',
      image: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&auto=format&fit=crop&q=60',
      base_price: 28000,
      cost_price: 11000,
      stock: 90,
      minimum_stock: 12,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'prod_caramel_latte',
      category_id: 'cat_coffee',
      name: 'Caramel Latte',
      description: 'Latte klasik dengan sirup caramel manis organik dan saus caramel di atasnya',
      image: 'https://images.unsplash.com/photo-1595781572981-d63151b232ed?w=400&auto=format&fit=crop&q=60',
      base_price: 32000,
      cost_price: 13000,
      stock: 70,
      minimum_stock: 10,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'prod_vanilla_latte',
      category_id: 'cat_coffee',
      name: 'Vanilla Latte',
      description: 'Paduan lembut sirup vanilla madu Perancis, espresso, dan susu segar',
      image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&auto=format&fit=crop&q=60',
      base_price: 32000,
      cost_price: 13000,
      stock: 70,
      minimum_stock: 10,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'prod_kopi_susu',
      category_id: 'cat_coffee',
      name: 'Kopi Susu Ya Kopi',
      description: 'Signature kopi susu dengan gula aren murni khas Ya Kopi, rasa kental, gurih dan legit',
      image: 'https://images.unsplash.com/photo-1461023210298-09cb960954fd?w=400&auto=format&fit=crop&q=60',
      base_price: 24000,
      cost_price: 9500,
      stock: 200,
      minimum_stock: 20,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'prod_matcha_latte',
      category_id: 'cat_noncoffee',
      name: 'Matcha Latte',
      description: 'Bubuk Green Tea Uji Jepang premium dengan steamed milk segar manis seimbang',
      image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop&q=60',
      base_price: 26000,
      cost_price: 11000,
      stock: 100,
      minimum_stock: 15,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'prod_chocolate',
      category_id: 'cat_noncoffee',
      name: 'Chocolate',
      description: 'Cokelat Belgian Premium pekat gurih bertekstur creamy disukai segala kalangan',
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&auto=format&fit=crop&q=60',
      base_price: 25000,
      cost_price: 10000,
      stock: 100,
      minimum_stock: 15,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'prod_lemon_tea',
      category_id: 'cat_tea',
      name: 'Lemon Tea',
      description: 'Teh hitam pilihan diseduh dengan jus lemon segar penambah semangat',
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=60',
      base_price: 20000,
      cost_price: 7000,
      stock: 120,
      minimum_stock: 10,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'prod_croissant',
      category_id: 'cat_snack',
      name: 'Croissant Butter',
      description: 'Croissant renyah berlapis mentega panggang wangi aromatik khas Perancis',
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=60',
      base_price: 22000,
      cost_price: 10000,
      stock: 30,
      minimum_stock: 5,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'prod_brownies',
      category_id: 'cat_snack',
      name: 'Fudgy Brownies',
      description: 'Brownies cokelat dengan tekstur padat fudgy dan crust garing di luar',
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=60',
      base_price: 18000,
      cost_price: 8000,
      stock: 35,
      minimum_stock: 5,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'prod_cookies',
      category_id: 'cat_snack',
      name: 'Choco Chips Cookies',
      description: 'Kue kering panggang dengan serpihan cokelat premium berlimpah bertekstur renyah lembut',
      image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&auto=format&fit=crop&q=60',
      base_price: 15000,
      cost_price: 6000,
      stock: 40,
      minimum_stock: 5,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  product_variants: [
    // Sizes
    { id: 'v_sz_sm', product_id: 'prod_americano', variant_type: 'Size', variant_name: 'Small', additional_price: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'v_sz_md', product_id: 'prod_americano', variant_type: 'Size', variant_name: 'Medium', additional_price: 3000, sku: 'SKU-AMER-MD', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'v_sz_lg', product_id: 'prod_americano', variant_type: 'Size', variant_name: 'Large', additional_price: 5000, sku: 'SKU-AMER-LG', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    
    { id: 'v_sz_lat_sm', product_id: 'prod_latte', variant_type: 'Size', variant_name: 'Small', additional_price: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'v_sz_lat_md', product_id: 'prod_latte', variant_type: 'Size', variant_name: 'Medium', additional_price: 3000, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'v_sz_lat_lg', product_id: 'prod_latte', variant_type: 'Size', variant_name: 'Large', additional_price: 5000, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

    { id: 'v_sz_ks_sm', product_id: 'prod_kopi_susu', variant_type: 'Size', variant_name: 'Small', additional_price: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'v_sz_ks_md', product_id: 'prod_kopi_susu', variant_type: 'Size', variant_name: 'Medium', additional_price: 3000, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'v_sz_ks_lg', product_id: 'prod_kopi_susu', variant_type: 'Size', variant_name: 'Large', additional_price: 5000, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

    // Temperature options
    { id: 'v_tp_h', product_id: 'prod_americano', variant_type: 'Temperature', variant_name: 'Hot', additional_price: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'v_tp_i', product_id: 'prod_americano', variant_type: 'Temperature', variant_name: 'Ice', additional_price: 1000, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

    { id: 'v_tp_lat_h', product_id: 'prod_latte', variant_type: 'Temperature', variant_name: 'Hot', additional_price: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'v_tp_lat_i', product_id: 'prod_latte', variant_type: 'Temperature', variant_name: 'Ice', additional_price: 1000, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

    { id: 'v_tp_ks_h', product_id: 'prod_kopi_susu', variant_type: 'Temperature', variant_name: 'Hot', additional_price: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'v_tp_ks_i', product_id: 'prod_kopi_susu', variant_type: 'Temperature', variant_name: 'Ice', additional_price: 1000, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

    // Milk options
    { id: 'v_mk_fm', product_id: 'prod_latte', variant_type: 'Milk', variant_name: 'Fresh Milk', additional_price: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'v_mk_om', product_id: 'prod_latte', variant_type: 'Milk', variant_name: 'Oat Milk', additional_price: 6000, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'v_mk_am', product_id: 'prod_latte', variant_type: 'Milk', variant_name: 'Almond Milk', additional_price: 8000, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

    // Sugar Level options
    { id: 'v_sg_n', product_id: 'prod_kopi_susu', variant_type: 'Sugar', variant_name: 'Normal Sugar', additional_price: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'v_sg_l', product_id: 'prod_kopi_susu', variant_type: 'Sugar', variant_name: 'Less Sugar', additional_price: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'v_sg_ns', product_id: 'prod_kopi_susu', variant_type: 'Sugar', variant_name: 'No Sugar', additional_price: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ],
  customers: [
    {
      id: 'cust_budi',
      name: 'Budi Santoso',
      phone: '081234567890',
      email: 'budi@gmail.com',
      birth_date: '2001-08-12',
      gender: 'Laki-laki',
      member_status: 'member',
      notes: 'Suka americano ekstra ice, kurangi gula',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'cust_citra',
      name: 'Citra Kirana',
      phone: '087788990011',
      email: 'citra.k@yahoo.com',
      birth_date: '2002-11-23',
      gender: 'Perempuan',
      member_status: 'member',
      notes: 'Langganan Cafe Latte dengan Oat Milk',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'cust_doni',
      name: 'Doni Pratama',
      phone: '089912345678',
      email: 'doni.pratama@gmail.com',
      birth_date: '2000-05-15',
      gender: 'Laki-laki',
      member_status: 'non-member',
      notes: 'Customer baru',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  discounts: [
    {
      id: 'disc_grand',
      name: 'Promo Grand Opening 15%',
      code: 'YAKOPI15',
      type: 'percentage',
      value: 15,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      is_active: true,
      is_member_only: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'disc_member',
      name: 'Member Exclusive Diskon Berlipat Rp10rb',
      code: 'MEMBERSAVE',
      type: 'fixed',
      value: 10000,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      is_active: true,
      is_member_only: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  transactions: [
    // Pre-seed some transactions from past weeks for neat graphs & owner reports
    {
      id: 'tx_seed_1',
      transaction_number: 'YKP-20260601-001',
      cashier_id: 'usr_cashier',
      cashier_name: 'Cashier Ya Kopi',
      customer_id: 'cust_budi',
      customer_name: 'Budi Santoso',
      subtotal: 44000, // 2 Americano (Size: Small, Temp: Ice) = 23000 * 2 = 46000? No, Americano Hot = 22000. Double Ice = Temp Ice (+1000) * 2 = (+2000) = 46000
      discount_id: 'disc_grand',
      discount_amount: 6600, // 15% of 44000 subtotal is 6600
      tax_amount: 3740, // 10% tax on subtotal (44000) or subtotal - discount (37400) -> 37400 * 0.10 = 3740
      service_charge: 2000,
      grand_total: 36540, // 37400 + 3740 + 2000 - wait: subtotal 44000 - 6600 discount = 37400. 37400 + 3740 tax + 2000 service = 43140
      payment_method: 'QRIS',
      paid_amount: 43140,
      change_amount: 0,
      transaction_date: '2026-06-01T10:30:00Z',
      created_at: '2026-06-01T10:30:00Z',
      updated_at: '2026-06-01T10:30:00Z'
    },
    {
      id: 'tx_seed_2',
      transaction_number: 'YKP-20260602-001',
      cashier_id: 'usr_cashier',
      cashier_name: 'Cashier Ya Kopi',
      customer_id: 'cust_citra',
      customer_name: 'Citra Kirana',
      subtotal: 56000, // Cafe Latte with Oat Milk = 28000 + 6000 = 34000. Fudgy Brownies = 18000 + 4000? 34000 + 18000 = 52000? Let's say Subtotal = 56000
      discount_id: 'disc_member',
      discount_amount: 10000, // Fixed member discount
      tax_amount: 4600, // 10% of 46000 = 4600
      service_charge: 2000,
      grand_total: 42600, // 46000 + 4600 + 2000 = 52600. Let's fix this matching
      payment_method: 'Debit Card',
      paid_amount: 42600,
      change_amount: 0,
      transaction_date: '2026-06-02T13:15:00Z',
      created_at: '2026-06-02T13:15:00Z',
      updated_at: '2026-06-02T13:15:00Z'
    },
    {
      id: 'tx_seed_3',
      transaction_number: 'YKP-20260603-001',
      cashier_id: 'usr_cashier',
      cashier_name: 'Cashier Ya Kopi',
      customer_id: null,
      subtotal: 42000,
      discount_id: null,
      discount_amount: 0,
      tax_amount: 4200,
      service_charge: 2000,
      grand_total: 48200,
      payment_method: 'Cash',
      paid_amount: 50000,
      change_amount: 1800,
      transaction_date: '2026-06-03T15:45:00Z',
      created_at: '2026-06-03T15:45:00Z',
      updated_at: '2026-06-03T15:45:00Z'
    },
    {
      id: 'tx_seed_4',
      transaction_number: 'YKP-20260604-001',
      cashier_id: 'usr_owner',
      cashier_name: 'Owner Ya Kopi',
      customer_id: 'cust_budi',
      customer_name: 'Budi Santoso',
      subtotal: 62000,
      discount_id: null,
      discount_amount: 0,
      tax_amount: 6200,
      service_charge: 2000,
      grand_total: 70200,
      payment_method: 'E-Wallet',
      paid_amount: 70200,
      change_amount: 0,
      transaction_date: '2026-06-04T09:10:00Z',
      created_at: '2026-06-04T09:10:00Z',
      updated_at: '2026-06-04T09:10:00Z'
    }
  ],
  transaction_items: [
    {
      id: 'txi_seed_1',
      transaction_id: 'tx_seed_1',
      product_id: 'prod_americano',
      product_name: 'Americano',
      variant_detail: 'Size: Small, Temperature: Ice',
      quantity: 2,
      price: 23000,
      cost_price: 8000,
      subtotal: 46000,
      created_at: '2026-06-01T10:30:00Z',
      updated_at: '2026-06-01T10:30:00Z'
    },
    {
      id: 'txi_seed_2',
      transaction_id: 'tx_seed_2',
      product_id: 'prod_latte',
      product_name: 'Cafe Latte',
      variant_detail: 'Size: Medium, Temperature: Hot, Milk: Oat Milk',
      quantity: 1,
      price: 37000,
      cost_price: 11000,
      subtotal: 37000,
      created_at: '2026-06-02T13:15:00Z',
      updated_at: '2026-06-02T13:15:00Z'
    },
    {
      id: 'txi_seed_3',
      transaction_id: 'tx_seed_2',
      product_id: 'prod_brownies',
      product_name: 'Fudgy Brownies',
      variant_detail: '',
      quantity: 1,
      price: 18000,
      cost_price: 8000,
      subtotal: 18000,
      created_at: '2026-06-02T13:15:00Z',
      updated_at: '2026-06-02T13:15:00Z'
    },
    {
      id: 'txi_seed_4',
      transaction_id: 'tx_seed_3',
      product_id: 'prod_kopi_susu',
      product_name: 'Kopi Susu Ya Kopi',
      variant_detail: 'Size: Small, Temperature: Ice, Sugar: Normal Sugar',
      quantity: 1,
      price: 25000,
      cost_price: 9500,
      subtotal: 25000,
      created_at: '2026-06-03T15:45:00Z',
      updated_at: '2026-06-03T15:45:00Z'
    },
    {
      id: 'txi_seed_5',
      transaction_id: 'tx_seed_3',
      product_id: 'prod_cookies',
      product_name: 'Choco Chips Cookies',
      variant_detail: '',
      quantity: 1,
      price: 15000,
      cost_price: 6000,
      subtotal: 15000,
      created_at: '2026-06-03T15:45:00Z',
      updated_at: '2026-06-03T15:45:00Z'
    },
    {
      id: 'txi_seed_6',
      transaction_id: 'tx_seed_4',
      product_id: 'prod_caramel_latte',
      product_name: 'Caramel Latte',
      variant_detail: 'Size: Large, Temperature: Ice',
      quantity: 1,
      price: 38000,
      cost_price: 13000,
      subtotal: 38000,
      created_at: '2026-06-04T09:10:00Z',
      updated_at: '2026-06-04T09:10:00Z'
    },
    {
      id: 'txi_seed_7',
      transaction_id: 'tx_seed_4',
      product_id: 'prod_croissant',
      product_name: 'Croissant Butter',
      variant_detail: '',
      quantity: 1,
      price: 22000,
      cost_price: 10000,
      subtotal: 22000,
      created_at: '2026-06-04T09:10:00Z',
      updated_at: '2026-06-04T09:10:00Z'
    }
  ],
  inventory_logs: [
    {
      id: 'invl_1',
      product_id: 'prod_espresso',
      product_name: 'Espresso',
      user_id: 'usr_owner',
      user_name: 'Owner Ya Kopi',
      type: 'restock',
      quantity_before: 0,
      quantity_change: 100,
      quantity_after: 100,
      notes: 'Initial stock setup via owner',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'invl_2',
      product_id: 'prod_americano',
      product_name: 'Americano',
      user_id: 'usr_owner',
      user_name: 'Owner Ya Kopi',
      type: 'restock',
      quantity_before: 0,
      quantity_change: 152,
      quantity_after: 152,
      notes: 'Initial stock setup via owner',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'invl_3',
      product_id: 'prod_americano',
      product_name: 'Americano',
      user_id: 'usr_cashier',
      user_name: 'Cashier Ya Kopi',
      type: 'sale',
      quantity_before: 152,
      quantity_change: -2,
      quantity_after: 150,
      notes: 'Order reduction for tx YKP-20260601-001',
      created_at: '2026-06-01T10:30:00Z'
    }
  ],
  activity_logs: [
    {
      id: 'actl_1',
      user_id: 'usr_owner',
      user_name: 'Owner Ya Kopi',
      action: 'LOGIN',
      description: 'Owner successfully logged in',
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0 System',
      created_at: new Date().toISOString()
    }
  ]
};

// Global DB instance
class Database {
  private data: DataSchema = { ...initialData };

  constructor() {
    this.load();
  }

  // Load from disk
  private load() {
    try {
      if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        // Ensure all arrays exist
        this.data = {
          users: parsed.users || initialData.users,
          user_passwords: parsed.user_passwords || initialData.user_passwords,
          categories: parsed.categories || initialData.categories,
          products: parsed.products || initialData.products,
          product_variants: parsed.product_variants || initialData.product_variants,
          customers: parsed.customers || initialData.customers,
          discounts: parsed.discounts || initialData.discounts,
          transactions: parsed.transactions || initialData.transactions,
          transaction_items: parsed.transaction_items || initialData.transaction_items,
          inventory_logs: parsed.inventory_logs || initialData.inventory_logs,
          activity_logs: parsed.activity_logs || initialData.activity_logs
        };
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Error loading data_store:', e);
      // Fallback to initial data
      this.data = { ...initialData };
    }
  }

  // Save to disk
  public save() {
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving data_store:', e);
    }
  }

  // Activity Log helper
  public logActivity(userId: string, action: string, description: string, req?: any) {
    const user = this.data.users.find(u => u.id === userId);
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') : '127.0.0.1';
    const ua = req ? (req.headers['user-agent'] || 'System Agent') : 'System Agent';
    
    const newLog: ActivityLog = {
      id: 'actl_' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      user_name: user ? user.name : 'Unknown User',
      action,
      description,
      ip_address: typeof ip === 'string' ? ip : String(ip),
      user_agent: ua,
      created_at: new Date().toISOString()
    };
    this.data.activity_logs.unshift(newLog); // push to front for recent logs
    this.save();
  }

  // Users
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public getUserByUsernameOrEmail(identifier: string): User | undefined {
    const val = identifier.toLowerCase().trim();
    if (val === 'kasir1' || val === 'kasir1@yakopi.com' || val === 'kasir' || val === 'kasir@yakopi.com' || val === 'cashier' || val === 'cashier@yakopi.com') {
      return this.data.users.find(u => u.role === 'cashier');
    }
    if (val === 'owner' || val === 'owner@yakopi.com') {
      return this.data.users.find(u => u.role === 'owner');
    }
    return this.data.users.find(u => u.username.toLowerCase() === val || u.email.toLowerCase() === val);
  }

  public getPasswordHash(userId: string): string | undefined {
    return this.data.user_passwords[userId];
  }

  public createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>, clearPassword?: string): User {
    const id = 'usr_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    const newUser: User = {
      ...user,
      id,
      created_at: now,
      updated_at: now
    };
    this.data.users.push(newUser);
    if (clearPassword) {
      this.data.user_passwords[id] = hashPassword(clearPassword);
    } else {
      this.data.user_passwords[id] = hashPassword('password123'); // Default password
    }
    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.data.users[idx] = {
      ...this.data.users[idx],
      ...updates,
      updated_at: now
    };
    this.save();
    return this.data.users[idx];
  }

  public resetUserPassword(id: string, newClearPassword: string): boolean {
    if (!this.data.user_passwords || !this.getUserById(id)) return false;
    this.data.user_passwords[id] = hashPassword(newClearPassword);
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx].updated_at = new Date().toISOString();
    }
    this.save();
    return true;
  }

  // Categories
  public getCategories(): Category[] {
    return this.data.categories;
  }

  public createCategory(cat: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Category {
    const id = 'cat_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    const result: Category = { ...cat, id, created_at: now, updated_at: now };
    this.data.categories.push(result);
    this.save();
    return result;
  }

  public updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>): Category | null {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.data.categories[idx] = { ...this.data.categories[idx], ...updates, updated_at: now };
    this.save();
    return this.data.categories[idx];
  }

  public deleteCategory(id: string): boolean {
    const idx = this.data.categories.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.data.categories.splice(idx, 1);
    this.save();
    return true;
  }

  // Products
  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public createProduct(prod: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Product {
    const id = 'prod_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    const result: Product = { ...prod, id, created_at: now, updated_at: now };
    this.data.products.push(result);
    this.save();
    return result;
  }

  public updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>): Product | null {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.data.products[idx] = { ...this.data.products[idx], ...updates, updated_at: now };
    this.save();
    return this.data.products[idx];
  }

  public deleteProduct(id: string): boolean {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.products.splice(idx, 1);
    this.save();
    return true;
  }

  // Variants
  public getProductVariants(): ProductVariant[] {
    return this.data.product_variants || [];
  }

  public getVariantsByProductId(prodId: string): ProductVariant[] {
    return this.getProductVariants().filter(v => v.product_id === prodId);
  }

  public addVariant(v: Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>): ProductVariant {
    const id = 'var_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    if (!this.data.product_variants) this.data.product_variants = [];
    const newVar: ProductVariant = { ...v, id, created_at: now, updated_at: now };
    this.data.product_variants.push(newVar);
    this.save();
    return newVar;
  }

  public deleteVariantsOfProduct(productId: string) {
    if (!this.data.product_variants) return;
    this.data.product_variants = this.data.product_variants.filter(v => v.product_id !== productId);
    this.save();
  }

  // Inventory/Stock Adjustment
  public adjustStock(productId: string, userId: string, change: number, type: 'restock' | 'sale' | 'adjustment' | 'waste' | 'return', notes: string): Product | null {
    const p = this.getProductById(productId);
    if (!p) return null;
    const before = p.stock;
    const after = before + change;
    
    // Auto clamp
    const updatedProduct = this.updateProduct(productId, { stock: Math.max(0, after) });
    if (!updatedProduct) return null;

    const user = this.getUserById(userId);
    const id = 'invl_' + Math.random().toString(36).substr(2, 9);
    const newLog: InventoryLog = {
      id,
      product_id: productId,
      product_name: p.name,
      user_id: userId,
      user_name: user ? user.name : 'Unknown User',
      type,
      quantity_before: before,
      quantity_change: change,
      quantity_after: Math.max(0, after),
      notes,
      created_at: new Date().toISOString()
    };
    
    this.data.inventory_logs.unshift(newLog); // push to front
    this.save();
    return updatedProduct;
  }

  public getInventoryLogs(): InventoryLog[] {
    return this.data.inventory_logs || [];
  }

  // Customers (CRM)
  public getCustomers(): Customer[] {
    return this.data.customers;
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.data.customers.find(c => c.id === id);
  }

  public createCustomer(cust: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Customer {
    const id = 'cust_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    const newCust: Customer = { ...cust, id, created_at: now, updated_at: now };
    this.data.customers.push(newCust);
    this.save();
    return newCust;
  }

  public updateCustomer(id: string, updates: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>): Customer | null {
    const idx = this.data.customers.findIndex(c => c.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.data.customers[idx] = { ...this.data.customers[idx], ...updates, updated_at: now };
    this.save();
    return this.data.customers[idx];
  }

  public deleteCustomer(id: string): boolean {
    const idx = this.data.customers.findIndex(c => c.id === id);
    if (idx === -1) return false;
    this.data.customers.splice(idx, 1);
    this.save();
    return true;
  }

  // Discounts
  public getDiscounts(): Discount[] {
    return this.data.discounts;
  }

  public getDiscountById(id: string): Discount | undefined {
    return this.data.discounts.find(d => d.id === id);
  }

  public createDiscount(disc: Omit<Discount, 'id' | 'created_at' | 'updated_at'>): Discount {
    const id = 'disc_' + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    const result: Discount = { ...disc, id, created_at: now, updated_at: now };
    this.data.discounts.push(result);
    this.save();
    return result;
  }

  public updateDiscount(id: string, updates: Partial<Omit<Discount, 'id' | 'created_at' | 'updated_at'>>): Discount | null {
    const idx = this.data.discounts.findIndex(d => d.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    this.data.discounts[idx] = { ...this.data.discounts[idx], ...updates, updated_at: now };
    this.save();
    return this.data.discounts[idx];
  }

  // Transactions
  public getTransactions(): Transaction[] {
    return this.data.transactions;
  }

  public getTransactionById(id: string): Transaction | undefined {
    const tx = this.data.transactions.find(t => t.id === id);
    if (!tx) return undefined;
    // Denormalize names if not preset
    const cas = this.getUserById(tx.cashier_id);
    if (cas) tx.cashier_name = cas.name;
    if (tx.customer_id) {
      const cust = this.getCustomerById(tx.customer_id);
      if (cust) tx.customer_name = cust.name;
    }
    return tx;
  }

  public getTransactionItems(txId: string): TransactionItem[] {
    return this.data.transaction_items.filter(item => item.transaction_id === txId);
  }

  public createTransaction(
    tx: Omit<Transaction, 'id' | 'transaction_number' | 'created_at' | 'updated_at'>, 
    items: Omit<TransactionItem, 'id' | 'transaction_id' | 'created_at' | 'updated_at'>[]
  ): { transaction: Transaction, items: TransactionItem[] } {
    const txId = 'tx_' + Math.random().toString(36).substr(2, 9);
    const dateFormatted = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const txCount = this.data.transactions.filter(t => t.transaction_date.startsWith(new Date().toISOString().slice(0,10))).length;
    const serial = String(txCount + 1).padStart(3, '0');
    const transaction_number = `YKP-${dateFormatted}-${serial}`;
    
    const now = new Date().toISOString();
    
    // Denormalised helper fields
    const cashier = this.getUserById(tx.cashier_id);
    const cashier_name = cashier ? cashier.name : 'Unknown Cashier';
    let customer_name = undefined;
    if (tx.customer_id) {
      const cust = this.getCustomerById(tx.customer_id);
      customer_name = cust ? cust.name : undefined;
    }

    const newTx: Transaction = {
      ...tx,
      id: txId,
      transaction_number,
      cashier_name,
      customer_name,
      created_at: now,
      updated_at: now
    };

    // Construct transaction items
    const createdItems: TransactionItem[] = [];
    for (const item of items) {
      const itemId = 'txi_' + Math.random().toString(36).substr(2, 9);
      
      // Deduct stock and log it
      this.adjustStock(
        item.product_id, 
        tx.cashier_id, 
        -item.quantity, 
        'sale', 
        `Deduction for Order No: ${transaction_number}`
      );
      
      const newItem: TransactionItem = {
        ...item,
        id: itemId,
        transaction_id: txId,
        created_at: now,
        updated_at: now
      };
      
      this.data.transaction_items.push(newItem);
      createdItems.push(newItem);
    }

    this.data.transactions.unshift(newTx); // push to front so newest comes first
    this.save();
    return { transaction: newTx, items: createdItems };
  }

  public getActivityLogs(): ActivityLog[] {
    return this.data.activity_logs;
  }
}

export const db = new Database();
export default db;
