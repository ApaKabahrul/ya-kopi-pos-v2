/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Wallet, CreditCard, ChevronDown, RefreshCw, 
  Percent, DollarSign, TrendingUp, Presentation, ArrowUpRight
} from 'lucide-react';

interface SalesReportProps {
  token: string;
}

interface ProfitReportData {
  revenue: number;
  cogs: number;
  grossProfit: number;
  profitMargin: number;
  productBreakdown: Array<{
    id: string;
    name: string;
    stock: number;
    quantitySold: number;
    revenue: number;
    cogs: number;
    profit: number;
  }>;
}

export default function SalesReport({ token }: SalesReportProps) {
  const [profitData, setProfitData] = useState<ProfitReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');

  // Daily / Monthly totals indicators (loaded to give context)
  const [dailyRev, setDailyRev] = useState(0);
  const [monthlyRev, setMonthlyRev] = useState(0);
  const [yearlyRev, setYearlyRev] = useState(0);

  const formatIDR = (num: number) => {
    return 'Rp' + num.toLocaleString('id-ID');
  };

  const loadFinancials = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [profitRes, dailyRes, monthlyRes, yearlyRes] = await Promise.all([
        fetch('/api/reports/profit', { headers }),
        fetch('/api/reports/sales/daily', { headers }),
        fetch('/api/reports/sales/monthly', { headers }),
        fetch('/api/reports/sales/yearly', { headers })
      ]);

      if (profitRes.ok) setProfitData(await profitRes.json());
      if (dailyRes.ok) {
        const d = await dailyRes.json();
        setDailyRev(d.revenue || 0);
      }
      if (monthlyRes.ok) {
        const m = await monthlyRes.json();
        setMonthlyRev(m.revenue || 0);
      }
      if (yearlyRes.ok) {
        const y = await yearlyRes.json();
        setYearlyRev(y.revenue || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancials();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-12 h-12 border-4 border-caramel border-t-transparent rounded-full animate-spin"></div>
        <p className="font-display text-sm tracking-wider uppercase text-coffee animate-pulse">Menghitung Laba Rugi...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-espresso">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-darkroast/10 pb-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-caramel">Sales, HPP & Profit Analytics</span>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-espresso mt-1">Laporan Keuangan & Margin Profit</h1>
        </div>
        <button
          onClick={loadFinancials}
          className="mt-4 md:mt-0 flex items-center space-x-2 px-4 py-2 bg-[#FFFDF8] border border-darkroast/10 text-xs font-mono font-semibold uppercase hover:border-caramel transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Hitung Ulang</span>
        </button>
      </div>

      {/* THREE VALUE CONTEXT HORIZON GRIDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#3B2416] text-[#FFFDF8] p-6 border border-[#3B2416] flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#C89F6A] font-bold">Total Pendapatan Hari Ini</span>
          <h3 className="text-3xl font-display font-bold mt-4 tracking-tight leading-none mono-text">{formatIDR(dailyRev)}</h3>
          <p className="text-[10px] text-[#F3E5D0] mt-3 font-mono">Penjualan lunas laku di kasir</p>
        </div>
        <div className="bg-espresso text-[#FFFDF8] p-6 border border-espresso flex flex-col justify-between">
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#E8D8C3] font-bold">Total Pendapatan Bulan Ini</span>
          <h3 className="text-3xl font-display font-bold mt-4 tracking-tight leading-none mono-text">{formatIDR(monthlyRev)}</h3>
          <p className="text-[10px] text-[#F3E5D0] mt-3 font-mono">Periode: {new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="bg-[#FFFDF8] border border-darkroast/10 p-6 flex flex-col justify-between text-espresso">
          <span className="text-[10px] uppercase font-mono tracking-widest text-coffee font-bold">Akumulasi Penjualan Tahunan</span>
          <h3 className="text-3xl font-display font-bold mt-4 tracking-tight leading-none mono-text">{formatIDR(yearlyRev)}</h3>
          <p className="text-[10px] text-coffee mt-3 font-mono">Tahun pembukuan: {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* PROFIT SPLIT SUMMARY AND GRIDS */}
      {profitData && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          <div className="bg-[#FFFDF8] border border-darkroast/10 p-5 space-y-1.5 hover:border-caramel transition-colors">
            <span className="text-[9px] uppercase font-mono tracking-wider font-semibold text-coffee">Kotor Revenue (Subtotal)</span>
            <p className="text-xl font-mono font-bold text-espresso leading-none">{formatIDR(profitData.revenue)}</p>
            <p className="text-[10px] text-coffee">Omzet sebelum potong biaya modal</p>
          </div>

          <div className="bg-[#FFFDF8] border border-darkroast/10 p-5 space-y-1.5 hover:border-caramel transition-colors">
            <span className="text-[9px] uppercase font-mono tracking-wider font-semibold text-coffee">Total HPP / Bahan Baku</span>
            <p className="text-xl font-mono font-bold text-red-800 leading-none">{formatIDR(profitData.cogs)}</p>
            <p className="text-[10px] text-coffee">Biaya rill bahan yang terproduksi</p>
          </div>

          <div className="bg-[#FFFDF8] border border-darkroast/10 p-5 space-y-1.5 hover:border-caramel transition-colors">
            <span className="text-[9px] uppercase font-mono tracking-wider font-semibold text-coffee">Gross Laba Bersih</span>
            <p className="text-xl font-mono font-bold text-emerald-800 leading-none">{formatIDR(profitData.grossProfit)}</p>
            <p className="text-[10px] text-coffee">Laba kotor setelah modal cogs</p>
          </div>

          <div className="bg-[#FFFDF8] border border-darkroast/10 p-5 space-y-1.5 hover:border-caramel transition-colors">
            <span className="text-[9px] uppercase font-mono tracking-wider font-semibold text-coffee">Margin Profitabilitas</span>
            <p className="text-xl font-mono font-bold text-darkroast leading-none">{profitData.profitMargin}%</p>
            <p className="text-[10px] text-coffee">Rasio profit banding omzet kotor</p>
          </div>

        </div>
      )}

      {/* DETAILED PROFIT PER MENU ITEM SHEET */}
      <div className="bg-[#FFFDF8] border border-darkroast/10 p-6">
        <div className="flex justify-between items-center border-b border-darkroast/5 pb-4 mb-4">
          <div>
            <h3 className="text-lg font-display font-semibold text-espresso">Daftar Kontribusi Profit per Menu</h3>
            <p className="text-xs text-coffee mt-0.5">Analisis HPP (Harga Pokok Penjualan) dibanding harga rill terjual dari menu kopi & snack.</p>
          </div>
          <span className="text-xs font-mono bg-espresso text-milk px-3 py-1 font-semibold">Margin Analisis</span>
        </div>

        <div className="overflow-x-auto">
          {profitData && profitData.productBreakdown && profitData.productBreakdown.length > 0 ? (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-darkroast/10 text-[10px] font-mono uppercase tracking-wider bg-[#E8D8C3]/15 text-coffee">
                  <th className="py-2 px-4 font-normal">Nama Kopi / Snack</th>
                  <th className="py-2 px-4 font-normal text-center">Porsi Terjual</th>
                  <th className="py-2 px-4 font-normal text-right">Revenue Tercipta</th>
                  <th className="py-2 px-4 font-normal text-right">Modal Bahan COGS</th>
                  <th className="py-2 px-4 font-normal text-right">Laba Bersih</th>
                  <th className="py-2 px-4 font-normal text-right">Kontribusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-darkroast/5 text-xs">
                {profitData.productBreakdown.map((item) => {
                  const contribRatio = profitData.grossProfit > 0 ? Number(((item.profit / profitData.grossProfit) * 100).toFixed(1)) : 0;
                  return (
                    <tr key={item.id} className="hover:bg-caramel/5">
                      <td className="py-3 px-4 font-display font-semibold text-espresso">{item.name}</td>
                      <td className="py-3 px-4 text-center font-mono font-medium text-sm text-[#3B2416]">{item.quantitySold} saji</td>
                      <td className="py-3 px-4 text-right font-mono">{formatIDR(item.revenue)}</td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-red-700">-{formatIDR(item.cogs)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-800 font-semibold">{formatIDR(item.profit)}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${contribRatio > 15 ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' : 'bg-beige/40 text-coffee'}`}>
                          {contribRatio}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-sm text-coffee italic">
              Belum ada data penjualan kopi terekam untuk menyusun lembar HPP laba rugi.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
