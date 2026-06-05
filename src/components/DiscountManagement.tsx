/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  CirclePercent, Search, Plus, Edit, Trash2, X, Tag, 
  Calendar, Check, AlertCircle
} from 'lucide-react';
import { Discount } from '../types';

interface DiscountManagementProps {
  token: string;
}

export default function DiscountManagement({ token }: DiscountManagementProps) {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal contexts
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  // Form Fields
  const [promoName, setPromoName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoType, setPromoType] = useState<'percentage' | 'fixed'>('percentage');
  const [promoValue, setPromoValue] = useState('');
  const [promoMemberOnly, setPromoMemberOnly] = useState(false);
  const [promoStart, setPromoStart] = useState('');
  const [promoEnd, setPromoEnd] = useState('');

  // Status indicators
  const [successText, setSuccessText] = useState('');
  const [errorText, setErrorText] = useState('');

  const formatIDR = (num: number) => {
    return 'Rp' + num.toLocaleString('id-ID');
  };

  const loadPromos = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/discounts', { headers });
      if (res.ok) setDiscounts(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromos();
  }, [token]);

  const openAddPromo = () => {
    setEditingDiscount(null);
    setPromoName('');
    setPromoCode('');
    setPromoType('percentage');
    setPromoValue('');
    setPromoMemberOnly(false);
    
    // Default start is today, end is next month
    const todayStr = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().slice(0, 10);
    
    setPromoStart(todayStr);
    setPromoEnd(nextMonthStr);
    setIsModalOpen(true);
  };

  const openEditPromo = (d: Discount) => {
    setEditingDiscount(d);
    setPromoName(d.name);
    setPromoCode(d.code);
    setPromoType(d.type);
    setPromoValue(String(d.value));
    setPromoMemberOnly(d.is_member_only);
    setPromoStart(d.start_date.slice(0, 10));
    setPromoEnd(d.end_date.slice(0, 10));
    setIsModalOpen(true);
  };

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoName || !promoCode || !promoValue || !promoStart || !promoEnd) {
      setErrorText('Seluruh kolom promo wajib diisi dengan lengkap.');
      return;
    }

    const value = Number(promoValue);
    if (isNaN(value) || value <= 0) {
      setErrorText('Nilai potongan harus bermakna positif.');
      return;
    }

    if (promoType === 'percentage' && value > 100) {
      setErrorText('Nilai potongan persentase tidak boleh melebihi 100%.');
      return;
    }

    try {
      const payload = {
        name: promoName,
        code: promoCode.toUpperCase().trim(),
        type: promoType,
        value,
        is_member_only: promoMemberOnly,
        start_date: promoStart,
        end_date: promoEnd
      };

      const method = editingDiscount ? 'PUT' : 'POST';
      const endpoint = editingDiscount ? `/api/discounts/${editingDiscount.id}` : '/api/discounts';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessText(`Promo ${promoName} berhasil dikonfigurasi.`);
        setIsModalOpen(false);
        loadPromos();
        setTimeout(() => setSuccessText(''), 3000);
      } else {
        const err = await res.json();
        setErrorText(err.error || 'Terjadi gangguan pendaftaran promo.');
      }
    } catch (err) {
      setErrorText('Menghubungkan server gagal.');
    }
  };

  // Switch status active trigger
  const handleTogglePromo = async (d: Discount) => {
    try {
      const headers = { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      };
      const res = await fetch(`/api/discounts/${d.id}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_active: !d.is_active })
      });
      if (res.ok) {
        loadPromos();
        setSuccessText(`Status promo ${d.name} berhasil diubah.`);
        setTimeout(() => setSuccessText(''), 3000);
      }
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-espresso">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-darkroast/10 pb-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-[#C89F6A]">Promotions & Campaign Vouchers</span>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-espresso mt-1">Diskon, Voucher & Promo</h1>
        </div>
        <button
          onClick={openAddPromo}
          className="mt-4 md:mt-0 flex items-center space-x-2 px-5 py-2.5 bg-coffee hover:bg-espresso text-milk font-display text-xs uppercase font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ Konfigurasi Promo</span>
        </button>
      </div>

      {/* Success alert */}
      {successText && (
        <div className="bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 p-4 text-xs font-mono font-medium leading-none">
          NOTIFIKASI: {successText}
        </div>
      )}

      {/* VOUCHER TABLE SHEET */}
      <div className="bg-[#FFFDF8] border border-darkroast/10 p-6 overflow-x-auto">
        {loading ? (
          <div className="py-8 text-center text-xs font-mono text-coffee">Membaca program diskon...</div>
        ) : discounts.length > 0 ? (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-darkroast/10 text-[10px] font-mono uppercase tracking-wider bg-[#E8D8C3]/15 text-coffee">
                <th className="py-3 px-4 font-normal">Nama Promosi</th>
                <th className="py-3 px-4 font-normal">Kode Voucher</th>
                <th className="py-3 px-4 font-normal">Besaran Potongan</th>
                <th className="py-3 px-4 font-normal text-center">Tipe Member</th>
                <th className="py-3 px-4 font-normal text-center">Periode Berlaku</th>
                <th className="py-3 px-4 font-normal text-center">Status</th>
                <th className="py-3 px-4 font-normal text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkroast/5 text-xs">
              {discounts.map((d) => {
                const today = new Date().toISOString().slice(0, 10);
                const expired = d.end_date.slice(0, 10) < today;
                return (
                  <tr key={d.id} className="hover:bg-caramel/5">
                    <td className="py-3.5 px-4 font-display font-semibold text-espresso">
                      <div>{d.name}</div>
                      {expired && <span className="text-[9px] text-red-600 font-mono">Expired ⚠️</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="bg-[#E8D8C3]/30 px-2 py-1 border border-caramel/20 font-bold text-[#3B2416]">
                        {d.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold">
                      {d.type === 'percentage' ? `${d.value}% Off` : formatIDR(d.value)}
                    </td>
                    <td className="py-3.5 px-4 text-center select-none">
                      {d.is_member_only ? (
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[9px] font-mono font-bold uppercase">Member Gold Only</span>
                      ) : (
                        <span className="text-coffee font-mono text-[10px]">Siapa Saja / Umum</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-coffee text-[10px]">
                      {new Date(d.start_date).toLocaleDateString('id')} s/d {new Date(d.end_date).toLocaleDateString('id')}
                    </td>
                    <td className="py-3.5 px-4 text-center select-none">
                      <button
                        onClick={() => handleTogglePromo(d)}
                        className={`px-3 py-1 text-[9px] font-mono uppercase font-bold border transition-colors ${d.is_active ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800'}`}
                      >
                        {d.is_active ? 'Aktif' : 'Off'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditPromo(d)}
                        className="p-1.5 hover:bg-caramel hover:text-espresso rounded border border-darkroast/10 transition-colors inline-flex items-center space-x-1"
                        title="Edit Promo Campaign"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono">Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-xs italic text-coffee">
            Belum ada voucher potongan harga terekam. Klik "+ Konfigurasi Promo" di kanan atas.
          </div>
        )}
      </div>

      {/* --- ADD/EDIT PROMO DIALOG --- */}
      {isModalOpen && (
        <div id="modal-promo-config-form" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] border-2 border-espresso max-w-sm w-full p-6 space-y-5 relative animate-fade-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-coffee hover:text-espresso"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-[#C89F6A]">Formulir Promo</span>
              <h2 className="text-xl font-display font-bold text-espresso">
                {editingDiscount ? 'Perbarui Konfig Promo' : 'Daftarkan Campaign Promo'}
              </h2>
            </div>

            {errorText && (
              <div className="bg-red-50 text-red-800 border-l-4 border-red-600 p-3 text-xs font-mono">
                {errorText}
              </div>
            )}

            <form onSubmit={handlePromoSubmit} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">Nama Program Promo</label>
                <input
                  type="text"
                  placeholder="Contoh: Diskon Gajian Akhir Bulan"
                  value={promoName}
                  onChange={(e) => setPromoName(e.target.value)}
                  className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 outline-none focus:border-caramel"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold font-mono">Kode Akses Voucher (Capital)</label>
                <input
                  type="text"
                  placeholder="Contoh: YACOFFEE20"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 uppercase font-mono font-bold outline-none focus:border-caramel text-espresso"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold font-mono">Model Potongan</label>
                  <select
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2.2 text-xs outline-none focus:border-caramel"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Aman)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold font-mono">Nilai Potongan</label>
                  <input
                    type="number"
                    placeholder="20 atau 5000"
                    value={promoValue}
                    onChange={(e) => setPromoValue(e.target.value)}
                    className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 pl-4 font-mono font-bold outline-none focus:border-caramel"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 py-1 border-t border-b border-darkroast/5">
                <input
                  type="checkbox"
                  id="chk-promo-crm"
                  checked={promoMemberOnly}
                  onChange={(e) => setPromoMemberOnly(e.target.checked)}
                  className="accent-espresso w-4 h-4 cursor-pointer"
                />
                <label htmlFor="chk-promo-crm" className="text-xs text-coffee font-mono select-none cursor-pointer">
                  Hanya Berlaku untuk GOLD MEMBER CRM
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold font-mono">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={promoStart}
                    onChange={(e) => setPromoStart(e.target.value)}
                    className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-1.5 text-xs outline-none focus:border-caramel font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold font-mono">Hingga Tanggal</label>
                  <input
                    type="date"
                    value={promoEnd}
                    onChange={(e) => setPromoEnd(e.target.value)}
                    className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-1.5 text-xs outline-none focus:border-caramel font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-espresso cursor-pointer hover:bg-caramel text-milk hover:text-espresso text-xs font-display font-semibold uppercase tracking-wider transition-colors pt-3"
              >
                Simpan Konfigurasi
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
