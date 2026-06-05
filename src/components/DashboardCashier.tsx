/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingCart, LogIn, Award, ListFilter, CreditCard, ChevronRight } from 'lucide-react';
import { User, Transaction } from '../types';

interface DashboardCashierProps {
  user: User;
  token: string;
  onNavigateToTab: (tabId: string) => void;
}

export default function DashboardCashier({ user, token, onNavigateToTab }: DashboardCashierProps) {
  const [cashierTx, setCashierTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyTransactions() {
      try {
        setLoading(true);
        const headers = { 'Authorization': `Bearer ${token}` };
        const res = await fetch('/api/transactions', { headers });
        if (res.ok) {
          const list = await res.json();
          // Security filter (just in case) - only show owned by this cashier
          setCashierTx(list.filter((t: Transaction) => t.cashier_id === user.id));
        }
      } catch (err) {
        console.error('Failed to load cashier history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMyTransactions();
  }, [token, user.id]);

  // Total sales today from this cashier
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysTx = cashierTx.filter(t => t.transaction_date.startsWith(todayStr));
  const todaysOmzetLog = todaysTx.reduce((sum, t) => sum + t.grand_total, 0);

  const formatIDR = (num: number) => {
    return 'Rp' + num.toLocaleString('id-ID');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-12 h-12 border-4 border-caramel border-t-transparent rounded-full animate-spin"></div>
        <p className="font-display text-sm tracking-wider uppercase text-coffee animate-pulse">Menghubungkan Server...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      
      {/* Visual greeting card banner */}
      <div className="bg-espresso text-milk p-8 flex flex-col md:flex-row md:items-center md:justify-between border border-caramel/10 relative overflow-hidden">
        {/* Subtle geometric layout helper decoration */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-6 translate-x-6">
          <ShoppingCart className="w-64 h-64 text-caramel" />
        </div>

        <div className="space-y-1.5 z-10">
          <span className="text-[10px] tracking-widest uppercase font-mono text-caramel">Aktif Shift Kasir</span>
          <h1 className="text-3xl font-display font-bold tracking-tight">Selamat Bertugas, {user.name}!</h1>
          <p className="text-sm text-latte max-w-lg">Ramu kopi terbaik dan layani pelanggan Ya Kopi dengan cepat, nyaman, dan senyum hangat.</p>
        </div>

        {/* Dynamic CTA trigger to immediately register sales */}
        <button
          onClick={() => onNavigateToTab('pos')}
          id="btn-cashier-start-pos"
          className="mt-6 md:mt-0 px-6 py-4 bg-caramel text-espresso font-display font-bold uppercase tracking-wider text-sm rounded-none hover:bg-milk hover:text-espresso transition-all duration-150 z-10 flex items-center space-x-3.5"
        >
          <ShoppingCart className="w-[18px] h-[18px]" />
          <span>Mulai POS Transaksi</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* KPI block for Cashier current performance metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Cashier Daily performance target widget */}
        <div className="bg-[#FFFDF8] border border-darkroast/10 p-6 flex items-start space-x-5">
          <div className="bg-latte text-[#3B2416] p-3 rounded border border-caramel/25">
            <Award className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-coffee">Omzet Anda Hari Ini</span>
            <p className="text-2xl font-display font-semibold text-darkroast leading-none mt-1 mono-text">
              {formatIDR(todaysOmzetLog)}
            </p>
            <p className="text-[11px] text-coffee">Hasil shift lunas Anda hari ini</p>
          </div>
        </div>

        {/* Cashier total order counts */}
        <div className="bg-[#FFFDF8] border border-darkroast/10 p-6 flex items-start space-x-5">
          <div className="bg-latte text-[#3B2416] p-3 rounded border border-caramel/25">
            <ShoppingCart className="w-64 h-64 max-w-6 max-h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-coffee">Nota Ditangani Anda</span>
            <p className="text-2xl font-display font-semibold text-darkroast leading-none mt-1">
              {todaysTx.length} <span className="text-sm font-normal text-coffee font-sans">Nota</span>
            </p>
            <p className="text-[11px] text-coffee">Transaksi lunas laku terdaftar</p>
          </div>
        </div>

        {/* Average transaction amount */}
        <div className="bg-[#FFFDF8] border border-darkroast/10 p-6 flex items-start space-x-5">
          <div className="bg-latte text-[#3B2416] p-3 rounded border border-caramel/25">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-widest text-coffee">Rata-rata Penjualan</span>
            <p className="text-2xl font-display font-semibold text-darkroast leading-none mt-1 mono-text">
              {formatIDR(todaysTx.length > 0 ? Math.round(todaysOmzetLog / todaysTx.length) : 0)}
            </p>
            <p className="text-[11px] text-coffee">Ukuran keranjang belanja nominal rata-rata</p>
          </div>
        </div>

      </div>

      {/* Cashier list of active transactions for today */}
      <div className="bg-[#FFFDF8] border border-darkroast/10 p-6">
        <div className="flex justify-between items-center border-b border-darkroast/5 pb-4 mb-4">
          <div>
            <h3 className="text-lg font-display font-semibold text-espresso">Riwayat Penjualan Anda Hari Ini</h3>
            <p className="text-xs text-coffee mt-0.5">Daftar transaksi yang Anda proses dalam shift tanggal {new Date().toLocaleDateString('id-ID')}</p>
          </div>
          <button 
            onClick={() => onNavigateToTab('history')}
            className="text-xs font-mono font-semibold uppercase text-coffee hover:text-caramel underline"
          >
            Semua Nota Saya →
          </button>
        </div>

        <div className="overflow-x-auto">
          {todaysTx.length > 0 ? (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-darkroast/10 text-[10px] font-mono tracking-wider text-coffee uppercase bg-[#E8D8C3]/15">
                  <th className="py-3 px-4 font-normal">Nomor Nota</th>
                  <th className="py-3 px-4 font-normal">Waktu</th>
                  <th className="py-3 px-4 font-normal">Tipe Bayar</th>
                  <th className="py-3 px-4 font-normal text-right">Potongan</th>
                  <th className="py-3 px-4 font-normal text-right">Total Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-darkroast/5">
                {todaysTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-caramel/5 transition-colors">
                    <td className="py-3.5 px-4 font-display font-semibold text-espresso">{tx.transaction_number}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-coffee">
                      {new Date(tx.transaction_date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono">
                      <span className="bg-latte/70 px-2 py-0.5 text-espresso border border-caramel/15 text-[10px] uppercase tracking-wider font-semibold">
                        {tx.payment_method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-red-600 font-medium">-{formatIDR(tx.discount_amount)}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#1E130C]">{formatIDR(tx.grand_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <ShoppingCart className="w-10 h-10 text-caramel mx-auto opacity-40 mb-3" />
              <p className="text-sm font-display text-espresso font-medium">Belum ada transaksi hari ini</p>
              <p className="text-xs text-coffee mt-1">Gunakan tombol 'Mulai POS Transaksi' di atas untuk melayani pelanggan pertama Anda!</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
