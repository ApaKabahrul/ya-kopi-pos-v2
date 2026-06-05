/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Filter, History, TrendingUp, TrendingDown,
  RefreshCw, CheckCircle, AlertTriangle, ArrowUpDown, X
} from 'lucide-react';
import { Product, InventoryLog, InventoryLogType } from '../types';

interface InventoryManagementProps {
  token: string;
  user: { id: string; name: string };
}

export default function InventoryManagement({ token, user }: InventoryManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter triggers
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

  // Adjustment Modal Form States
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [changeAmount, setChangeAmount] = useState('');
  const [adjustType, setAdjustType] = useState<InventoryLogType>('restock');
  const [notesText, setNotesText] = useState('');

  // Notifications
  const [successText, setSuccessText] = useState('');
  const [errorText, setErrorText] = useState('');

  const formatIDR = (num: number) => {
    return 'Rp' + num.toLocaleString('id-ID');
  };

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const [prodRes, logRes] = await Promise.all([
        fetch('/api/products', { headers }),
        fetch('/api/inventory/logs', { headers })
      ]);

      if (prodRes.ok) setProducts(await prodRes.json());
      if (logRes.ok) setLogs(await logRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, [token]);

  // Open adjustment context helper
  const openAdjustment = (p: Product) => {
    setSelectedProduct(p);
    setChangeAmount('');
    setAdjustType('restock');
    setNotesText('');
    setIsAdjustModalOpen(true);
  };

  // Submit Inventory Adjustment
  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !changeAmount || !adjustType) {
      setErrorText('Semua kolom formulir penyesuaian stok wajib diisi.');
      return;
    }

    const value = Number(changeAmount);
    if (isNaN(value)) {
      setErrorText('Jumlah perubahan stok harus berupa angka.');
      return;
    }

    // Business validation: final stock cannot be negative
    const expectedFinal = selectedProduct.stock + value;
    if (expectedFinal < 0) {
      setErrorText(`Stok akhir tidak boleh negatif. Stok saat ini: ${selectedProduct.stock}, pengurangan yang dicoba: ${Math.abs(value)}`);
      return;
    }

    try {
      const res = await fetch('/api/inventory/adjustment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          stock_change: value,
          type: adjustType,
          notes: notesText || `Penyesuaian manual oleh ${user.name}`
        })
      });

      if (res.ok) {
        setSuccessText(`Stok bahan untuk ${selectedProduct.name} berhasil disesuaikan.`);
        setIsAdjustModalOpen(false);
        loadInventoryData();
        setTimeout(() => setSuccessText(''), 3000);
      } else {
        const errorData = await res.json();
        setErrorText(errorData.error || 'Gagal menyimpan stock adjustment.');
      }
    } catch (err) {
      setErrorText('Koneksi sistem server terputus.');
    }
  };

  const getLogTypeBadge = (type: InventoryLogType) => {
    switch(type) {
      case 'restock':
        return <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[9px] font-mono uppercase font-bold tracking-wider">RESTOCK</span>;
      case 'sale':
        return <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 text-[9px] font-mono uppercase font-bold tracking-wider">SALE (KASIR)</span>;
      case 'adjustment':
        return <span className="bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 text-[9px] font-mono uppercase font-bold tracking-wider">ADJUSTMENT</span>;
      case 'waste':
        return <span className="bg-red-50 text-red-800 border border-red-300 px-2 py-0.5 text-[9px] font-mono uppercase font-bold tracking-wider">WASTE (RUSAK)</span>;
      case 'return':
        return <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 text-[9px] font-mono uppercase font-bold tracking-wider">KOSONG / RETUR</span>;
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = !showOnlyLowStock || p.stock <= p.minimum_stock;
    return p.is_active && matchesSearch && matchesLowStock;
  });

  return (
    <div className="space-y-8 animate-fade-in text-espresso">
      
      {/* Top title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-darkroast/10 pb-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-caramel">Inventory & Stock Tracking</span>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-espresso mt-1">Stok Bahan & Log Mutasi</h1>
        </div>
        <button
          onClick={loadInventoryData}
          className="mt-4 md:mt-0 flex items-center space-x-2 px-4 py-2 bg-[#FFFDF8] border border-darkroast/10 text-xs font-mono font-semibold uppercase hover:border-caramel transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Notifications */}
      {successText && (
        <div className="bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 p-4 text-xs font-mono font-medium leading-none">
          NOTIFIKASI: {successText}
        </div>
      )}

      {/* Grid: Left stock management list, Right: Live inventory modification logs list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COMPONENT COLUMN (Products table tracker) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#FFFDF8] border border-darkroast/10 p-4 flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
            <div className="flex-1 relative max-w-sm">
              <Search className="w-4 h-4 text-coffee absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari stock menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#E8D8C3]/10 text-sm pl-10 pr-4 py-2.5 outline-none border border-darkroast/10 focus:border-caramel placeholder-coffee"
              />
            </div>

            <div className="flex items-center space-x-2 select-none">
              <button
                onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}
                className={`px-4 py-2 border text-[11px] font-mono tracking-wider font-semibold uppercase transition-all flex items-center space-x-1 ${showOnlyLowStock ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-white border-darkroast/10 text-espresso hover:border-caramel'}`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                <span>Hanya Stok Menipis ({products.filter(p => p.stock <= p.minimum_stock && p.is_active).length})</span>
              </button>
            </div>
          </div>

          <div className="bg-[#FFFDF8] border border-darkroast/10 p-5 overflow-x-auto">
            {loading ? (
              <div className="py-8 text-center text-xs font-mono italic">Loading inventory grid...</div>
            ) : filteredProducts.length > 0 ? (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-darkroast/10 text-[10px] font-mono uppercase tracking-wider bg-[#E8D8C3]/15 text-coffee">
                    <th className="py-2.5 px-4 font-normal">Nama Bahan Menu</th>
                    <th className="py-2.5 px-4 font-normal text-center">Stok Saat Ini</th>
                    <th className="py-2.5 px-4 font-normal text-center">Batas Minim</th>
                    <th className="py-2.5 px-4 font-normal text-center">Satus</th>
                    <th className="py-2.5 px-4 font-normal text-right">Penyesuaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-darkroast/5 text-xs">
                  {filteredProducts.map((p) => {
                    const isLow = p.stock <= p.minimum_stock;
                    return (
                      <tr key={p.id} className="hover:bg-caramel/5">
                        <td className="py-3 px-4">
                          <p className="font-display font-semibold text-espresso">{p.name}</p>
                          <p className="text-[10px] text-coffee">ID: {p.id}</p>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-sm">
                          <span className={isLow ? 'text-red-700 font-extrabold' : 'text-espresso'}>{p.stock}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-coffee">{p.minimum_stock}</td>
                        <td className="py-3 px-4 text-center">
                          {isLow ? (
                            <span className="bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 text-[9px] font-semibold uppercase animate-pulse">Low Stock</span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[9px] font-semibold uppercase">Melimpah</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openAdjustment(p)}
                            className="bg-espresso text-milk hover:bg-caramel hover:text-espresso font-display font-medium text-[11px] uppercase tracking-wide px-3 py-1.5 transition-colors"
                          >
                            Atur Stok
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-xs text-coffee italic">
                Tidak ada menu terdaftar yang memerlukan restock/pengaturan stock saat ini.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: RECENT STOCK LOGS (Activity audit logs) */}
        <div className="space-y-4">
          <div className="bg-[#FFFDF8] border border-darkroast/10 p-4 border-b-2 border-b-espresso flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-4 h-4 text-caramel" />
              <h3 className="font-display font-semibold text-base text-espresso">Histori Log Mutasi</h3>
            </div>
          </div>

          <div className="bg-[#FFFDF8] border border-darkroast/10 p-4 space-y-4 max-h-[490px] overflow-y-auto">
            {logs.length > 0 ? (
              logs.map((log) => {
                const isAddition = log.quantity_change > 0;
                return (
                  <div key={log.id} className="text-xs border-b border-darkroast/5 pb-3.5 last:border-b-0 space-y-2">
                    <div className="flex justify-between items-start font-mono text-coffee">
                      <span className="font-semibold text-espresso">{log.product_name}</span>
                      <span>{new Date(log.created_at).toLocaleDateString('id', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="flex justify-between items-center bg-[#E8D8C3]/15 p-2 text-[11px]">
                      <div>
                        {getLogTypeBadge(log.type)}
                        <p className="text-[10px] text-coffee/90 mt-1">Oleh: <span className="font-bold text-[#6F4E37]">{log.user_name}</span></p>
                      </div>
                      <div className="text-right font-mono">
                        <span className={`font-bold ${isAddition ? 'text-emerald-700' : 'text-red-700'}`}>
                          {isAddition ? '+' : ''}{log.quantity_change}
                        </span>
                        <div className="text-[10px] text-coffee">Sisa: {log.quantity_after}</div>
                      </div>
                    </div>

                    {log.notes && (
                      <p className="text-[10px] text-[#3B2416] italic leading-tight pl-1.5 border-l-2 border-caramel/40">"{log.notes}"</p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-xs italic text-coffee">
                Belum ada catatan keluar masuk/mutasi stok.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* --- FORM ADJUSTMENT DIALOGPOPUP --- */}
      {isAdjustModalOpen && selectedProduct && (
        <div id="modal-stock-adjustment" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] border-2 border-espresso max-w-sm w-full p-6 space-y-5 relative animate-fade-in">
            <button
              onClick={() => setIsAdjustModalOpen(false)}
              className="absolute top-4 right-4 text-coffee hover:text-espresso"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-[#C89F6A]">Mutasi Bahan Baku</span>
              <h3 className="text-xl font-display font-semibold text-espresso">Ubah Stok: {selectedProduct.name}</h3>
              <p className="text-xs text-coffee mt-0.5">Sisa stok fisik saat ini: <strong className="font-mono text-darkroast font-semibold">{selectedProduct.stock}</strong> porsi.</p>
            </div>

            {errorText && (
              <div className="bg-red-50 text-red-800 border-l-4 border-red-600 p-3 text-xs font-mono leading-tight">
                PERINGATAN: {errorText}
              </div>
            )}

            <form onSubmit={handleAdjustmentSubmit} className="space-y-4 text-sm">
              
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">Tipe Perubahan</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as InventoryLogType)}
                  className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 text-xs outline-none focus:border-caramel"
                  required
                >
                  <option value="restock">Restock (Penambahan Stok)</option>
                  <option value="adjustment">Penyesuaian Selisih Fisik (Bisa +/-)</option>
                  <option value="waste">Waste (Bahan Rusak / Kedaluwarsa -)</option>
                  <option value="return">Return Pengembalian Vendor</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">
                  Jumlah Perubahan (Gunakan negatif "-" untuk pengurangan)
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 50 atau -10"
                  value={changeAmount}
                  onChange={(e) => setChangeAmount(e.target.value)}
                  className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 pl-4 font-mono font-bold text-sm outline-none focus:border-caramel text-espresso"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">Catatan / Alasan Mutasi</label>
                <input
                  type="text"
                  placeholder="Contoh: Restock bulanan dari Supplier Agro"
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 text-xs outline-none focus:border-caramel"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-3 border-t border-darkroast/5">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="flex-1 py-2 bg-white border border-darkroast/10 font-display text-xs text-espresso hover:bg-beige/2 transition-colors uppercase font-semibold text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-espresso hover:bg-caramel text-milk hover:text-espresso font-display text-xs uppercase font-semibold tracking-wider transition-colors"
                >
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
