/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Coffee, Shield, Ticket, Users, FileSpreadsheet, Lock, AlertTriangle, ChevronRight, Sparkles 
} from 'lucide-react';

// Sidebar nav
import Sidebar from './components/Sidebar';

// Owner Pages
import DashboardOwner from './components/DashboardOwner';
import ProductManagement from './components/ProductManagement';
import InventoryManagement from './components/InventoryManagement';
import SalesReport from './components/SalesReport';
import DiscountManagement from './components/DiscountManagement';
import EmployeeManagement from './components/EmployeeManagement';

// Cashier Pages
import DashboardCashier from './components/DashboardCashier';
import POSTransaction from './components/POSTransaction';
import TransactionHistory from './components/TransactionHistory';
import CustomerManagement from './components/CustomerManagement';

// Types
import { User, Product } from './types';

export default function App() {
  // Session parameters loaded from localStorage if exists
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('yakopi_session_token'));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('yakopi_session_user');
    return raw ? JSON.parse(raw) : null;
  });

  // Navigation tab route
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Login variables
  const [emailText, setEmailText] = useState('');
  const [passwordText, setPasswordText] = useState('');
  
  // States and notification alerts triggers
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [runningStockAlerts, setRunningStockAlerts] = useState<string[]>([]);

  // Periodically audit low stock warnings for logged in owner
  useEffect(() => {
    if (!token) return;

    async function checkStockWarnings() {
      try {
        const res = await fetch('/api/products', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const list = await res.json() as Product[];
          const lowList = list
            .filter(p => p.stock <= p.minimum_stock && p.is_active)
            .map(p => p.name);
          setRunningStockAlerts(lowList);
        }
      } catch (err) {
        console.error('Failed to pre-audit inventory alerts:', err);
      }
    }

    checkStockWarnings();
    const interval = setInterval(checkStockWarnings, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [token]);

  // Login callback
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    if (!emailText || !passwordText) {
      setLoginError('Silakan lengkapi email/username dan kata sandi Anda.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailText.toLowerCase().trim(), password: passwordText })
      });

      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Autentikasi gagal. Silakan coba kembali.');
      } else {
        // Success login
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('yakopi_session_token', data.token);
        localStorage.setItem('yakopi_session_user', JSON.stringify(data.user));
        setActiveTab('dashboard'); // reset tab on fresh shifts
      }
    } catch (err) {
      setLoginError('Gagal mendeteksi koneksi server backend. Hubungi IT Support.');
    } finally {
      setLoading(false);
    }
  };

  // Logout callback
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setEmailText('');
    setPasswordText('');
    localStorage.removeItem('yakopi_session_token');
    localStorage.removeItem('yakopi_session_user');
  };

  // Quick action on transaction success to update stock warnings
  const handleTransactionSuccess = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const list = await res.json() as Product[];
        const lowList = list
          .filter(p => p.stock <= p.minimum_stock && p.is_active)
          .map(p => p.name);
        setRunningStockAlerts(lowList);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Guard routing display
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-milk text-[#1E130C] flex flex-col justify-between relative overflow-hidden select-none">
        
        {/* Absolute design aesthetic background grid */}
        <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#C89F6A_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none"></div>

        {/* Outer Header Greet */}
        <header className="px-8 py-6 flex items-center justify-between border-b border-darkroast">
          <div className="flex items-center space-x-3">
            <div className="bg-darkroast p-1.5 text-milk">
              <Coffee className="w-4 h-4" />
            </div>
            <span className="font-display font-black tracking-tighter text-darkroast text-lg">YA KOPI</span>
          </div>
          <p className="text-[10px] font-mono tracking-wider text-darkroast uppercase font-bold">Swiss Minimalist POS</p>
        </header>

        {/* Center Main Login Dialog (Swiss typography styled) */}
        <main className="flex-1 flex items-center justify-center p-6 bg-[#FFFDF8]">
          <div className="w-full max-w-sm bg-[#FFFDF8] border-2 border-darkroast p-8 relative flex flex-col justify-between space-y-6">
            
            {/* Top aesthetic label */}
            <div>
              <span className="text-[9px] uppercase font-mono tracking-widest font-bold text-caramel">Sistem Akses Kasir & Owner</span>
              <h1 className="text-4xl font-display font-black tracking-tighter text-darkroast mt-1 leading-none uppercase">
                YA KOPI.
              </h1>
              <p className="text-xs text-darkroast/80 mt-3 leading-relaxed">Kelola pesanan pelanggan Ya Kopi dengan cepat, lincah, dan presisi.</p>
            </div>

            {/* Error alerts */}
            {loginError && (
              <div className="bg-red-50 text-red-800 border-l-4 border-red-600 p-3.5 text-xs font-mono font-medium leading-tight">
                ⚠️ MASALAH: {loginError}
              </div>
            )}

            {/* Login inputs */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-[#1E130C] font-bold block">Email / Username Staf</label>
                <input
                  type="text"
                  placeholder="kasir@yakopi.com atau owner@yakopi.com"
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  className="w-full bg-[#E8D8C3]/10 text-sm p-3 border border-darkroast outline-none focus:bg-latte placeholder:text-darkroast/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-[#1E130C] font-bold block">Password / Kunci Sandi</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordText}
                  onChange={(e) => setPasswordText(e.target.value)}
                  className="w-full bg-[#E8D8C3]/10 text-sm p-3 border border-darkroast outline-none focus:bg-latte placeholder:text-darkroast/50"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4.5 bg-darkroast text-[#FFFDF8] hover:bg-latte hover:text-darkroast border border-darkroast font-display font-bold uppercase tracking-widest text-xs transition-colors shadow-none flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-milk border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>BUKA SHIFT POS</span>
                    <ChevronRight className="w-4 h-4 ml-[2px]" />
                  </>
                )}
              </button>
            </form>

            {/* Quick credentials shortcuts panel for easy evaluation inside preview */}
            <div className="border-t border-darkroast pt-4">
              <span className="text-[9px] uppercase font-mono tracking-wider text-darkroast font-bold block mb-1.5 text-center">Akun Demo Evaluor Preview:</span>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setEmailText('owner@yakopi.com');
                    setPasswordText('yakopi88');
                  }}
                  className="p-1 px-2 border border-darkroast bg-[#FFFDF8] text-darkroast hover:bg-latte truncate font-bold text-[9px] uppercase tracking-wider"
                >
                  Owner (yakopi88)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailText('kasir1@yakopi.com');
                    setPasswordText('yakopikasir');
                  }}
                  className="p-1 px-2 border border-darkroast bg-[#FFFDF8] text-darkroast hover:bg-latte truncate font-bold text-[9px] uppercase tracking-wider"
                >
                  Kasir (yakopikasir)
                </button>
              </div>
            </div>

          </div>
        </main>

        <footer className="py-6 px-8 text-center text-[10px] tracking-wider text-coffee/60 font-mono">
          &copy; {new Date().getFullYear()} YA KOPI POS. All rights reserved. Designed in Swiss Minimalist.
        </footer>
      </div>
    );
  }

  // Render Page Content conditionally based on activeTab state
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return user.role === 'owner' 
          ? <DashboardOwner token={token} onNavigateToTab={setActiveTab} /> 
          : <DashboardCashier user={user} token={token} onNavigateToTab={setActiveTab} />;
      case 'pos':
        return <POSTransaction token={token} user={user} onTransactionSuccess={handleTransactionSuccess} />;
      case 'products':
        return user.role === 'owner' ? <ProductManagement token={token} /> : null;
      case 'inventory':
        return user.role === 'owner' ? <InventoryManagement token={token} user={user} /> : null;
      case 'history':
        return <TransactionHistory token={token} currentUser={user} />;
      case 'reports':
        return user.role === 'owner' ? <SalesReport token={token} /> : null;
      case 'customers':
        return <CustomerManagement token={token} />;
      case 'discounts':
        return user.role === 'owner' ? <DiscountManagement token={token} /> : null;
      case 'employees':
        return user.role === 'owner' ? <EmployeeManagement token={token} /> : null;
      default:
        return (
          <div className="p-8 text-center bg-white border">
            Halaman sedang disiapkan.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF8] flex flex-col lg:flex-row text-[#1E130C]">
      
      {/* Dynamic Nav Rail/Sidebar */}
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />

      {/* Main operational canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Dynamic header alerts ticker line (Only show for Owner about stock thresholds) */}
        {user.role === 'owner' && runningStockAlerts.length > 0 && (
          <div className="bg-amber-100 text-amber-900 px-6 py-2.5 text-xs font-mono font-bold flex items-center border-b border-amber-300 no-print animate-fade-in select-none">
            <AlertTriangle className="w-4 h-4 text-amber-700 mr-2 flex-shrink-0 animate-bounce" />
            <span className="truncate">ALERT STOK MENIPIS: {runningStockAlerts.join(', ')} segera lakukan replenishment restock!</span>
          </div>
        )}

        {/* Nested Content Screen */}
        <main className="flex-1 p-6 md:p-10 no-print max-w-[1400px] mx-auto w-full">
          {renderTabContent()}
        </main>

      </div>
    </div>
  );
}
