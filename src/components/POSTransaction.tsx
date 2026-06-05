/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Minus, Trash2, Search, Filter, ShoppingCart, 
  CreditCard, CirclePercent, Users, Check, Printer, Download, Eye, X
} from 'lucide-react';
import { 
  Product, Category, Customer, Discount, 
  ProductVariant, Transaction, TransactionItem 
} from '../types';

interface POSTransactionProps {
  token: string;
  user: { id: string; name: string; role: string };
  onTransactionSuccess?: () => void;
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedVariants: Record<string, { name: string; price: number }>; // variant_type -> details
  variantDetailText: string;
  unitPrice: number; // base_price + variants
}

export default function POSTransaction({ token, user, onTransactionSuccess }: POSTransactionProps) {
  // DB States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cart & Transaction logic
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QRIS' | 'Debit Card' | 'E-Wallet' | 'Transfer Bank'>('Cash');
  const [cashAmount, setCashAmount] = useState<string>('');
  
  // Active Modifiers Popup
  const [modifierProduct, setModifierProduct] = useState<Product | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, { name: string; price: number }>>({});

  // Loading & Flow UI
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [successReceipt, setSuccessReceipt] = useState<{ transaction: Transaction; items: TransactionItem[] } | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Load backend seed tables
  useEffect(() => {
    async function loadResources() {
      try {
        setLoading(true);
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [prodRes, catRes, custRes, discRes] = await Promise.all([
          fetch('/api/products', { headers }),
          fetch('/api/categories', { headers }),
          fetch('/api/customers', { headers }),
          fetch('/api/discounts', { headers })
        ]);

        if (prodRes.ok) setProducts(await prodRes.json());
        if (catRes.ok) setCategories(await catRes.json());
        if (custRes.ok) setCustomers(await custRes.json());
        if (discRes.ok) setDiscounts(await discRes.json());
      } catch (err) {
        console.error('Failed to load POS resources:', err);
      } finally {
        setLoading(false);
      }
    }
    loadResources();
  }, [token]);

  // Recalculate discount if customer changes (e.g. member code validity check)
  useEffect(() => {
    if (selectedDiscount?.is_member_only && selectedCustomer?.member_status !== 'member') {
      setSelectedDiscount(null);
    }
  }, [selectedCustomer, selectedDiscount]);

  // Filter products by search & category
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    return p.is_active && matchesSearch && matchesCategory;
  });

  // Helper formats currency
  const formatIDR = (num: number) => {
    return 'Rp' + num.toLocaleString('id-ID');
  };

  // Modifier Dialog Trigger for applying variants
  const handleProductAddClick = (p: Product) => {
    const variants = (p as any).variants || [];
    if (variants.length > 0) {
      // Set default options
      const defaults: Record<string, { name: string; price: number }> = {};
      const types = Array.from(new Set(variants.map((v: ProductVariant) => v.variant_type))) as string[];
      
      types.forEach(type => {
        const matching = variants.filter((v: ProductVariant) => v.variant_type === type);
        // default is lowest price or first
        defaults[type] = {
          name: matching[0].variant_name,
          price: matching[0].additional_price
        };
      });

      setSelectedOptions(defaults);
      setModifierProduct(p);
    } else {
      // Direct add to cart
      addToCartDirect(p, {}, '', p.base_price);
    }
  };

  // Add item to cart logic
  const addToCartDirect = (p: Product, options: Record<string, { name: string; price: number }>, detailText: string, unitPrice: number) => {
    // Check if stock is available
    const productCurrentStock = p.stock;
    const countInCart = cart
      .filter(item => item.product.id === p.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    if (countInCart >= productCurrentStock) {
      setErrorText(`Stok tidak mencukupi untuk menambahkan ${p.name}. Sisa stok: ${productCurrentStock}`);
      setTimeout(() => setErrorText(''), 4000);
      return;
    }

    setCart(prev => {
      // Find if exact same product with exact same variant text exists
      const existingIdx = prev.findIndex(item => 
        item.product.id === p.id && item.variantDetailText === detailText
      );

      if (existingIdx !== -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      } else {
        return [...prev, {
          product: p,
          quantity: 1,
          selectedVariants: options,
          variantDetailText: detailText,
          unitPrice
        }];
      }
    });
  };

  const confirmModifiers = () => {
    if (!modifierProduct) return;
    const detailParts: string[] = [];
    let priceIncrease = 0;

    Object.keys(selectedOptions).forEach(type => {
      const option = selectedOptions[type];
      detailParts.push(`${type}: ${option.name}`);
      priceIncrease += option.price;
    });

    const detailText = detailParts.join(', ');
    const finalPrice = modifierProduct.base_price + priceIncrease;

    addToCartDirect(modifierProduct, selectedOptions, detailText, finalPrice);
    setModifierProduct(null);
  };

  // Cart adjustments
  const updateQuantity = (idx: number, delta: number) => {
    setCart(prev => {
      const item = prev[idx];
      const newQty = item.quantity + delta;
      
      if (newQty <= 0) {
        const updated = [...prev];
        updated.splice(idx, 1);
        return updated;
      }

      // Check stock limits before adding
      if (delta > 0) {
        const currentlyAvailable = item.product.stock;
        if (newQty > currentlyAvailable) {
          setErrorText(`Stok produk ${item.product.name} habis, sisa ${currentlyAvailable} porsi.`);
          setTimeout(() => setErrorText(''), 3000);
          return prev;
        }
      }

      const updated = [...prev];
      updated[idx].quantity = newQty;
      return updated;
    });
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  
  // Calculate discount percentage or fixed value
  let discountAmount = 0;
  if (selectedDiscount) {
    if (selectedDiscount.type === 'percentage') {
      discountAmount = Math.round((subtotal * selectedDiscount.value) / 100);
    } else {
      discountAmount = selectedDiscount.value;
    }
  }

  // Clamped at 100% of subtotal
  discountAmount = Math.min(discountAmount, subtotal);

  // 10% tax over taxable revenue
  const taxAmount = Math.round((subtotal - discountAmount) * 0.10);
  
  // flat service charge
  const serviceCharge = subtotal > 0 ? 2000 : 0;
  const grandTotal = subtotal > 0 ? (subtotal - discountAmount + taxAmount + serviceCharge) : 0;
  
  const cashPayVal = Number(cashAmount) || 0;
  const changeValue = Math.max(0, cashPayVal - grandTotal);

  // Handle Checkout Click
  const handleCheckoutSubmit = async () => {
    if (cart.length === 0) {
      setErrorText('Keranjang masih kosong.');
      return;
    }

    if (paymentMethod === 'Cash' && cashPayVal < grandTotal) {
      setErrorText('Jumlah uang pembayaran tunai/cash tidak mencukupi.');
      return;
    }

    try {
      const bodyPayload = {
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        subtotal,
        discount_id: selectedDiscount ? selectedDiscount.id : null,
        discount_amount: discountAmount,
        tax_amount: taxAmount,
        service_charge: serviceCharge,
        grand_total: grandTotal,
        payment_method: paymentMethod,
        paid_amount: paymentMethod === 'Cash' ? cashPayVal : grandTotal,
        change_amount: paymentMethod === 'Cash' ? changeValue : 0,
        items: cart.map(item => ({
          product_id: item.product.id,
          variant_detail: item.variantDetailText,
          quantity: item.quantity,
          price: item.unitPrice
        }))
      };

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });

      const responseJSON = await res.json();
      if (!res.ok) {
        setErrorText(responseJSON.error || 'Terjadi kesalahan transaksi.');
      } else {
        // Success
        setSuccessReceipt(responseJSON);
        setIsReceiptModalOpen(true);
        // Clear Cart
        setCart([]);
        setCashAmount('');
        setSelectedCustomer(null);
        setSelectedDiscount(null);
        
        // Re-read products stock inside local catalog
        const headers = { 'Authorization': `Bearer ${token}` };
        const prodRes = await fetch('/api/products', { headers });
        if (prodRes.ok) setProducts(await prodRes.json());

        if (onTransactionSuccess) onTransactionSuccess();
      }
    } catch (err) {
      console.error(err);
      setErrorText('Koneksi server gagal.');
    }
  };

  // Simulates or fires system browser printer dialog for receipt printing
  const handlePrintCommand = () => {
    if (!successReceipt) return;
    
    // Increment activity print logging
    fetch(`/api/transactions/${successReceipt.transaction.id}/print`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    window.print();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start animate-fade-in">
      
      {/* LEFT: Product catalog list with category selectors (GRID layout 2 columns wide) */}
      <div className="xl:col-span-2 space-y-6">
        
        {/* Search and filter bars */}
        <div className="bg-[#FFFDF8] border-2 border-darkroast p-4 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-3.5 md:space-y-0">
          
          {/* Inner Text query element */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-darkroast absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="inp-pos-search"
              placeholder="Cari menu espresso, latte, atau snack..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#E8D8C3]/10 text-sm pl-10 pr-4 py-2.5 outline-none border border-darkroast focus:bg-latte placeholder-darkroast/60"
            />
          </div>

          {/* Quick category filter tags list */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all rounded-none border ${selectedCategory === 'all' ? 'bg-[#1E130C] text-[#FFFDF8] border-darkroast' : 'bg-[#FFFDF8] border-darkroast text-darkroast hover:bg-latte'}`}
            >
              Semua Menu
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all rounded-none border ${selectedCategory === c.id ? 'bg-[#1E130C] text-[#FFFDF8] border-darkroast' : 'bg-[#FFFDF8] border-darkroast text-darkroast hover:bg-latte'}`}
              >
                {c.name}
              </button>
            ))}
          </div>

        </div>

        {/* Global error indicator toaster alerts */}
        {errorText && (
          <div className="bg-red-50 text-red-800 border-l-4 border-red-600 p-4 text-xs font-medium font-mono animate-pulse">
            PERINGATAN: {errorText}
          </div>
        )}

        {/* Catalog grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => {
              const hasLowStock = p.stock <= p.minimum_stock;
              const hasNoStock = p.stock <= 0;
              return (
                <div 
                  key={p.id} 
                  id={`prod-card-${p.id}`}
                  className={`bg-[#FFFDF8] border-2 border-darkroast hover:bg-latte transition-colors flex flex-col justify-between overflow-hidden relative group`}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-[#E8D8C3]/20 border-b border-darkroast">
                    <img 
                      src={p.image} 
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {hasNoStock ? (
                      <span className="absolute top-2.5 right-2.5 bg-red-600 text-[#FFFDF8] text-[9px] font-mono font-semibold uppercase tracking-widest px-2.5 py-1 font-bold">
                        HABIS
                      </span>
                    ) : hasLowStock ? (
                      <span className="absolute top-2.5 right-2.5 bg-amber-500 text-[#1E130C] text-[9px] font-mono font-semibold uppercase tracking-widest px-2.5 py-1 font-bold">
                        MENIPIS: {p.stock}
                      </span>
                    ) : null}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-[#C89F6A] font-bold">
                          {(p as any).category_name || 'Kategori'}
                        </span>
                        <span className="text-xs font-mono text-darkroast font-bold">Stok: {p.stock}</span>
                      </div>
                      <h4 className="font-display font-black text-lg text-darkroast tracking-tight uppercase leading-tight">{p.name}</h4>
                      <p className="text-xs text-darkroast/70 line-clamp-2 leading-relaxed">{p.description}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-darkroast">
                      <span className="font-mono text-xs font-bold text-darkroast">{formatIDR(p.base_price)}</span>
                      <button
                        onClick={() => handleProductAddClick(p)}
                        disabled={hasNoStock}
                        className={`
                          px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors border border-darkroast
                          ${hasNoStock 
                            ? 'bg-[#E8D8C3]/40 text-[#6F4E37] cursor-not-allowed' 
                            : 'bg-darkroast hover:bg-[#FFFDF8] text-milk hover:text-darkroast'
                          }
                        `}
                      >
                        {hasNoStock ? 'HOS' : '+ Cart'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#FFFDF8] border border-darkroast/10 p-12 text-center text-coffee italic text-sm">
            Tidak ada produk yang cocok dengan pencarian atau filter kategori ini.
          </div>
        )}
      </div>

      {/* RIGHT: POS CART PANEL */}
      <div id="pos-billing-area" className="bg-[#FFFDF8] border-2 border-darkroast p-6 space-y-6">
        
        {/* Cart Title */}
        <div className="flex justify-between items-center border-b border-darkroast pb-4">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-darkroast" />
            <h3 className="font-display font-black text-lg text-darkroast uppercase tracking-tight">Billing Belanja</h3>
          </div>
          <span className="text-xs bg-[#F3E5D0] px-2.5 py-0.5 text-espresso font-mono uppercase font-bold border border-darkroast">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} Item
          </span>
        </div>

        {/* Customer Select Option Widget */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-mono tracking-widest text-[#C89F6A] font-bold block">Customer CRM</label>
          <div className="flex space-x-2">
            <select
              value={selectedCustomer ? selectedCustomer.id : ''}
              onChange={(e) => {
                const cId = e.target.value;
                setSelectedCustomer(customers.find(c => c.id === cId) || null);
              }}
              className="flex-1 bg-[#FFFDF8] border border-darkroast p-2 text-xs font-bold outline-none focus:bg-latte text-darkroast"
            >
              <option value="">-- Non Member / Umum --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name.toUpperCase()} ({c.member_status === 'member' ? 'MEMBER' : 'Regular'})
                </option>
              ))}
            </select>
            {selectedCustomer?.member_status === 'member' && (
              <span className="bg-latte text-darkroast text-[9px] font-mono font-bold uppercase flex items-center px-2.5 py-1 border border-darkroast">
                MEMBER
              </span>
            )}
          </div>
        </div>

        {/* Selected Promo Section */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase font-mono tracking-widest text-[#C89F6A] font-bold block">Pilih Voucher Promo</label>
          <select
            value={selectedDiscount ? selectedDiscount.id : ''}
            onChange={(e) => {
              const dId = e.target.value;
              const promo = discounts.find(d => d.id === dId);
              if (promo) {
                // Check if user is member
                if (promo.is_member_only && selectedCustomer?.member_status !== 'member') {
                  setErrorText('Voucher ini khusus untuk customer yang berstatus MEMBER.');
                  setTimeout(() => setErrorText(''), 3000);
                  return;
                }
                setSelectedDiscount(promo);
              } else {
                setSelectedDiscount(null);
              }
            }}
            className="w-full bg-[#FFFDF8] border border-darkroast p-2 text-xs font-bold outline-none focus:bg-latte text-darkroast"
          >
            <option value="">-- Tanpa Diskon / Promo --</option>
            {discounts.filter(d => d.is_active).map(d => (
              <option key={d.id} value={d.id}>
                {d.name.toUpperCase()} [{d.code}] - ({d.type === 'percentage' ? `${d.value}%` : formatIDR(d.value)}) {d.is_member_only ? '[MEMBER]' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* List of Cart Items */}
        <div className="space-y-3.5 max-h-[290px] overflow-y-auto pr-1">
          {cart.length > 0 ? (
            cart.map((item, idx) => (
              <div key={idx} className="flex flex-col p-3 bg-[#FFFDF8] border border-darkroast justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-display font-bold text-sm text-darkroast leading-snug uppercase">{item.product.name}</h5>
                    {item.variantDetailText && (
                      <p className="text-[10px] text-coffee font-mono mt-0.5">{item.variantDetailText}</p>
                    )}
                    <p className="text-xs font-mono text-espresso/80 mt-1">{formatIDR(item.unitPrice)} / cup</p>
                  </div>
                  <button 
                    onClick={() => updateQuantity(idx, -item.quantity)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-darkroast border-dashed">
                  <span className="font-mono text-xs font-bold text-espresso">{formatIDR(item.unitPrice * item.quantity)}</span>
                  <div className="flex items-center space-x-2 bg-darkroast text-milk border border-darkroast">
                    <button 
                      onClick={() => updateQuantity(idx, -1)}
                      className="px-2 py-0.5 hover:bg-caramel hover:text-espresso transition-colors text-xs font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-1.5 text-xs font-mono">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(idx, 1)}
                      className="px-2 py-0.5 hover:bg-caramel hover:text-espresso transition-colors text-xs font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-xs text-coffee italic">
              Masukkan menu kopi, non kopi atau camilan untuk memulai billing belanjaan.
            </div>
          )}
        </div>

        {/* Invoice Summary and Calculatives */}
        <div className="border-t border-darkroast pt-4 space-y-2.5 text-xs font-mono font-bold">
          <div className="flex justify-between">
            <span className="text-darkroast/60">Subtotal</span>
            <span className="text-darkroast font-semibold">{formatIDR(subtotal)}</span>
          </div>

          {selectedDiscount && (
            <div className="flex justify-between text-red-600">
              <span>Diskon ({selectedDiscount.code})</span>
              <span>-{formatIDR(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-darkroast/60">Pajak Pertambahan Nilai (PPN 10%)</span>
            <span className="text-darkroast">{formatIDR(taxAmount)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-darkroast/60 font-semibold">Biaya Layanan/Service</span>
            <span className="text-darkroast">{formatIDR(serviceCharge)}</span>
          </div>

          <div className="flex justify-between text-base border-t border-darkroast pt-3 font-display font-black text-darkroast leading-none">
            <span>TOTAL AKHIR</span>
            <span className="mono-text font-black text-[#1E130C]">{formatIDR(grandTotal)}</span>
          </div>
        </div>

        {/* PAYMENT METHOD SELECTORS */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-mono tracking-widest text-[#C89F6A] font-bold block">Metode Pembayaran</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(['Cash', 'QRIS', 'Debit Card', 'E-Wallet', 'Transfer Bank'] as const).map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`
                  p-2 text-center uppercase tracking-wider font-mono font-bold transition-all border
                  ${paymentMethod === method 
                    ? 'bg-darkroast text-milk border-darkroast' 
                    : 'bg-[#FFFDF8] text-darkroast border-darkroast hover:bg-[#F3E5D0]'
                  }
                `}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        {/* Cash Parameter input and visual return calculations */}
        {paymentMethod === 'Cash' && grandTotal > 0 && (
          <div className="space-y-2.5 p-3.5 bg-latte border border-darkroast">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-darkroast">UANG TUNAI DITERIMA</label>
              <div className="relative max-w-[130px]">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#1E130C]/60">Rp</span>
                <input
                  type="number"
                  id="inp-cash-received"
                  placeholder="0"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full bg-[#FFFDF8] text-right font-mono font-bold text-sm p-1.5 pl-8 border border-darkroast outline-none focus:bg-white text-darkroast"
                />
              </div>
            </div>

            {/* Quick cash suggestions buttons */}
            <div className="flex space-x-1.5">
              {[grandTotal, 50000, 100000].map((val) => {
                const roundedVal = Math.ceil(val / 1000) * 1000;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setCashAmount(String(roundedVal))}
                    className="flex-1 text-[10px] font-mono font-bold uppercase py-1 px-1 bg-[#FFFDF8] text-darkroast border border-darkroast hover:bg-whiteScale"
                  >
                    {roundedVal.toLocaleString('id-ID')}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center border-t border-darkroast border-dashed pt-2 text-xs">
              <span className="font-bold text-[#1E130C]">KEMBALIAN</span>
              <span className="font-mono font-black text-sm text-darkroast">{formatIDR(changeValue)}</span>
            </div>
            
            {cashPayVal < grandTotal && cashAmount !== '' && (
              <span className="text-[10px] text-red-600 font-mono block text-right">Uang kurang: {formatIDR(grandTotal - cashPayVal)}</span>
            )}
          </div>
        )}

        {/* SUBMIT CHECKOUT TRANSACTION */}
        <button
          onClick={handleCheckoutSubmit}
          disabled={cart.length === 0 || (paymentMethod === 'Cash' && cashPayVal < grandTotal)}
          className={`
            w-full py-4 text-center font-display font-black uppercase tracking-widest text-xs transition-colors border-2
            ${cart.length === 0 || (paymentMethod === 'Cash' && cashPayVal < grandTotal)
              ? 'bg-[#E8D8C3] text-[#6F4E37] cursor-not-allowed border-transparent'
              : 'bg-darkroast text-[#FFFDF8] hover:bg-caramel hover:text-darkroast border-darkroast'
            }
          `}
        >
          Bayar & Cetak Struk
        </button>

      </div>

      {/* --- POPUPS / DIALOG MODALS --- */}

      {/* 1. Custom Product Flavor Modifiers Dialog */}
      {modifierProduct && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] border border-darkroast/10 max-w-md w-full p-6 space-y-6 animate-fade-in relative">
            <button 
              onClick={() => setModifierProduct(null)}
              className="absolute top-4 right-4 text-coffee hover:text-espresso"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#C89F6A] font-semibold">Tuning Minuman</span>
              <h3 className="text-xl font-display font-semibold text-espresso">{modifierProduct.name}</h3>
              <p className="text-xs text-coffee mt-1">Personalisasi opsi varian menu di bawah.</p>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {/* Group together variant types */}
              {Array.from(new Set(((modifierProduct as any).variants || []).map((v: ProductVariant) => v.variant_type))).map((type) => {
                const choices = ((modifierProduct as any).variants || []).filter((v: ProductVariant) => v.variant_type === type);
                return (
                  <div key={type as string} className="space-y-2 border-b border-darkroast/5 pb-3 last:border-b-0">
                    <p className="text-xs font-mono font-bold text-coffee uppercase tracking-wide">{type as string}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {choices.map((v: ProductVariant) => {
                        const isSelected = selectedOptions[type as string]?.name === v.variant_name;
                        return (
                          <button
                            key={v.id}
                            onClick={() => setSelectedOptions(prev => ({
                              ...prev,
                              [type as string]: { name: v.variant_name, price: v.additional_price }
                            }))}
                            className={`p-2 border text-left transition-all relative ${isSelected ? 'border-espresso bg-espresso text-milk' : 'border-darkroast/10 hover:border-caramel'}`}
                          >
                            <span>{v.variant_name}</span>
                            {v.additional_price > 0 && (
                              <span className="block text-[10px] text-caramel">+{formatIDR(v.additional_price)}</span>
                            )}
                            {isSelected && <Check className="w-3 h-3 absolute right-2 top-[30%] text-caramel" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={confirmModifiers}
              className="w-full py-3 bg-espresso text-white uppercase text-sm font-display font-semibold tracking-wide hover:bg-caramel hover:text-espresso transition-colors text-center"
            >
              Konfirmasi & Masuk Cart
            </button>
          </div>
        </div>
      )}

      {/* 2. Structured Printable Receipt Modal Component */}
      {isReceiptModalOpen && successReceipt && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 overflow-y-auto scrollbar-none">
          <div className="bg-[#FFFDF8] max-w-sm w-full p-6 border-2 border-caramel shadow-2xl relative my-8 animate-fade-in print:my-0 print:p-0 print:shadow-none print:border-none">
            
            {/* Top Close indicator */}
            <button
              onClick={() => {
                setIsReceiptModalOpen(false);
                setSuccessReceipt(null);
              }}
              className="absolute top-4 right-4 text-coffee hover:text-[#1E130C] no-print"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Print action bar */}
            <div className="no-print bg-[#F3E5D0] border border-caramel/25 p-3 flex justify-between items-center mb-6 text-xs text-espresso">
              <span>Transaksi Lunas Berhasil!</span>
              <button
                onClick={handlePrintCommand}
                className="flex items-center space-x-1.5 font-bold uppercase font-mono tracking-wider bg-espresso text-milk px-3 py-1.5 hover:bg-caramel hover:text-espresso transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Nota</span>
              </button>
            </div>

            {/* THE THERMAL PRINT SECTION */}
            <div className="print-receipt-section space-y-6 text-espresso leading-relaxed uppercase pr-1" style={{ fontSize: '12px' }}>
              
              {/* Header */}
              <div className="text-center space-y-1">
                <h2 className="font-display font-bold text-xl tracking-wider text-darkroast">YA KOPI</h2>
                <p className="text-[10px] font-mono leading-none">Jl. Boulevard Selera No. 42</p>
                <p className="text-[10px] font-mono">Jakarta Kidul, DKI Jakarta</p>
                <p className="text-[10px] font-mono">Mobile: +62 812-3456-7890</p>
              </div>

              {/* Specs Grid */}
              <div className="border-t border-b border-dashed border-darkroast/40 py-2.5 font-mono text-[10px] space-y-1 leading-tighter">
                <div className="flex justify-between">
                  <span>Nota: {successReceipt.transaction.transaction_number}</span>
                  <span>Kasir: {successReceipt.transaction.cashier_name || user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu: {new Date(successReceipt.transaction.transaction_date).toLocaleString('id-ID')}</span>
                  {successReceipt.transaction.customer_name && (
                    <span>CS: {successReceipt.transaction.customer_name}</span>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 font-mono text-[11px] border-b border-dashed border-darkroast/40 pb-3">
                {successReceipt.items.map((it) => (
                  <div key={it.id} className="space-y-0.5">
                    <div className="flex justify-between font-bold">
                      <span>{it.product_name}</span>
                      <span>{formatIDR(it.subtotal)}</span>
                    </div>
                    {it.variant_detail && (
                      <p className="text-[9px] text-coffee leading-none">{it.variant_detail}</p>
                    )}
                    <div className="flex justify-between text-[10px] text-coffee pt-0.5">
                      <span>{it.quantity} x {formatIDR(it.price)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Math Computations */}
              <div className="font-mono text-xs space-y-1.5 border-b border-dashed border-darkroast/40 pb-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatIDR(successReceipt.transaction.subtotal)}</span>
                </div>
                {successReceipt.transaction.discount_amount > 0 && (
                  <div className="flex justify-between text-black font-semibold">
                    <span>Diskon</span>
                    <span>-{formatIDR(successReceipt.transaction.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pajak (PPN 10%)</span>
                  <span>{formatIDR(successReceipt.transaction.tax_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Layanan</span>
                  <span>{formatIDR(successReceipt.transaction.service_charge)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-darkroast font-display pt-1 border-t border-dotted border-darkroast/10 uppercase">
                  <span>TOTAL AKHIR</span>
                  <span>{formatIDR(successReceipt.transaction.grand_total)}</span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="font-mono text-[11px] space-y-1 border-b border-dashed border-darkroast/40 pb-3">
                <div className="flex justify-between">
                  <span>Media Bayar</span>
                  <span>{successReceipt.transaction.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span>Uang Diterima</span>
                  <span>{formatIDR(successReceipt.transaction.paid_amount)}</span>
                </div>
                {successReceipt.transaction.payment_method === 'Cash' && (
                  <div className="flex justify-between font-bold">
                    <span>Kembalian</span>
                    <span>{formatIDR(successReceipt.transaction.change_amount)}</span>
                  </div>
                )}
              </div>

              {/* Footer Greet */}
              <div className="text-center font-display space-y-1.5 pt-2">
                <p className="font-semibold text-xs tracking-wide">Terima kasih sudah ngopi di Ya Kopi!</p>
                <p className="text-[9px] lowercase text-coffee font-mono italic">#ngopiDuluBiarRileks %genzchoice</p>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
