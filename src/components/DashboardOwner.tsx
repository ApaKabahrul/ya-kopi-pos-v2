/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, ShoppingBag, DollarSign, Package, 
  ArrowUpRight, AlertTriangle, UserCheck, Calendar, Activity
} from 'lucide-react';
import { Product, Transaction, InventoryLog } from '../types';

interface DashboardOwnerProps {
  token: string;
  onNavigateToTab: (tabId: string) => void;
}

interface DailySummary {
  date: string;
  revenue: number;
  transactionsCount: number;
  avgOrderValue: number;
  itemsSoldToday: number;
  paymentDistribution: Record<string, number>;
}

interface MonthlySummary {
  month: string;
  revenue: number;
  transactionsCount: number;
  chartData: Array<{ date: string; revenue: number; count: number }>;
}

interface BestSeller {
  id: string;
  name: string;
  category: string;
  quantitySold: number;
  totalRevenue: number;
}

interface ProfitReport {
  revenue: number;
  cogs: number;
  grossProfit: number;
  profitMargin: number;
}

interface LowStock {
  id: string;
  name: string;
  category_name: string;
  stock: number;
  minimum_stock: number;
}

interface SystemLog {
  id: string;
  user_name: string;
  action: string;
  description: string;
  created_at: string;
}

export default function DashboardOwner({ token, onNavigateToTab }: DashboardOwnerProps) {
  const [daily, setDaily] = useState<DailySummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlySummary | null>(null);
  const [bestSellers, setBestSellers] = useState<BestSeller[]>([]);
  const [profit, setProfit] = useState<ProfitReport | null>(null);
  const [lowStocks, setLowStocks] = useState<LowStock[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [dailyRes, monthlyRes, bestRes, profitRes, lowRes, logsRes] = await Promise.all([
          fetch('/api/reports/sales/daily', { headers }),
          fetch('/api/reports/sales/monthly', { headers }),
          fetch('/api/reports/best-selling-products', { headers }),
          fetch('/api/reports/profit', { headers }),
          fetch('/api/inventory/low-stock', { headers }),
          fetch('/api/system/activity-logs', { headers })
        ]);

        if (dailyRes.ok) setDaily(await dailyRes.json());
        if (monthlyRes.ok) setMonthly(await monthlyRes.json());
        if (bestRes.ok) setBestSellers(await bestRes.json());
        if (profitRes.ok) setProfit(await profitRes.json());
        if (lowRes.ok) setLowStocks(await lowRes.json());
        if (logsRes.ok) setSystemLogs(await logsRes.json());
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [token]);

  // Helper formatting currencies Rupiah
  const formatIDR = (num: number) => {
    return 'Rp' + num.toLocaleString('id-ID');
  };

  // Find max chart revenue for scaling layout
  const maxRevenue = monthly?.chartData.reduce((max, d) => Math.max(max, d.revenue), 1) || 1;

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
      {/* Top Welcome Title Grid */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b-2 border-darkroast pb-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-[#C89F6A] font-bold">Kinerja Bisnis Anda</span>
          <h1 className="text-4xl font-display font-black tracking-tighter text-darkroast mt-1 uppercase">Ringkasan Owner</h1>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2 text-xs font-mono bg-latte px-3.5 py-2 border border-darkroast text-darkroast font-bold">
          <Calendar className="w-3.5 h-3.5 text-darkroast" />
          <span>Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Daily Sales Card */}
        <div className="bg-[#FFFDF8] border-2 border-darkroast p-6 flex flex-col justify-between hover:bg-latte transition-colors cursor-default">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-mono tracking-wider text-darkroast font-bold">Omzet Hari Ini</span>
            <span className="bg-darkroast text-milk p-1.5 border border-darkroast">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-3xl font-display font-black tracking-tighter text-darkroast mono-text leading-none">
              {formatIDR(daily?.revenue || 0)}
            </h3>
            <div className="flex justify-between items-center mt-3 text-xs text-darkroast/80 pt-3 border-t border-darkroast border-dashed font-bold font-sans">
              <span>{daily?.transactionsCount || 0} Penjualan</span>
              <span>Avg {formatIDR(daily?.avgOrderValue || 0)}</span>
            </div>
          </div>
        </div>

        {/* Monthly Sales Card */}
        <div className="bg-[#FFFDF8] border-2 border-darkroast p-6 flex flex-col justify-between hover:bg-latte transition-colors cursor-default">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-mono tracking-wider text-darkroast font-bold">Omzet Bulan Ini</span>
            <span className="bg-darkroast text-milk p-1.5 border border-darkroast">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-3xl font-display font-black tracking-tighter text-darkroast mono-text leading-none">
              {formatIDR(monthly?.revenue || 0)}
            </h3>
            <div className="flex justify-between items-center mt-3 text-xs text-darkroast/80 pt-3 border-t border-darkroast border-dashed font-bold font-sans">
              <span className="uppercase">{new Date().toLocaleString('id-ID', { month: 'long' })}</span>
              <span>{monthly?.transactionsCount || 0} Nota Lunas</span>
            </div>
          </div>
        </div>

        {/* Profit Card */}
        <div className="bg-[#FFFDF8] border-2 border-darkroast p-6 flex flex-col justify-between hover:bg-latte transition-colors cursor-default">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-mono tracking-wider text-darkroast font-bold">Estimasi Untung</span>
            <span className="bg-emerald-800 text-milk p-1.5 border border-darkroast">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-3xl font-display font-black tracking-tighter text-darkroast mono-text leading-none">
              {formatIDR(profit?.grossProfit || 0)}
            </h3>
            <div className="flex justify-between items-center mt-3 text-xs text-darkroast/80 pt-3 border-t border-darkroast border-dashed font-bold font-sans">
              <span>Margin {profit?.profitMargin || 0}%</span>
              <span>Modal: {formatIDR(profit?.cogs || 0)}</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts Card */}
        <div className="bg-[#FFFDF8] border-2 border-darkroast p-6 flex flex-col justify-between hover:bg-latte transition-colors cursor-default">
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-mono tracking-wider text-darkroast font-bold">Warning Stok</span>
            <span className={`p-1.5 border border-darkroast ${lowStocks.length > 0 ? 'bg-amber-500 text-darkroast' : 'bg-emerald-800 text-milk'}`}>
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-6">
            <h3 className="text-3xl font-display font-black tracking-tighter text-darkroast leading-none">
              {lowStocks.length} <span className="text-base text-darkroast font-mono font-bold">Item</span>
            </h3>
            <div className="flex justify-between items-center mt-3 text-xs pt-3 border-t border-darkroast border-dashed font-bold font-mono">
              {lowStocks.length > 0 ? (
                <>
                  <span className="text-amber-700 flex items-center space-x-1 font-bold font-mono animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    <span>PERLU RESTOCK</span>
                  </span>
                  <button 
                    onClick={() => onNavigateToTab('inventory')}
                    className="text-darkroast hover:underline font-bold"
                  >
                    Atur Stok →
                  </button>
                </>
              ) : (
                <span className="text-emerald-800 font-bold uppercase">STOK AMAN AMAN SAJA</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Analytical Chart and Low Stock List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sales Chart Panel (Vite/TypeScript compiled minimalist bar model matching Swiss styling) */}
        <div className="bg-[#FFFDF8] border-2 border-darkroast p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start pb-4 border-b border-darkroast">
              <div>
                <span className="text-xs uppercase font-mono tracking-wider text-caramel font-bold">Visual Tren Pendapatan</span>
                <h3 className="text-xl font-display font-black text-darkroast uppercase tracking-tight">Omzet 30 Hari Terakhir</h3>
              </div>
              <Activity className="w-5 h-5 text-darkroast" />
            </div>
            
            {/* Geometric minimal bar representation */}
            <div className="mt-8 flex items-end justify-between h-48 border-b-2 border-darkroast pb-2 space-x-1.5">
              {monthly?.chartData && monthly.chartData.length > 0 ? (
                monthly.chartData.slice(-15).map((d, idx) => {
                  const barHeight = (d.revenue / maxRevenue) * 100;
                  const dayNum = d.date.split('-')[2];
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Hover Tooltip */}
                      <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-darkroast text-milk text-[10px] font-mono px-2 py-1 rounded-none border border-darkroast z-15 whitespace-nowrap">
                        {d.date.substring(5)}: {formatIDR(d.revenue)}
                      </span>
                      
                      {/* Bar itself */}
                      <div 
                        style={{ height: `${Math.max(4, barHeight)}%` }} 
                        className={`w-full transition-all duration-150 ${d.revenue > 0 ? 'bg-darkroast group-hover:bg-caramel' : 'bg-[#E8D8C3]/20'}`}
                      ></div>
                      
                      {/* X label */}
                      <span className="text-[9px] font-mono text-darkroast mt-1.5 font-bold">{dayNum}</span>
                    </div>
                  );
                })
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-darkroast/60 italic font-mono uppercase font-bold">
                  Belum ada data transaksi bulan ini
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center text-[10px] text-darkroast uppercase font-mono font-bold">
            <span>Sumbu X: Tanggal Hari</span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 bg-darkroast inline-block border border-darkroast"></span>
              <span>Omzet (Rp)</span>
            </span>
          </div>
        </div>

        {/* Low Stock Warning List / Small sidebar widget */}
        <div className="bg-[#FFFDF8] border-2 border-darkroast p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b-2 border-darkroast pb-4">
              <h3 className="text-lg font-display font-black text-darkroast uppercase tracking-tight">Alert Rendah Stok</h3>
              <span className="text-xs bg-red-100 text-red-850 border border-darkroast px-2.5 py-0.5 font-mono uppercase font-bold">
                {lowStocks.length} Item
              </span>
            </div>

            <div className="mt-4 space-y-3 max-h-[220px] overflow-y-auto">
              {lowStocks.length > 0 ? (
                lowStocks.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-[#FFFDF8] border border-darkroast">
                    <div>
                      <p className="font-display font-bold text-sm text-darkroast uppercase leading-none">{p.name}</p>
                      <p className="text-[10px] font-mono text-darkroast/60 tracking-wider uppercase mt-1">{p.category_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm font-black text-red-700">{p.stock} porsi</p>
                      <p className="text-[10px] text-darkroast/60 mt-0.5 font-mono">Min: {p.minimum_stock}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-darkroast/60 italic font-mono uppercase font-bold">
                  AMBIL NAFAS: SEMUA STOK AMAN
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => onNavigateToTab('inventory')}
            className="w-full mt-6 py-3.5 bg-darkroast text-milk font-display text-xs font-black text-center uppercase tracking-widest hover:bg-caramel hover:text-darkroast transition-colors duration-150 border border-darkroast"
          >
            Manajemen Inventory →
          </button>
        </div>
      </div>

      {/* Outer Row: Best Sellers & System Activity Logs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Best Selling Products */}
        <div className="bg-[#FFFDF8] border-2 border-darkroast p-6">
          <div className="flex justify-between items-center border-b border-darkroast pb-4 mb-4">
            <h3 className="text-lg font-display font-black text-darkroast uppercase tracking-tight">Menu Terlaris</h3>
            <span className="text-xs uppercase font-mono tracking-wider text-caramel font-bold">Kuantitas</span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {bestSellers.length > 0 ? (
              bestSellers.slice(0, 5).map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b border-darkroast/10 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 bg-latte border border-darkroast flex items-center justify-center font-mono font-bold text-darkroast text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-display font-bold text-sm text-darkroast uppercase leading-tight">{item.name}</p>
                      <p className="text-[10px] font-mono text-darkroast/60 tracking-wider uppercase mt-0.5">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-black text-[#1E130C]">{item.quantitySold} Porsi</p>
                    <p className="text-[10px] font-mono text-darkroast/60">{formatIDR(item.totalRevenue)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-darkroast/60 italic font-mono uppercase font-bold">
                Belum ada transaksi terekam
              </div>
            )}
          </div>
        </div>

        {/* Employee Activity Log */}
        <div className="bg-[#FFFDF8] border-2 border-darkroast p-6">
          <div className="flex justify-between items-center border-b border-darkroast pb-4 mb-4">
            <h3 className="text-lg font-display font-black text-darkroast uppercase tracking-tight">Log Audit Aktifitas</h3>
            <span className="w-2.5 h-2.5 bg-emerald-500 border border-emerald-700 animate-pulse"></span>
          </div>

          <div className="space-y-3.5 max-h-[300px] overflow-y-auto">
            {systemLogs.length > 0 ? (
              systemLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="text-xs py-3 border-b border-darkroast/10 last:border-b-0 space-y-1">
                  <div className="flex justify-between font-mono text-darkroast/60 font-bold">
                    <span className="text-[#1E130C] uppercase">{log.user_name}</span>
                    <span>{new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                  <p className="font-display font-bold text-darkroast text-xs uppercase">{log.action}: <span className="font-normal font-sans text-darkroast/80 text-[11px] normal-case">{log.description}</span></p>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-darkroast/60 italic font-mono uppercase font-bold">
                LOG MASIH KOSONG
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
