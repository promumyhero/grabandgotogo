'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AuthUser, CalculationResult, MenuItem, WorkspaceChannel } from '@/types/pricing';
import {
  X,
  Store,
  ShieldCheck,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  Copy,
  Eraser,
  Percent,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';

interface MerchantProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AuthUser;
  channel: WorkspaceChannel;
  currentItems: MenuItem[];
  otherChannelItemsCount: number;
  calculations: Map<string, CalculationResult>;
  onProfileUpdated: (updatedUser: AuthUser) => void;
  onAccountDeleted: (deletedMerchantId: string) => void;
  onExportBackupJson: () => void;
  onImportBackupJson: (rawJson: string) => void;
  onResetEmptyMenu: () => void;
  onResetZeroDiscounts: () => void;
  onResetDisplayToOffline: () => void;
  onCopyFromOtherChannel: () => void;
  onResetDefaults: () => void;
}

export function MerchantProfileModal({
  isOpen,
  onClose,
  user,
  channel,
  currentItems,
  otherChannelItemsCount,
  calculations,
  onProfileUpdated,
  onAccountDeleted,
  onExportBackupJson,
  onImportBackupJson,
  onResetEmptyMenu,
  onResetZeroDiscounts,
  onResetDisplayToOffline,
  onCopyFromOtherChannel,
  onResetDefaults,
}: MerchantProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'reset_danger'>('profile');

  // Profile Form State
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');

  // Security Form State
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Account Deletion State
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Compute Restaurant Health Stats
  let lossCount = 0;
  let totalMarginPct = 0;
  for (const item of currentItems) {
    const calc = calculations.get(item.id);
    if (calc) {
      if (calc.isLoss) lossCount++;
      totalMarginPct += calc.effectiveMerchantMarginPct;
    }
  }
  const avgMarginPct =
    currentItems.length > 0 ? (totalMarginPct / currentItems.length).toFixed(1) : '0.0';

  const handleSaveBasicProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsSaving(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        setStatusMsg({
          type: 'error',
          text: data?.error || 'Gagal menyimpan profil restoran.',
        });
        return;
      }
      onProfileUpdated(data.user);
      setStatusMsg({
        type: 'success',
        text: 'Identitas restoran berhasil diperbarui.',
      });
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Gagal menghubungi server.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsSaving(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: email.trim(),
          currentPassword,
          newPassword: newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        setStatusMsg({
          type: 'error',
          text: data?.error || 'Gagal memperbarui kredensial keamanan.',
        });
        return;
      }
      onProfileUpdated(data.user);
      setCurrentPassword('');
      setNewPassword('');
      setStatusMsg({
        type: 'success',
        text: 'Email / Password berhasil diperbarui dan sesi diamankan ulang.',
      });
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Gagal menghubungi server.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setIsSaving(true);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmText: deleteConfirmText.trim(),
          currentPassword: deletePassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg({
          type: 'error',
          text: data?.error || 'Gagal menghapus akun restoran.',
        });
        return;
      }
      onAccountDeleted(user.id);
      onClose();
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Gagal menghubungi server saat menghapus akun.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const otherChannelName = channel === 'GRABFOOD' ? 'GoFood' : 'GrabFood';
  const currentChannelName = channel === 'GRABFOOD' ? 'GrabFood' : 'GoFood';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="merchant-profile-title"
        className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto animate-modal-panel"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="merchant-profile-title"
                className="text-base font-bold text-slate-900"
              >
                Profil & Pengaturan Resto
              </h2>
              <p className="text-xs text-slate-500">
                {user.name} • {user.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pengaturan profil"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 pb-0 border-b border-slate-200 bg-slate-50/70 flex gap-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setStatusMsg(null);
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            Profil & Backup Resto
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('security');
              setStatusMsg(null);
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'security'
                ? 'border-slate-900 text-slate-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Email & Password
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('reset_danger');
              setStatusMsg(null);
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'reset_danger'
                ? 'border-rose-600 text-rose-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Menu & Hapus Akun
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {statusMsg && (
            <div
              role="alert"
              className={`p-3 rounded-lg border text-xs font-medium ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6 animate-tab-panel">
              {/* Restaurant Health Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] font-medium text-slate-500">
                    Menu {currentChannelName}
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {currentItems.length} Menu
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] font-medium text-slate-500">
                    Menu {otherChannelName}
                  </div>
                  <div className="text-lg font-bold text-slate-900 mt-0.5">
                    {otherChannelItemsCount} Menu
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] font-medium text-slate-500">
                    Rata-rata Margin
                  </div>
                  <div className="text-lg font-bold text-emerald-700 mt-0.5">
                    {avgMarginPct}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] font-medium text-slate-500">
                    Status Menu Boncos
                  </div>
                  <div
                    className={`text-lg font-bold mt-0.5 ${
                      lossCount > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {lossCount} Menu
                  </div>
                </div>
              </div>

              {/* Edit Basic Profile Form */}
              <form onSubmit={handleSaveBasicProfile} className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Identitas Restoran / Outlet
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="profile-resto-name"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Nama Restoran / Brand
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="profile-resto-name"
                        type="text"
                        required
                        minLength={2}
                        maxLength={100}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="profile-resto-phone"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      Nomor WhatsApp / Telepon (Opsional)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="profile-resto-phone"
                        type="tel"
                        maxLength={30}
                        placeholder="0812-xxxx-xxxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                  >
                    {isSaving ? 'Menyimpan...' : 'Simpan Identitas Resto'}
                  </button>
                </div>
              </form>

              {/* Full JSON Backup & Restore */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Cadangan Data Lengkap (Backup & Restore JSON)
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Unduh seluruh menu GrabFood + GoFood, kategori, dan Template Skema Promo Anda dalam satu file cadangan <code>.json</code>.
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onExportBackupJson}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Backup (.JSON)
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          onImportBackupJson(reader.result);
                          onClose();
                        }
                      };
                      reader.readAsText(file);
                      e.target.value = '';
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Restore dari File (.JSON)
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleSaveSecurity} className="space-y-4 animate-tab-panel">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                Demi keamanan akun restoran Anda, perubahan <strong>Email</strong> atau <strong>Password</strong> mewajibkan verifikasi <strong>Password Saat Ini</strong>.
              </div>

              <div>
                <label
                  htmlFor="sec-email"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  Alamat Email Akun
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="sec-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="sec-current-pw"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Password Saat Ini (Wajib)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="sec-current-pw"
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan password aktif"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="sec-new-pw"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Password Baru (Kosongkan jika tidak diubah)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="sec-new-pw"
                      type="password"
                      minLength={8}
                      maxLength={128}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 8 karakter (huruf & angka)"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                >
                  {isSaving ? 'Memverifikasi & Menyimpan...' : 'Perbarui Email / Password'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'reset_danger' && (
            <div className="space-y-6 animate-tab-panel">
              {/* Granular Reset & Cross-Channel Sync */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  Zona Reset Terarah & Sinkronisasi Menu ({currentChannelName})
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Seluruh aksi reset menu di bawah ini dilengkapi fitur <strong>Urungkan (Undo)</strong> jika Anda berubah pikiran.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onCopyFromOtherChannel();
                      onClose();
                    }}
                    className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-left transition-colors cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Salin Menu dari {otherChannelName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Impor daftar menu & Harga Offline dari {otherChannelName} lalu hitung Harga Ideal {currentChannelName} otomatis.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onResetZeroDiscounts();
                      onClose();
                    }}
                    className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-left transition-colors cursor-pointer"
                  >
                    <Percent className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Reset Semua Diskon ke 0%
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Matikan promo diskon pada seluruh menu tanpa menghapus daftar menu Anda.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onResetDisplayToOffline();
                      onClose();
                    }}
                    className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-left transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Reset Harga Tayang = Harga Offline
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Kembalikan semua Harga Tayang ke Harga Offline dasar (0% markup) untuk simulasi ulang.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onResetEmptyMenu();
                      onClose();
                    }}
                    className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 text-left transition-colors cursor-pointer"
                  >
                    <Eraser className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-amber-950">
                        Kosongkan Semua Menu (Mulai dari 0)
                      </div>
                      <div className="text-[11px] text-amber-800 mt-0.5">
                        Bersihkan seluruh menu contoh bawaan agar Anda bisa menginput menu asli dari nol.
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onResetDefaults();
                      onClose();
                    }}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 transition-colors cursor-pointer"
                  >
                    Kembalikan Workspace ke Menu Contoh Bawaan Aplikasi
                  </button>
                </div>
              </div>

              {/* Danger Zone: Permanent Account Deletion */}
              <div className="pt-5 border-t border-rose-200">
                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-950">
                        Zona Berbahaya: Hapus Akun Resto Secara Permanen
                      </h4>
                      <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                        Menghapus akun akan menghapus permanen profil restoran <strong>{user.name}</strong>, seluruh menu GrabFood & GoFood, Template Skema Promo, serta riwayat sesi di <strong>Supabase Cloud Database</strong> dan browser ini. Tindakan ini tidak dapat dibatalkan.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleDeleteAccount} className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="del-confirm-text"
                          className="block text-[11px] font-semibold text-rose-900 mb-1"
                        >
                          Ketik <code>HAPUS</code> untuk konfirmasi
                        </label>
                        <input
                          id="del-confirm-text"
                          type="text"
                          required
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="HAPUS"
                          className="w-full px-3 py-2 text-xs font-bold bg-white border border-rose-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-600"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="del-password"
                          className="block text-[11px] font-semibold text-rose-900 mb-1"
                        >
                          Password Akun Anda
                        </label>
                        <input
                          id="del-password"
                          type="password"
                          required
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Masukkan password"
                          className="w-full px-3 py-2 text-xs bg-white border border-rose-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-600"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSaving || deleteConfirmText.trim() !== 'HAPUS'}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {isSaving
                          ? 'Menghapus Seluruh Data...'
                          : 'Hapus Akun & Seluruh Data Permanen'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

