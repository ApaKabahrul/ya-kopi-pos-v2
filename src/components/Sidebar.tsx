/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Coffee, LayoutDashboard, ShoppingCart, Coffee as BeansIcon, 
  Package, History, BarChart3, Users, Percent, UserCheck, LogOut, Menu, X 
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ user, activeTab, setActiveTab, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Group paths and labels indicating access rights
  const ownerMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Kasir', icon: ShoppingCart },
    { id: 'products', label: 'Kelola Menu', icon: BeansIcon },
    { id: 'inventory', label: 'Stok & Log', icon: Package },
    { id: 'history', label: 'Riwayat Nota', icon: History },
    { id: 'reports', label: 'Laporan Keuangan', icon: BarChart3 },
    { id: 'customers', label: 'Pelanggan CRM', icon: Users },
    { id: 'discounts', label: 'Promo Diskon', icon: Percent },
    { id: 'employees', label: 'Karyawan', icon: UserCheck },
  ];

  const cashierMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'POS Transaksi', icon: ShoppingCart },
    { id: 'history', label: 'Riwayat Saya', icon: History },
    { id: 'customers', label: 'Pelanggan CRM', icon: Users },
  ];

  const menuItems = user.role === 'owner' ? ownerMenuItems : cashierMenuItems;

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile top navigation rail */}
      <div id="mob-nav-rail" className="lg:hidden flex items-center justify-between bg-darkroast text-milk px-5 py-4 border-b border-darkroast z-40 sticky top-0">
        <div className="flex items-center space-x-3">
          <div className="bg-caramel p-1.5 rounded-none text-darkroast">
            <Coffee className="w-5 h-5" />
          </div>
          <span className="font-display font-black text-lg tracking-tighter uppercase">YK. POS</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 text-milk hover:text-caramel transition-colors"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-30 transition-opacity" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main sidebar navigation panel */}
      <aside className={`
        fixed lg:sticky top-0 left-0 bottom-0 z-40
        w-64 max-w-[280px] bg-darkroast text-milk
        border-r border-darkroast flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out h-full rounded-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Header */}
        <div>
          <div className="px-6 py-8 flex items-center space-x-3 border-b border-[#FFFDF8]/10">
            <div className="text-white font-black text-3xl tracking-tighter">YK.</div>
            <div>
              <h2 className="font-display font-black tracking-tight text-lg leading-none text-milk">YA KOPI</h2>
              <span className="text-[9px] uppercase font-mono tracking-widest text-caramel">POS & CRM v1.0</span>
            </div>
          </div>

          {/* User Profile Summary */}
          <div className="px-6 py-5 bg-[#1E130C]/50 border-b border-[#FFFDF8]/10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-none bg-latte border border-[#1E130C] flex items-center justify-center font-display font-black text-darkroast uppercase text-xs">
                {user.name.substring(0, 2)}
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-xs tracking-tight text-milk truncate">{user.name.toUpperCase()}</p>
                <div className="flex items-center space-x-1.5 mt-1">
                  <span className={`w-1.5 h-1.5 ${user.role === 'owner' ? 'bg-caramel' : 'bg-emerald-400'}`}></span>
                  <p className="text-[10px] uppercase font-mono tracking-wider text-latte">{user.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-250px)]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-none
                    font-display text-xs uppercase tracking-wider font-bold transition-all duration-150 border
                    ${isActive 
                      ? 'bg-latte text-darkroast border-latte' 
                      : 'text-white border-transparent hover:border-white/20 hover:bg-[#1E130C]'
                    }
                  `}
                >
                  <Icon className={`w-[16px] h-[16px] ${isActive ? 'text-darkroast' : 'text-caramel'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Action Bottom */}
        <div className="p-4 border-t border-[#FFFDF8]/10 bg-[#1E130C]/40">
          <button
            onClick={onLogout}
            id="btn-sidebar-logout"
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-none border border-transparent hover:border-red-500/20 font-display text-xs uppercase tracking-wider font-bold text-red-400 hover:bg-red-950/20 transition-all duration-150"
          >
            <LogOut className="w-[16px] h-[16px] text-red-400" />
            <span>Keluar POS</span>
          </button>
        </div>
      </aside>
    </>
  );
}
