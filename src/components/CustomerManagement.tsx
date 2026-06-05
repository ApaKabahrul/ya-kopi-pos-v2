/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Edit, Eye, UserPlus, 
  Smile, Award, Trash2, X, ShoppingBag
} from 'lucide-react';
import { Customer, Transaction } from '../types';

interface CustomerManagementProps {
  token: string;
}

export default function CustomerManagement({ token }: CustomerManagementProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search parameters
  const [searchTerm, setSearchTerm] = useState('');

  // form modal parameters
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custStatus, setCustStatus] = useState<'regular' | 'member'>('regular');
  const [custPoints, setCustPoints] = useState('0');

  // History detail modal states
  const [selectedHistoryCust, setSelectedHistoryCust] = useState<Customer | null>(null);
  const [customerTx, setCustomerTx] = useState<Transaction[]>([]);

  // status notifications
  const [successText, setSuccessText] = useState('');
  const [errorText, setErrorText] = useState('');

  const formatIDR = (num: number) => {
    return 'Rp' + num.toLocaleString('id-ID');
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/customers', { headers });
      if (res.ok) setCustomers(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [token]);

  // Open Add modal
  const openAddCustomer = () => {
    setEditingCustomer(null);
    setCustName('');
    setCustEmail('');
    setCustPhone('');
    setCustStatus('regular');
    setCustPoints('0');
    setIsModalOpen(true);
  };

  // Open Edit modal
  const openEditCustomer = (c: Customer) => {
    setEditingCustomer(c);
    setCustName(c.name);
    setCustEmail(c.email || '');
    setCustPhone(c.phone || '');
    setCustStatus(c.member_status);
    setCustPoints(String(c.points));
    setIsModalOpen(true);
  };

  // View historical purchases
  const viewCustomerTransactions = async (c: Customer) => {
    try {
      setSelectedHistoryCust(c);
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/transactions', { headers });
      if (res.ok) {
        const allTx = await res.json() as Transaction[];
        setCustomerTx(allTx.filter(t => t.customer_id === c.id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Form submit (create / update)
  const handleCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName) {
      setErrorText('Nama customer wajib diisi.');
      return;
    }

    try {
      const payload = {
        name: custName,
        email: custEmail || null,
        phone: custPhone || null,
        member_status: custStatus,
        points: Number(custPoints) || 0
      };

      const method = editingCustomer ? 'PUT' : 'POST';
      const endpoint = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessText(`Customer ${custName} berhasil ${editingCustomer ? 'diperbarui' : 'terdaftar'}.`);
        setIsModalOpen(false);
        loadCustomers();
        setTimeout(() => setSuccessText(''), 3000);
      } else {
        const err = await res.json();
        setErrorText(err.error || 'Terjadi kesalahan menyimpan data CRM.');
      }
    } catch (err) {
      setErrorText('Koneksi internet server terputus.');
    }
  };

  const filteredCustomers = customers.filter(c => {
    const q = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(q) ||
           (c.email || '').toLowerCase().includes(q) ||
           (c.phone || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 animate-fade-in text-espresso">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-darkroast/10 pb-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-[#C89F6A]">CRM & Customer Retention</span>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-espresso mt-1 font-bold">Data Member & CRM</h1>
        </div>
        <button
          onClick={openAddCustomer}
          className="mt-4 md:mt-0 flex items-center space-x-2 px-5 py-2.5 bg-coffee hover:bg-espresso text-milk font-display text-xs uppercase font-semibold transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Daftarkan Customer</span>
        </button>
      </div>

      {/* Toast Notifier */}
      {successText && (
        <div className="bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 p-4 text-xs font-mono font-medium leading-none">
          NOTIFIKASI: {successText}
        </div>
      )}

      {/* SEARCH CARD */}
      <div className="bg-[#FFFDF8] border border-darkroast/10 p-4 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-coffee absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari member lewat nama, telepon atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#E8D8C3]/10 text-xs pl-10 pr-4 py-2.5 outline-none border border-darkroast/10 focus:border-caramel placeholder-coffee"
          />
        </div>
      </div>

      {/* CUSTOMERS MAIN LIST */}
      <div className="bg-[#FFFDF8] border border-darkroast/10 p-6 overflow-x-auto">
        {loading ? (
          <div className="py-8 text-center text-xs font-mono text-coffee">Membuka CRM...</div>
        ) : filteredCustomers.length > 0 ? (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-darkroast/10 text-[10px] font-mono uppercase tracking-wider bg-[#E8D8C3]/15 text-coffee">
                <th className="py-3 px-4 font-normal">Nama Pelanggan</th>
                <th className="py-3 px-4 font-normal">Kontak Informasi</th>
                <th className="py-3 px-4 font-normal text-center">Status Member</th>
                <th className="py-3 px-4 font-normal text-center">Akumulasi Point</th>
                <th className="py-3 px-4 font-normal text-right">Manajemen CRM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkroast/5 text-xs">
              {filteredCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-caramel/5">
                  <td className="py-3.5 px-4 font-display font-semibold text-espresso">{c.name}</td>
                  <td className="py-3.5 px-4 font-mono text-coffee">
                    <div>{c.phone || '-'}</div>
                    <div className="text-[10px] text-coffee/70">{c.email || 'tanpa-email'}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center select-none">
                    {c.member_status === 'member' ? (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1 text-[9px] font-mono uppercase font-bold tracking-wider">
                        ★ Member Gold
                      </span>
                    ) : (
                      <span className="bg-latte text-espresso border border-caramel/15 px-3 py-1 text-[9px] font-mono uppercase font-bold tracking-wider">
                        Reguler Umum
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-sm text-[#3B2416]">{c.points} pts</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => viewCustomerTransactions(c)}
                        className="p-1.5 hover:bg-caramel hover:text-espresso rounded border border-darkroast/10 transition-colors inline-flex items-center space-x-1 text-[10px] font-mono"
                        title="Lihat Histori Keranjang"
                      >
                        <Eye className="w-3.5 h-3.5 mr-0.5" />
                        <span>Histori</span>
                      </button>
                      <button
                        onClick={() => openEditCustomer(c)}
                        className="p-1.5 hover:bg-caramel hover:text-espresso rounded border border-darkroast/10 transition-colors"
                        title="Edit Data CRM"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 italic text-coffee text-xs">
             CRM Kosong. Terbangkan CRM dengan mengeklik "+ Daftarkan Customer" di pojok kanan atas.
          </div>
        )}
      </div>

      {/* --- ADD/EDIT CUSTOMER MODAL DIALOG --- */}
      {isModalOpen && (
        <div id="modal-customer-crm-form" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] border-2 border-espresso max-w-sm w-full p-6 space-y-5 relative animate-fade-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-coffee hover:text-espresso"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-[#C89F6A]">Formulir CRM</span>
              <h2 className="text-xl font-display font-bold text-espresso">{editingCustomer ? 'Perbarui Profil Customer' : 'Daftarkan Customer Baru'}</h2>
            </div>

            {errorText && (
              <div className="bg-red-50 text-red-800 border-l-4 border-red-600 p-3 text-xs font-mono">
                {errorText}
              </div>
            )}

            <form onSubmit={handleCustomerSubmit} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Contoh: Budi GenZ"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 outline-none focus:border-caramel"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">Nomor Ponsel (WhatsApp/HP)</label>
                <input
                  type="text"
                  placeholder="Contoh: 08129999xxxx"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 outline-none focus:border-caramel"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">E-mail Aktif</label>
                <input
                  type="email"
                  placeholder="Contoh: budi@kopi.com"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                  className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 outline-none focus:border-caramel"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">Level Member</label>
                  <select
                    value={custStatus}
                    onChange={(e) => setCustStatus(e.target.value as 'regular' | 'member')}
                    className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 text-xs outline-none focus:border-caramel"
                  >
                    <option value="regular">Regular</option>
                    <option value="member">Gold Member</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-mono tracking-widest text-coffee font-semibold">Poin CRM</label>
                  <input
                    type="number"
                    value={custPoints}
                    onChange={(e) => setCustPoints(e.target.value)}
                    className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 font-mono outline-none focus:border-caramel"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-espresso cursor-pointer hover:bg-caramel text-milk hover:text-espresso text-xs font-display font-semibold uppercase tracking-wider transition-colors pt-3"
              >
                Simpan Profil CRM
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- SELECTED CUSTOMER PURCHASE HISTORY MODAL --- */}
      {selectedHistoryCust && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] border-2 border-espresso max-w-md w-full p-6 space-y-4 relative animate-fade-in text-espresso">
            <button
              onClick={() => setSelectedHistoryCust(null)}
              className="absolute top-4 right-4 text-coffee hover:text-[#1E130C]"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-caramel font-semibold">Customer Ledger CRM</span>
              <h3 className="text-lg font-display font-bold text-espresso">Histori Belanja: {selectedHistoryCust.name}</h3>
              <p className="text-xs text-coffee mt-0.5">Total transaksi terekam: <span className="font-bold underline">{customerTx.length} nota lunas</span></p>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-3.5 text-xs pr-1">
              {customerTx.length > 0 ? (
                customerTx.map((tx) => (
                  <div key={tx.id} className="p-3 bg-[#F3E5D0]/20 border border-caramel/15 flex justify-between items-center leading-snug">
                    <div>
                      <p className="font-mono font-bold text-darkroast">#{tx.transaction_number}</p>
                      <p className="text-[10px] text-coffee mt-0.5">{new Date(tx.transaction_date).toLocaleDateString('id')}</p>
                      <p className="text-[9.5px] text-[#6F4E37] font-mono mt-0.5">Bayar: {tx.payment_method}</p>
                    </div>
                    <div className="text-right font-mono">
                      <p className="font-bold text-sm text-espresso">{formatIDR(tx.grand_total)}</p>
                      <p className="text-[9.5px] text-red-600">disc: -{formatIDR(tx.discount_amount)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-coffee italic">
                  Belum ada pembelokan menu transaksi tercatat atas nama member ini.
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedHistoryCust(null)}
              className="w-full py-2 bg-espresso text-milk hover:bg-caramel hover:text-espresso transition-colors font-display text-xs uppercase font-semibold"
            >
              Tutup Histori CRM
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
