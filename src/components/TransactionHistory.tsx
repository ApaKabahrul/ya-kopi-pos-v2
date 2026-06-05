/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  History, Search, Eye, Calendar, User, CreditCard, 
  Printer, X, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { Transaction, TransactionItem, User as Employee } from '../types';

interface TransactionHistoryProps {
  token: string;
  currentUser: { id: string; name: string; role: string };
}

export default function TransactionHistory({ token, currentUser }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchNo, setSearchNo] = useState('');
  const [filterCashier, setFilterCashier] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  // Active Detail Context
  const [selectedTxDetail, setSelectedTxDetail] = useState<{ transaction: Transaction; items: TransactionItem[] } | null>(null);
  const [isDetailInvoiceOpen, setIsDetailInvoiceOpen] = useState(false);

  const formatIDR = (num: number) => {
    return 'Rp' + num.toLocaleString('id-ID');
  };

  const loadHistories = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [txRes, empRes] = await Promise.all([
        fetch('/api/transactions', { headers }),
        currentUser.role === 'owner' ? fetch('/api/users', { headers }) : Promise.resolve(null)
      ]);

      if (txRes.ok) setTransactions(await txRes.json());
      if (empRes && empRes.ok) setEmployees(await empRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistories();
  }, [token]);

  // Open invoice detailing modal
  const handleOpenDetail = async (txId: string) => {
    try {
      const res = await fetch(`/api/transactions/${txId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedTxDetail(await res.json());
        setIsDetailInvoiceOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reprint Receipt trigger with action logging
  const handlePrintReceipt = (txId: string) => {
    fetch(`/api/transactions/${txId}/print`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    // Triggers local printing natively over printable area
    window.print();
  };

  // Filter conditions
  const filteredList = transactions.filter(t => {
    const matchesNo = t.transaction_number.toLowerCase().includes(searchNo.toLowerCase()) ||
                    (t.customer_name || '').toLowerCase().includes(searchNo.toLowerCase());
    const matchesCashier = filterCashier === 'all' || t.cashier_id === filterCashier;
    const matchesMethod = filterMethod === 'all' || t.payment_method === filterMethod;
    const matchesDate = !filterDate || t.transaction_date.startsWith(filterDate);

    return matchesNo && matchesCashier && matchesMethod && matchesDate;
  });

  return (
    <div className="space-y-8 animate-fade-in text-espresso">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-darkroast/10 pb-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-[#C89F6A]">Riwayat Dokumen & Keuangan</span>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-espresso mt-1">
            {currentUser.role === 'owner' ? 'Arsip Seluruh Nota Kasir' : 'Laporan Transaksi Saya'}
          </h1>
        </div>
        <button
          onClick={loadHistories}
          className="mt-4 md:mt-0 flex items-center space-x-2 px-4 py-2 bg-[#FFFDF8] border border-darkroast/10 text-xs font-mono font-semibold uppercase hover:border-caramel transition-colors"
        >
          <span>Refresh List</span>
        </button>
      </div>

      {/* FILTER SEARCH BARS */}
      <div className="bg-[#FFFDF8] border border-darkroast/10 p-4.5 grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-coffee absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari No. Nota / Pelanggan..."
            value={searchNo}
            onChange={(e) => setSearchNo(e.target.value)}
            className="w-full bg-[#E8D8C3]/10 text-xs pl-9 pr-3 py-2.5 outline-none border border-darkroast/10 focus:border-caramel placeholder-coffee"
          />
        </div>

        {/* Cashier option ONLY for Owner role access */}
        <div>
          <select
            value={filterCashier}
            onChange={(e) => setFilterCashier(e.target.value)}
            disabled={currentUser.role === 'cashier'}
            className="w-full bg-[#E8D8C3]/10 text-xs p-2.5 outline-none border border-darkroast/10 focus:border-caramel text-espresso"
          >
            <option value="all">-- Semua Kasir --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
            ))}
          </select>
        </div>

        {/* Payment Method filter options */}
        <div>
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="w-full bg-[#E8D8C3]/10 text-xs p-2.5 outline-none border border-darkroast/10 focus:border-caramel text-espresso"
          >
            <option value="all">-- Metode Bayar --</option>
            <option value="Cash">Cash (Tunai)</option>
            <option value="QRIS">QRIS Digital</option>
            <option value="Debit Card">Debit / CC Card</option>
            <option value="E-Wallet">E-Wallet (GoPay/Shopee)</option>
            <option value="Transfer Bank">Transfer Bank</option>
          </select>
        </div>

        {/* Date Selector query */}
        <div className="relative">
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full bg-[#E8D8C3]/10 text-xs p-2 py-2 outline-none border border-darkroast/10 focus:border-caramel text-espresso font-mono"
          />
        </div>

      </div>

      {/* HISTORIES MAIN TABLE VIEW */}
      <div className="bg-[#FFFDF8] border border-darkroast/10 p-6 overflow-x-auto">
        {loading ? (
          <div className="py-12 flex justify-center text-xs font-mono text-coffee">Membaca arsip transaksi...</div>
        ) : filteredList.length > 0 ? (
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-darkroast/10 text-[10px] font-mono uppercase tracking-wider bg-[#E8D8C3]/15 text-coffee">
                <th className="py-3 px-4 font-normal">Nomor Transaksi</th>
                <th className="py-3 px-4 font-normal">Tanggal & Jam</th>
                <th className="py-3 px-4 font-normal">Nama Kasir</th>
                <th className="py-3 px-4 font-normal">Customer</th>
                <th className="py-3 px-4 font-normal text-right">Potongan</th>
                <th className="py-3 px-4 font-normal text-right">Total Biaya</th>
                <th className="py-3 px-4 font-normal text-center">Tipe Bayar</th>
                <th className="py-3 px-4 font-normal text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-darkroast/5 text-xs">
              {filteredList.map((t) => (
                <tr key={t.id} className="hover:bg-caramel/5">
                  <td className="py-3 px-4 font-display font-bold text-espresso">{t.transaction_number}</td>
                  <td className="py-3 px-4 font-mono text-coffee">
                    {new Date(t.transaction_date).toLocaleDateString('id-ID')} {new Date(t.transaction_date).toLocaleTimeString('id-id', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-4 font-medium">{t.cashier_name || 'Tidak tercatat'}</td>
                  <td className="py-3 px-4">
                    {t.customer_name ? (
                      <span className="text-[#392213] font-semibold">{t.customer_name}</span>
                    ) : (
                      <span className="text-coffee italic">Umum / Reguler</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-red-600">-{formatIDR(t.discount_amount)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#1E130C]">{formatIDR(t.grand_total)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-[#E8D8C3]/40 px-2 py-0.5 text-espresso border border-caramel/10 text-[9px] uppercase tracking-wider font-semibold">
                      {t.payment_method}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenDetail(t.id)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#3B2416] hover:bg-caramel text-milk hover:text-espresso font-display font-medium text-[10px] uppercase tracking-wide transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Rincian</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-xs italic text-coffee">
            Belum ada arsip nota transaksi lunas yang cocok dengan pencarian / filter ini.
          </div>
        )}
      </div>

      {/* DETAILED MODAL DIALOG DISPLAYING RECEIPT AND PRODUCTS LIST */}
      {isDetailInvoiceOpen && selectedTxDetail && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto scrollbar-none">
          <div className="bg-[#FFFDF8] max-w-sm w-full p-6 border-2 border-espresso relative my-8 animate-fade-in text-espresso print:my-0 print:border-none print:shadow-none print:bg-white no-print:shadow-2xl">
            
            {/* Close */}
            <button
              onClick={() => {
                setIsDetailInvoiceOpen(false);
                setSelectedTxDetail(null);
              }}
              className="absolute top-4 right-4 text-coffee hover:text-[#1E130C] no-print"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Action option print */}
            <div className="no-print bg-[#F3E5D0] border border-caramel/25 p-3 flex justify-between items-center mb-6 text-xs font-mono">
              <span>Nota #{selectedTxDetail.transaction.transaction_number}</span>
              <button
                onClick={() => handlePrintReceipt(selectedTxDetail.transaction.id)}
                className="flex items-center space-x-1 font-bold uppercase tracking-wider bg-espresso text-milk px-2.5 py-1.5 hover:bg-caramel hover:text-espresso"
              >
                <Printer className="w-3 h-3" />
                <span>Print Struk</span>
              </button>
            </div>

            {/* PRINT PORTION MAPPED */}
            <div className="print-receipt-section space-y-6 uppercase leading-relaxed text-left font-mono text-[11px] pr-1" style={{ fontSize: '11px' }}>
              <div className="text-center space-y-1 font-sans">
                <h2 className="font-display font-bold text-lg tracking-wider text-darkroast">YA KOPI</h2>
                <p className="text-[9px] font-mono leading-none">Jl. Boulevard Selera No. 42, Jakarta</p>
                <p className="text-[9px] font-mono leading-tight">REPRINT RECONCILATION INVOICE</p>
              </div>

              {/* Meta */}
              <div className="border-t border-b border-dashed border-darkroast/40 py-2 text-[9px] space-y-1 leading-tight">
                <div className="flex justify-between">
                  <span>Nota: {selectedTxDetail.transaction.transaction_number}</span>
                  <span>User: {selectedTxDetail.transaction.cashier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time: {new Date(selectedTxDetail.transaction.transaction_date).toLocaleString('id-ID')}</span>
                  {selectedTxDetail.transaction.customer_name && (
                    <span>CRM: {selectedTxDetail.transaction.customer_name}</span>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 border-b border-dashed border-darkroast/40 pb-2.5">
                {selectedTxDetail.items.map((it) => (
                  <div key={it.id}>
                    <div className="flex justify-between font-bold">
                      <span>{it.product_name}</span>
                      <span>{formatIDR(it.subtotal)}</span>
                    </div>
                    {it.variant_detail && (
                      <p className="text-[9px] text-[#6F4E37] leading-none">{it.variant_detail}</p>
                    )}
                    <p className="text-[10px] text-coffee">{it.quantity} x {formatIDR(it.price)}</p>
                  </div>
                ))}
              </div>

              {/* calculations */}
              <div className="space-y-1.5 border-b border-dashed border-darkroast/40 pb-2.5">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatIDR(selectedTxDetail.transaction.subtotal)}</span>
                </div>
                {selectedTxDetail.transaction.discount_amount > 0 && (
                  <div className="flex justify-between text-black font-semibold">
                    <span>Voucher Disc</span>
                    <span>-{formatIDR(selectedTxDetail.transaction.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Pajak (PPN 10%)</span>
                  <span>{formatIDR(selectedTxDetail.transaction.tax_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service fee</span>
                  <span>{formatIDR(selectedTxDetail.transaction.service_charge)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#1E130C] border-t border-dotted border-darkroast/20 pt-1 font-display">
                  <span>TOTAL AKHIR</span>
                  <span>{formatIDR(selectedTxDetail.transaction.grand_total)}</span>
                </div>
              </div>

              {/* cash detail */}
              <div className="space-y-1 text-[10px] pb-1 border-b border-dashed border-darkroast/40">
                <div className="flex justify-between">
                  <span>Jenis Bayar</span>
                  <span>{selectedTxDetail.transaction.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah Bayar</span>
                  <span>{formatIDR(selectedTxDetail.transaction.paid_amount)}</span>
                </div>
                {selectedTxDetail.transaction.payment_method === 'Cash' && (
                  <div className="flex justify-between font-bold">
                    <span>Uang Kembalian</span>
                    <span>{formatIDR(selectedTxDetail.transaction.change_amount)}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-2.5 space-y-1">
                <p className="font-semibold text-[11px] font-sans">Terima kasih sudah ngopi di Ya Kopi!</p>
                <div className="text-[8px] italic leading-tight text-coffee font-mono">** DOKUMEN CETAK ULANG ARSIP **</div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
