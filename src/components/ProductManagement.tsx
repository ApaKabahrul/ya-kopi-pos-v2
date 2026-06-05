/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Eye, EyeOff, Search, Trash2, 
  X, AlertTriangle, ListPlus, FolderPlus
} from 'lucide-react';
import { Product, Category, ProductVariant } from '../types';

interface ProductManagementProps {
  token: string;
}

export default function ProductManagement({ token }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Tables state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Modal forms
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  // Editing contexts
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Product form inputs
  const [prodName, setProdName] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCost, setProdCost] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodMinStock, setProdMinStock] = useState('');
  
  // Variants inline form list: { id, variant_type, variant_name, additional_price }
  const [prodVariants, setProdVariants] = useState<Omit<ProductVariant, 'id' | 'product_id' | 'created_at' | 'updated_at'>[]>([]);

  // Category form inputs
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Status logs
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  // Soft delete context
  const [deleteProductConfirm, setDeleteProductConfirm] = useState<Product | null>(null);

  const formatIDR = (num: number) => {
    return 'Rp' + num.toLocaleString('id-ID');
  };

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  });

  // Reload tables
  const loadResources = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products', { headers }),
        fetch('/api/categories', { headers })
      ]);

      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, [token]);

  // Product Form Mode triggers
  const openAddProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCat(categories[0]?.id || '');
    setProdDesc('');
    setProdImage('');
    setProdPrice('');
    setProdCost('');
    setProdStock('0');
    setProdMinStock('5');
    setProdVariants([
      { variant_type: 'Size', variant_name: 'Small', additional_price: 0 },
      { variant_type: 'Size', variant_name: 'Medium', additional_price: 3000 },
      { variant_type: 'Size', variant_name: 'Large', additional_price: 5000 },
      { variant_type: 'Temperature', variant_name: 'Hot', additional_price: 0 },
      { variant_type: 'Temperature', variant_name: 'Ice', additional_price: 1000 }
    ]);
    setIsProductModalOpen(true);
  };

  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdCat(p.category_id);
    setProdDesc(p.description || '');
    setProdImage(p.image || '');
    setProdPrice(String(p.base_price));
    setProdCost(String(p.cost_price));
    setProdStock(String(p.stock));
    setProdMinStock(String(p.minimum_stock));
    setProdVariants((p as any).variants || []);
    setIsProductModalOpen(true);
  };

  // Add Variant helper to list
  const addVariantRow = () => {
    setProdVariants(prev => [...prev, {
      variant_type: 'Size',
      variant_name: '',
      additional_price: 0
    }]);
  };

  const removeVariantRow = (index: number) => {
    setProdVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariantValue = (index: number, key: string, value: any) => {
    setProdVariants(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [key]: value
      };
      return copy;
    });
  };

  // Submit Product Form (Create / Update)
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');

    if (!prodName || !prodCat || !prodPrice || !prodCost) {
      setErrorText('Nama, kategori, HPP (modal), dan harga jual menu wajib diisi.');
      return;
    }

    const price = Number(prodPrice);
    const cost = Number(prodCost);
    const stock = Number(prodStock) || 0;
    const minStock = Number(prodMinStock) || 0;

    if (price < 0 || cost < 0 || stock < 0 || minStock < 0) {
      setErrorText('Harga, HPP, stok dan batas minimal tidak boleh bernilai negatif.');
      return;
    }

    // Filter validation for variants to delete empty inputs
    const cleanVariants = prodVariants.filter(v => v.variant_name.trim() !== '');

    const payload = {
      name: prodName,
      category_id: prodCat,
      description: prodDesc,
      image: prodImage || 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400',
      base_price: price,
      cost_price: cost,
      stock,
      minimum_stock: minStock,
      variants: cleanVariants
    };

    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const endpoint = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      
      const res = await fetch(endpoint, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessText(`Produk ${prodName} berhasil ${editingProduct ? 'diperbarui' : 'ditambahkan'}.`);
        setIsProductModalOpen(false);
        loadResources();
        setTimeout(() => setSuccessText(''), 3000);
      } else {
        const errorData = await res.json();
        setErrorText(errorData.error || 'Terjadi kesalahan sistem.');
      }
    } catch (err) {
      setErrorText('Gagal menghubungkan ke server.');
    }
  };

  // Submit Category
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) {
      setErrorText('Nama kategori wajib diisi.');
      return;
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name: catName, description: catDesc })
      });

      if (res.ok) {
        setSuccessText(`Kategori ${catName} berhasil ditambahkan.`);
        setCatName('');
        setCatDesc('');
        setIsCategoryModalOpen(false);
        loadResources();
        setTimeout(() => setSuccessText(''), 3000);
      } else {
        const err = await res.json();
        setErrorText(err.error || 'Gagal menyimpan kategori.');
      }
    } catch (err) {
      setErrorText('Koneksi internet bermasalah.');
    }
  };

  // Toggle active/inactive
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/products/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ is_active: !currentStatus })
      });
      if (res.ok) {
        loadResources();
        setSuccessText('Ubah status aktif menu berhasil.');
        setTimeout(() => setSuccessText(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Soft delete confirm
  const triggerDeleteProduct = (p: Product) => {
    setDeleteProductConfirm(p);
  };

  const executeDeleteProduct = async () => {
    if (!deleteProductConfirm) return;
    try {
      const res = await fetch(`/api/products/${deleteProductConfirm.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        setSuccessText(`Menu ${deleteProductConfirm.name} dinonaktifkan (Status Toggle OFF).`);
        setTimeout(() => setSuccessText(''), 3000);
        setDeleteProductConfirm(null);
        loadResources();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredList = products.filter(p => {
    const query = searchTerm.toLowerCase();
    const matchQuery = p.name.toLowerCase().includes(query) || (p.description || '').toLowerCase().includes(query);
    const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchQuery && matchCat;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-darkroast/10 pb-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-[#C89F6A]">Pengaturan Katalog Toko</span>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-espresso mt-1">Kelola Menu Kopi & Snack</h1>
        </div>
        
        {/* Action Triggers */}
        <div className="mt-4 md:mt-0 flex space-x-3.5">
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-[#FFFDF8] border border-darkroast/10 font-display text-xs uppercase font-semibold hover:border-caramel transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-caramel" />
            <span>+ Kategori Baru</span>
          </button>
          <button
            onClick={openAddProduct}
            className="flex items-center space-x-2 px-5 py-2.5 bg-coffee hover:bg-espresso text-milk font-display text-xs uppercase font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Daftarkan Menu</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successText && (
        <div className="bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 p-4 text-xs font-medium font-mono animate-fade-in">
          NOTIFIKASI: {successText}
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      <div className="bg-[#FFFDF8] border border-darkroast/10 p-4 flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
        <div className="flex-1 relative max-w-md">
          <Search className="w-4 h-4 text-coffee absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama kopi, rasa, camilan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#E8D8C3]/10 text-sm pl-10 pr-4 py-2.5 outline-none border border-darkroast/10 focus:border-caramel placeholder-coffee"
          />
        </div>

        {/* Categories selector filtering buttons inline */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 select-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-all border ${selectedCategory === 'all' ? 'bg-[#3B2416] text-[#FFFDF8] border-[#3B2416]' : 'bg-[#FFFDF8] border-darkroast/10 text-espresso hover:border-caramel'}`}
          >
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-wider transition-all border ${selectedCategory === c.id ? 'bg-[#3B2416] text-[#FFFDF8] border-[#3B2416]' : 'bg-[#FFFDF8] border-darkroast/10 text-espresso'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE DATA LIST */}
      <div className="bg-[#FFFDF8] border border-darkroast/10 p-6 overflow-x-auto">
        {loading ? (
          <div className="py-12 flex justify-center text-coffee font-mono text-xs">Loading menus...</div>
        ) : filteredList.length > 0 ? (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-darkroast/10 text-[10px] font-mono uppercase tracking-wider bg-[#E8D8C3]/15 text-coffee">
                <th className="py-3 px-4 font-normal">Media</th>
                <th className="py-3 px-4 font-normal">Nama Menu</th>
                <th className="py-3 px-4 font-normal">Kategori</th>
                <th className="py-3 px-4 font-normal text-right">Modal HPP</th>
                <th className="py-3 px-4 font-normal text-right">Harga Jual</th>
                <th className="py-3 px-4 font-normal text-center">Stok</th>
                <th className="py-3 px-4 font-normal text-center">Status</th>
                <th className="py-3 px-4 font-normal text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkroast/5">
              {filteredList.map((p) => {
                const warns = p.stock <= p.minimum_stock;
                return (
                  <tr key={p.id} className="hover:bg-[#E8D8C3]/10">
                    <td className="py-3 px-4">
                      <img 
                        src={p.image} 
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 object-cover bg-beige/20 border border-darkroast/10 rounded-none"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="max-w-[180px]">
                        <p className="font-display font-semibold text-espresso">{p.name}</p>
                        <p className="text-[10px] text-coffee truncate">{p.description || 'Tidak ada deskripsi'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">
                      <span className="bg-latte px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider text-espresso">
                        {(p as any).category_name || 'Kategori'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-[#6F4E37]">{formatIDR(p.cost_price)}</td>
                    <td className="py-3 px-4 text-right font-mono text-xs font-semibold text-[#1E130C]">{formatIDR(p.base_price)}</td>
                    <td className="py-3 px-4 text-center font-mono text-xs">
                      <span className={`px-2.5 py-0.5 font-bold ${warns ? 'text-amber-700 bg-amber-50 border border-amber-300 animate-pulse' : 'text-espresso bg-[#FFFDF8]'}`}>
                        {p.stock} porsi {warns && '⚠️'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(p.id, p.is_active)}
                        className={`px-3 py-1 font-mono text-[9px] uppercase tracking-wider font-bold border transition-colors ${p.is_active ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'}`}
                      >
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right text-xs">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => openEditProduct(p)}
                          className="p-1.5 hover:bg-caramel hover:text-espresso rounded border border-darkroast/10 transition-colors"
                          title="Edit Menu"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => triggerDeleteProduct(p)}
                          className="p-1.5 hover:bg-red-50 text-red-600 hover:text-red-800 rounded border border-red-200 transition-colors"
                          title="Deactive Menu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-sm italic text-coffee">
            Katalog kosong. Klik "+ Daftarkan Menu" di kanan atas untuk menyusun pilihan kuliner pertama.
          </div>
        )}
      </div>

      {/* --- ADD/EDIT MENU MODAL POPUP --- */}
      {isProductModalOpen && (
        <div id="modal-product-form" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] border-2 border-espresso max-w-2xl w-full p-6 space-y-6 animate-fade-in relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 text-coffee hover:text-[#1E130C]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-[#C89F6A]">Form Penyusunan Menu</span>
              <h2 className="text-2xl font-display font-semibold text-espresso">{editingProduct ? 'Perbarui Menu' : 'Pendaftaran Menu Baru'}</h2>
            </div>

            {errorText && (
              <div className="bg-red-50 text-red-800 border-l-4 border-red-600 p-3 text-xs font-mono font-medium leading-none">
                {errorText}
              </div>
            )}

            <form onSubmit={handleProductSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                
                {/* Column left */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">Nama Produk</label>
                    <input
                      type="text"
                      placeholder="Contoh: Kopi Susu Krimi"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 outline-none focus:border-caramel"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">Kategori Menu</label>
                    <select
                      value={prodCat}
                      onChange={(e) => setProdCat(e.target.value)}
                      className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 outline-none focus:border-caramel"
                      required
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">HPP Modal (Rp)</label>
                      <input
                        type="number"
                        placeholder="7000"
                        value={prodCost}
                        onChange={(e) => setProdCost(e.target.value)}
                        className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 outline-none focus:border-caramel"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">Harga Jual (Rp)</label>
                      <input
                        type="number"
                        placeholder="18000"
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 outline-none focus:border-caramel"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">Stok Saat Ini</label>
                      <input
                        type="number"
                        value={prodStock}
                        onChange={(e) => setProdStock(e.target.value)}
                        className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 outline-none focus:border-caramel"
                        disabled={!!editingProduct} // Cannot edit directly on catalog update, user is forced to do restock logs adjustment! Perfect business rule.
                      />
                      {editingProduct && <span className="text-[9px] text-[#C89F6A] font-mono leading-none">Gunakan tab 'Stok' untuk restock</span>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">Minimum Stok Alert</label>
                      <input
                        type="number"
                        value={prodMinStock}
                        onChange={(e) => setProdMinStock(e.target.value)}
                        className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 outline-none focus:border-caramel"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Column right */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">Deskripsi Singkat</label>
                    <textarea
                      placeholder="Masukkan cita rasa kopi, temperatur default..."
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      rows={3}
                      className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 outline-none focus:border-caramel resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">URL Foto Unsplash/Bebas</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={prodImage}
                      onChange={(e) => setProdImage(e.target.value)}
                      className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 text-xs outline-none focus:border-caramel"
                    />
                  </div>
                  
                  {/* Variants custom checklist mapping */}
                  <div className="border border-darkroast/10 p-3 bg-beige/12 space-y-3">
                    <div className="flex justify-between items-center border-b border-darkroast/5 pb-1.5">
                      <span className="text-[10px] uppercase font-mono font-bold text-espresso">Daftar Modifiers (Opsi Varian)</span>
                      <button
                        type="button"
                        onClick={addVariantRow}
                        className="text-[9px] font-mono font-bold text-coffee uppercase border border-caramel/30 px-2 py-0.5 bg-milk hover:bg-caramel hover:text-espresso"
                      >
                        + Baris Opsi
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[140px] overflow-y-auto">
                      {prodVariants.map((v, index) => (
                        <div key={index} className="flex space-x-1.5 items-center">
                          <select
                            value={v.variant_type}
                            onChange={(e) => updateVariantValue(index, 'variant_type', e.target.value)}
                            className="bg-white border text-[11px] p-1 border-darkroast/10 outline-none w-[90px]"
                          >
                            <option value="Size">Size</option>
                            <option value="Temperature">Temperature</option>
                            <option value="Milk">Milk</option>
                            <option value="Sugar">Sweetness</option>
                            <option value="Add-on">Add-on</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Ice / Oat Milk"
                            value={v.variant_name}
                            onChange={(e) => updateVariantValue(index, 'variant_name', e.target.value)}
                            className="flex-1 bg-white border text-[11px] p-1 border-darkroast/10 outline-none"
                            required
                          />
                          <input
                            type="number"
                            placeholder="+ Harga"
                            value={v.additional_price}
                            onChange={(e) => updateVariantValue(index, 'additional_price', e.target.value)}
                            className="w-[60px] bg-white border text-[11px] p-1 border-darkroast/10 outline-none text-right"
                          />
                          <button
                            type="button"
                            onClick={() => removeVariantRow(index)}
                            className="p-1 text-red-500 hover:text-amber-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex justify-end space-x-3 border-t border-darkroast/10 pt-4">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 bg-white border border-darkroast/10 text-espresso font-display text-xs uppercase font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#3B2416] text-[#FFFDF8] hover:bg-caramel hover:text-espresso font-display text-xs uppercase font-semibold transition-colors shadow-sm"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD CATEGORY DIALOG --- */}
      {isCategoryModalOpen && (
        <div id="modal-category-form" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FFFDF8] border-2 border-espresso max-w-sm w-full p-6 space-y-5 relative">
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-4 right-4 text-coffee hover:text-[#1E130C]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-[#C89F6A]">Form Entri</span>
              <h3 className="text-xl font-display font-semibold text-espresso">Kategori Produk Baru</h3>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">Nama Kategori</label>
                <input
                  type="text"
                  placeholder="Contoh: Bakery, Coffee, Merchandise..."
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 text-sm outline-none focus:border-caramel"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">Deskripsi</label>
                <input
                  type="text"
                  placeholder="Deskripsi singkat jenis menu..."
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 text-xs outline-none focus:border-caramel"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-espresso cursor-pointer hover:bg-caramel text-milk hover:text-espresso text-xs font-display font-semibold uppercase tracking-wider transition-colors"
              >
                Daun Klasifikasi Kategori
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM TOGGLE RETIRE */}
      {deleteProductConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] border-l-4 border-red-600 max-w-sm w-full p-6 space-y-4 rounded-none animate-fade-in text-espresso">
            <span className="font-mono text-red-600 text-xs font-bold uppercase tracking-wider flex items-center space-x-1">
              <AlertTriangle className="w-4 h-4 mr-1 animate-bounce" /> Konfirmasi Nonaktif Produk
            </span>
            <p className="text-sm">Apakah Anda yakin ingin menonaktifkan menu <strong className="text-darkroast font-semibold">{deleteProductConfirm.name}</strong>?</p>
            <p className="text-xs text-coffee mb-2">Ini tidak akan menghapus data transaksi lamanya, namun produk tidak akan muncul di katalog penjualan kasir.</p>
            <div className="flex justify-end space-x-3 pt-3">
              <button
                onClick={() => setDeleteProductConfirm(null)}
                className="px-4 py-2 border text-xs font-mono"
              >
                Kembali
              </button>
              <button
                onClick={executeDeleteProduct}
                className="px-4 py-2 bg-red-600 text-[#FFFDF8] text-xs font-mono uppercase font-semibold hover:bg-black transition-colors"
              >
                Ya, Set Nonaktif
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
