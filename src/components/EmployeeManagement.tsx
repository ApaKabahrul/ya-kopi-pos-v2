/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit, Trash2, X, RefreshCw, Key, UserCheck, 
  UserX, Shield, AlertTriangle
} from 'lucide-react';
import { User as Employee } from '../types';

interface EmployeeManagementProps {
  token: string;
}

export default function EmployeeManagement({ token }: EmployeeManagementProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // form inputs
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empRole, setEmpRole] = useState<'owner' | 'cashier'>('cashier');

  // statuses
  const [successText, setSuccessText] = useState('');
  const [errorText, setErrorText] = useState('');

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch('/api/users', { headers });
      if (res.ok) setEmployees(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [token]);

  const openAddEmployee = () => {
    setEditingEmp(null);
    setEmpName('');
    setEmpEmail('');
    setEmpPassword('');
    setEmpRole('cashier');
    setIsModalOpen(true);
  };

  const openEditEmployee = (emp: Employee) => {
    setEditingEmp(emp);
    setEmpName(emp.name);
    setEmpEmail(emp.email);
    setEmpPassword(''); // don't fill password
    setEmpRole(emp.role);
    setIsModalOpen(true);
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empEmail) {
      setErrorText('Nama lengkap dan email/username wajib diisi.');
      return;
    }

    if (!editingEmp && !empPassword) {
      setErrorText('Kata sandi/password wajib diisi untuk karyawan baru.');
      return;
    }

    try {
      const payload: Record<string, any> = {
        name: empName,
        email: empEmail.toLowerCase().trim(),
        role: empRole,
      };

      if (empPassword) {
        payload.password = empPassword;
      }

      const method = editingEmp ? 'PUT' : 'POST';
      const endpoint = editingEmp ? `/api/users/${editingEmp.id}` : '/api/users';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessText(`Akun karyawan ${empName} berhasil dikonfigurasi.`);
        setIsModalOpen(false);
        loadEmployees();
        setTimeout(() => setSuccessText(''), 3000);
      } else {
        const err = await res.json();
        setErrorText(err.error || 'Terjadi gangguan pendaftaran akun.');
      }
    } catch (err) {
      setErrorText('Koneksi server gagal.');
    }
  };

  const handleToggleActive = async (emp: Employee) => {
    if (emp.role === 'owner') {
      setErrorText('Akun berstatus Administrator Owner tidak dapat dinonaktifkan.');
      setTimeout(() => setErrorText(''), 3000);
      return;
    }

    try {
      const res = await fetch(`/api/users/${emp.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: emp.status !== 'active' })
      });

      if (res.ok) {
        loadEmployees();
        setSuccessText(`Blok status aktif kasir ${emp.name} diubah.`);
        setTimeout(() => setSuccessText(''), 3000);
      }
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-espresso">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-darkroast/10 pb-6">
        <div>
          <span className="text-xs uppercase font-mono tracking-widest text-[#C89F6A]">User Authorization & Crew Controls</span>
          <h1 className="text-3xl font-display font-semibold tracking-tight text-espresso mt-1">Staf & Manajemen Kasir</h1>
        </div>
        <button
          onClick={openAddEmployee}
          className="mt-4 md:mt-0 flex items-center space-x-2 px-5 py-2.5 bg-coffee hover:bg-espresso text-milk font-display text-xs uppercase font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ Akun Karyawan</span>
        </button>
      </div>

      {/* alerts */}
      {successText && (
        <div className="bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 p-4 text-xs font-mono font-medium leading-none">
          NOTIFIKASI: {successText}
        </div>
      )}

      {errorText && (
        <div className="bg-red-50 text-red-800 border-l-4 border-red-600 p-4 text-xs font-mono font-medium leading-none">
          PERINGATAN: {errorText}
        </div>
      )}

      {/* EMPLOYEES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs font-mono text-coffee">Membaca daftar staf...</div>
        ) : employees.length > 0 ? (
          employees.map((emp) => (
            <div 
              key={emp.id}
              className={`bg-[#FFFDF8] border ${emp.status === 'active' ? 'border-darkroast/10' : 'border-red-200 opacity-65'} p-5 hover:border-caramel transition-colors flex flex-col justify-between space-y-4`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className={`px-2 py-0.5 text-[9px] font-mono uppercase font-bold tracking-wider ${emp.role === 'owner' ? 'bg-[#3B2416] text-[#FFFDF8]' : 'bg-latte text-espresso border border-caramel/15'}`}>
                    {emp.role}
                  </span>
                  <h4 className="font-display font-semibold text-lg text-espresso mt-2.5">{emp.name}</h4>
                  <p className="text-xs font-mono text-coffee">{emp.email}</p>
                </div>

                <div className="text-right">
                  {emp.status === 'active' ? (
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider font-bold">Aktif Shift</span>
                  ) : (
                    <span className="text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider font-bold">Nonaktif</span>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-darkroast/5 text-xs text-coffee font-mono">
                <span>ID: {emp.id.slice(0, 8)}</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditEmployee(emp)}
                    className="p-1 px-2 hover:bg-caramel hover:text-espresso rounded border border-darkroast/10 text-[10px] transition-colors"
                  >
                    Edit
                  </button>
                  {emp.role !== 'owner' && (
                    <button
                      onClick={() => handleToggleActive(emp)}
                      className={`p-1 px-2 rounded border text-[10px] transition-colors ${emp.status === 'active' ? 'hover:bg-red-50 border-red-200 text-red-600' : 'hover:bg-emerald-50 border-emerald-200 text-emerald-700'}`}
                    >
                      {emp.status === 'active' ? 'Kunci' : 'Aktifkan'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-xs italic text-coffee">
            Belum ada staf terdaftar di database.
          </div>
        )}
      </div>

      {/* --- ADD/EDIT STAFF USER DIALOG MODAL --- */}
      {isModalOpen && (
        <div id="modal-employee-config-form" className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFDF8] border-2 border-espresso max-w-sm w-full p-6 space-y-5 relative animate-fade-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-coffee hover:text-espresso"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-[#C89F6A]">Akses Staf</span>
              <h2 className="text-xl font-display font-bold text-espresso">
                {editingEmp ? 'Perbarui Akun Crew' : 'Mendaftarkan Akun Karyawan'}
              </h2>
            </div>

            <form onSubmit={handleEmployeeSubmit} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-[#C89F6A] font-extrabold block">Nama Lengkap Crew</label>
                <input
                  type="text"
                  placeholder="Contoh: Sarah Barista"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 outline-none focus:border-caramel"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-[#C89F6A] font-extrabold block">Username / Email Shift</label>
                <input
                  type="text"
                  placeholder="Contoh: sarah@yakopi.com"
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 font-mono outline-none focus:border-caramel text-espresso"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-[#C89F6A] font-extrabold block">
                  {editingEmp ? 'Sandi/Password Baru (Kosongkan bila tidak diubah)' : 'Kata Sandi Default'}
                </label>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={empPassword}
                  onChange={(e) => setEmpPassword(e.target.value)}
                  className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 px-3 font-mono outline-none focus:border-caramel"
                  required={!editingEmp}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono tracking-widest text-[#C89F6A] font-extrabold block">Otoritas Otorisasi</label>
                <select
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value as 'owner' | 'cashier')}
                  className="w-full bg-[#E8D8C3]/10 border border-darkroast/15 p-2 text-xs outline-none focus:border-caramel"
                >
                  <option value="cashier">Cashier (Kasir Shift Terbatas)</option>
                  <option value="owner">Owner (Hak Administrator Penuh)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-espresso cursor-pointer hover:bg-caramel text-milk hover:text-espresso text-xs font-display font-semibold uppercase tracking-wider transition-colors pt-3"
              >
                Daun Akses Akun
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
