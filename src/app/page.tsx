'use client';

import React, { ViewTransition } from 'react';
import dynamic from 'next/dynamic';
import { DEMO_MAX_MENU_ITEMS } from '@/lib/storage';
import { usePricingWorkspace } from '@/hooks/usePricingWorkspace';
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher';
import { KpiSummaryCards } from '@/components/KpiSummaryCards';
import { GlobalPresetBar } from '@/components/GlobalPresetBar';
import { PricingTable } from '@/components/PricingTable';
import { LandingPage } from '@/components/LandingPage';
import { DashboardSkeleton } from '@/components/DashboardSkeleton';
import { ModalSkeleton } from '@/components/ModalSkeleton';
import {
  Undo2,
  BookOpen,
  Store,
  LogOut,
  LogIn,
  Lock,
  ShieldCheck,
  Settings,
  Home,
  Cloud,
} from 'lucide-react';

// Lazy loaded modals — ALL equipped with geometry-matched Skeleton fallbacks
const GrabReceiptModal = dynamic(
  () => import('@/components/GrabReceiptModal').then((mod) => mod.GrabReceiptModal),
  { ssr: false, loading: () => <ModalSkeleton type="receipt" /> }
);

const GoFoodReceiptModal = dynamic(
  () => import('@/components/GoFoodReceiptModal').then((mod) => mod.GoFoodReceiptModal),
  { ssr: false, loading: () => <ModalSkeleton type="receipt" /> }
);

const AddMenuModal = dynamic(
  () => import('@/components/AddMenuModal').then((mod) => mod.AddMenuModal),
  { ssr: false, loading: () => <ModalSkeleton type="form" /> }
);

const EditMenuModal = dynamic(
  () => import('@/components/EditMenuModal').then((mod) => mod.EditMenuModal),
  { ssr: false, loading: () => <ModalSkeleton type="form" /> }
);

const ManageCategoriesModal = dynamic(
  () => import('@/components/ManageCategoriesModal').then((mod) => mod.ManageCategoriesModal),
  { ssr: false, loading: () => <ModalSkeleton type="category" /> }
);

const AuthModal = dynamic(
  () => import('@/components/AuthModal').then((mod) => mod.AuthModal),
  { ssr: false, loading: () => <ModalSkeleton type="auth" /> }
);

const PricingEducationModal = dynamic(
  () =>
    import('@/components/PricingEducationModal').then(
      (mod) => mod.PricingEducationModal
    ),
  { ssr: false, loading: () => <ModalSkeleton type="education" /> }
);

const MerchantProfileModal = dynamic(
  () =>
    import('@/components/MerchantProfileModal').then(
      (mod) => mod.MerchantProfileModal
    ),
  { ssr: false, loading: () => <ModalSkeleton type="profile" /> }
);

export default function PricingEnginePage() {
  const ws = usePricingWorkspace();

  if (!ws.isClient || ws.isBootstrapping) {
    return <DashboardSkeleton />;
  }

  const isGrab = ws.channel === 'GRABFOOD';

  return (
    <>
      <ViewTransition
        key={ws.activeView}
        enter={{
          'nav-forward': 'nav-forward',
          'nav-back': 'nav-back',
          default: 'none',
        }}
        exit={{
          'nav-forward': 'nav-forward',
          'nav-back': 'nav-back',
          default: 'none',
        }}
        default="none"
      >
        {ws.activeView === 'landing' ? (
          <div className="animate-view-enter">
            <LandingPage
              authUser={ws.authUser}
              onEnterCalculator={() => ws.navigateToView('calculator')}
              onOpenAuthModal={(mode) => {
                ws.setAuthGateReason(null);
                ws.setAuthModalMode(mode);
                ws.setIsAuthModalOpen(true);
              }}
              onOpenEducationModal={() => ws.setIsEducationModalOpen(true)}
            />
          </div>
        ) : (
          <main className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen text-slate-900 animate-view-enter">
            <div className="space-y-5">
              {/* Clean Minimalist Header with Auth, Profile & Education Actions */}
              <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <ViewTransition
                      name="brand-identity"
                      share="morph"
                      default="none"
                    >
                      <button
                        type="button"
                        onClick={() => ws.navigateToView('landing')}
                        className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 hover:text-slate-700 transition-colors cursor-pointer text-left"
                        title="Kembali ke Halaman Beranda & Penjelasan"
                      >
                        FoodMerchant Pricing Engine
                      </button>
                    </ViewTransition>

                    {ws.authUser ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Akun Resto Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <Lock className="w-3 h-3 text-amber-600" />
                        Mode Demo (Maks. {DEMO_MAX_MENU_ITEMS} Menu)
                      </span>
                    )}

                    {ws.isLoadingWorkspace && (
                      <span
                        role="status"
                        aria-live="polite"
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 animate-pulse"
                      >
                        <Cloud className="w-3 h-3 text-slate-500" />
                        Memuat Cloud...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kalkulasi komisi platform, skema promosi bersama, dan margin bersih mitra kuliner
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Back to Landing Page Button */}
                  <button
                    type="button"
                    onClick={() => ws.navigateToView('landing')}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Home className="w-3.5 h-3.5 text-slate-500" />
                    <span>Beranda</span>
                  </button>

                  {/* Interactive Calculation Guide Button */}
                  <button
                    type="button"
                    onClick={() => ws.setIsEducationModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-600" />
                    Cara Hitung & Bedah Rumus
                  </button>

                  {/* Auth Profile / Login Gate */}
                  {ws.authUser ? (
                    <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                      <button
                        type="button"
                        onClick={() => ws.setIsProfileModalOpen(true)}
                        title="Buka Pengaturan Profil Resto, Reset Menu & Keamanan Akun"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 transition-colors cursor-pointer"
                      >
                        <Store className="w-3.5 h-3.5 text-slate-700" />
                        <div className="text-left">
                          <div className="text-xs font-bold text-slate-900 leading-none">
                            {ws.authUser.name}
                          </div>
                          <div className="text-[10px] text-slate-500 leading-none mt-0.5">
                            Profil & Pengaturan
                          </div>
                        </div>
                        <Settings className="w-3.5 h-3.5 text-slate-500 ml-1" />
                      </button>
                      <button
                        type="button"
                        onClick={ws.handleLogout}
                        aria-label="Keluar dari akun restoran"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Keluar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          ws.setAuthGateReason(null);
                          ws.setAuthModalMode('login');
                          ws.setIsAuthModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        Masuk / Daftar Resto
                      </button>
                    </div>
                  )}
                </div>
              </header>

              {/* Demo Mode Notice Banner */}
              {!ws.authUser && (
                <div className="bg-amber-50/70 border border-amber-200/90 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>
                      Anda sedang menggunakan <strong>Mode Demo Terbatas</strong> (maksimal{' '}
                      {DEMO_MAX_MENU_ITEMS} menu). Daftar akun resto gratis untuk membuka{' '}
                      <strong>Simpan Cloud Supabase</strong>,{' '}
                      <strong>Template Skema Promo Resto</strong>, dan{' '}
                      <strong>Import/Export CSV</strong>.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      ws.setAuthGateReason(null);
                      ws.setAuthModalMode('register');
                      ws.setIsAuthModalOpen(true);
                    }}
                    className="shrink-0 font-bold text-amber-950 underline hover:text-amber-700 cursor-pointer"
                  >
                    Buat Akun Resto Gratis →
                  </button>
                </div>
              )}

              {/* 1. Workspace Switcher */}
              <WorkspaceSwitcher
                currentChannel={ws.channel}
                onChannelChange={ws.handleChannelChange}
              />

              {/* Crossfading Channel Content (GrabFood <-> GoFood) */}
              <ViewTransition
                key={ws.channel}
                enter="workspace-fade"
                exit="workspace-fade"
                default="none"
              >
                <div className="space-y-5 animate-workspace-switch">
                  {/* 2. KPI Summary Cards */}
                  <KpiSummaryCards
                    items={ws.items}
                    calculations={ws.calculations}
                    onApplyAllIdealPrices={ws.handleApplyAllIdealPrices}
                  />

                  {/* 3. Global Preset Bar with Custom Resto Discount Templates & Granular Reset */}
                  <GlobalPresetBar
                    channel={ws.channel}
                    presets={ws.presets}
                    onPresetsChange={ws.handlePresetsChange}
                    onApplyAllIdealPrices={ws.handleApplyAllIdealPrices}
                    onApplyPresetsToAllItems={ws.handleApplyPresetsToAllItems}
                    onResetDefaults={ws.handleResetDefaults}
                    onResetEmptyMenu={ws.handleResetEmptyMenu}
                    onResetZeroDiscounts={ws.handleResetZeroDiscounts}
                    onResetDisplayToOffline={ws.handleResetDisplayToOffline}
                    onCopyFromOtherChannel={ws.handleCopyFromOtherChannel}
                    onOpenReceiptModal={ws.handleOpenDefaultReceiptModal}
                    onSyncDatabase={ws.handleSyncDatabase}
                    isSyncingDb={ws.isSyncingDb}
                    dbSyncStatus={ws.dbSyncStatus}
                    isAuthenticated={Boolean(ws.authUser)}
                    discountTemplates={ws.discountTemplates}
                    onApplyTemplate={ws.handleApplyDiscountTemplate}
                    onSaveCustomTemplate={ws.handleSaveCustomTemplate}
                    onDeleteCustomTemplate={ws.handleDeleteCustomTemplate}
                    onRequireAuth={ws.requireAuth}
                  />

                  {/* 4. Responsive Pricing Table */}
                  <PricingTable
                    channel={ws.channel}
                    items={ws.items}
                    calculations={ws.calculations}
                    categories={ws.categories}
                    onUpdateItem={ws.handleUpdateItem}
                    onDeleteItem={ws.handleDeleteItem}
                    onDuplicateItem={ws.handleDuplicateItem}
                    onApplyIdealPrice={ws.handleApplyIdealPrice}
                    onBulkDeleteItems={ws.handleBulkDeleteItems}
                    onBulkApplyIdealPrices={ws.handleBulkApplyIdealPrices}
                    onBulkUpdateItems={ws.handleBulkUpdateItems}
                    onOpenReceiptModal={ws.handleOpenReceiptModal}
                    onOpenAddModal={ws.handleOpenAddModal}
                    onOpenEditModal={ws.handleOpenEditModal}
                    onOpenCategoryModal={ws.handleOpenCategoryModal}
                    onExportCsv={ws.handleExportCsv}
                    onImportCsv={ws.handleImportCsv}
                    highlightedItemId={ws.highlightedItemId}
                    isLoading={
                      ws.isPending || (ws.isLoadingWorkspace && ws.items.length === 0)
                    }
                  />
                </div>
              </ViewTransition>

              {/* Minimalist Footer */}
              <footer className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
                <div>
                  FoodMerchant Pricing Engine •{' '}
                  {ws.authUser
                    ? `Workspace: ${ws.authUser.name}`
                    : 'Mode Simulasi Demo'}
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span>
                    {isGrab ? 'GrabFood Settlement' : 'GoFood Maksimal PRO'}
                  </span>
                  <span>·</span>
                  <span>Supabase PostgreSQL Ready</span>
                </div>
              </footer>
            </div>
          </main>
        )}
      </ViewTransition>

      {/* Modals */}
      {ws.isAuthModalOpen && (
        <AuthModal
          key={ws.authModalMode}
          isOpen={ws.isAuthModalOpen}
          onClose={() => {
            ws.setIsAuthModalOpen(false);
            ws.setAuthGateReason(null);
          }}
          initialMode={ws.authModalMode}
          gateReason={ws.authGateReason}
          onAuthSuccess={ws.handleAuthSuccess}
        />
      )}

      {ws.isProfileModalOpen && ws.authUser && (
        <MerchantProfileModal
          key={`${ws.authUser.id}-${ws.authUser.name}-${ws.authUser.email}`}
          isOpen={ws.isProfileModalOpen}
          onClose={() => ws.setIsProfileModalOpen(false)}
          user={ws.authUser}
          channel={ws.channel}
          currentItems={ws.items}
          otherChannelItemsCount={ws.otherChannelItemsCount}
          calculations={ws.calculations}
          onProfileUpdated={(updatedUser) => {
            ws.setAuthUser(updatedUser);
            ws.showToast(`Profil "${updatedUser.name}" berhasil diperbarui`);
          }}
          onAccountDeleted={ws.handleAccountDeleted}
          onExportBackupJson={ws.handleExportBackupJson}
          onImportBackupJson={ws.handleImportBackupJson}
          onResetEmptyMenu={ws.handleResetEmptyMenu}
          onResetZeroDiscounts={ws.handleResetZeroDiscounts}
          onResetDisplayToOffline={ws.handleResetDisplayToOffline}
          onCopyFromOtherChannel={ws.handleCopyFromOtherChannel}
          onResetDefaults={ws.handleResetDefaults}
        />
      )}

      {ws.isEducationModalOpen && (
        <PricingEducationModal
          isOpen={ws.isEducationModalOpen}
          onClose={() => ws.setIsEducationModalOpen(false)}
        />
      )}

      {ws.isReceiptModalOpen && isGrab && (
        <GrabReceiptModal
          isOpen={ws.isReceiptModalOpen}
          onClose={() => ws.setIsReceiptModalOpen(false)}
          selectedItem={ws.selectedReceiptItem}
          roundingRule={ws.presets.roundingRule}
          onApplyIdealPrice={ws.handleApplyIdealPrice}
        />
      )}

      {ws.isReceiptModalOpen && !isGrab && (
        <GoFoodReceiptModal
          key={ws.selectedReceiptItem?.id ?? 'default'}
          isOpen={ws.isReceiptModalOpen}
          onClose={() => ws.setIsReceiptModalOpen(false)}
          selectedItem={ws.selectedReceiptItem}
          roundingRule={ws.presets.roundingRule}
          onApplyIdealPrice={ws.handleApplyIdealPrice}
        />
      )}

      {ws.isAddModalOpen && (
        <AddMenuModal
          isOpen={ws.isAddModalOpen}
          onClose={() => ws.setIsAddModalOpen(false)}
          channel={ws.channel}
          presets={ws.presets}
          categories={ws.categories}
          existingItems={ws.items}
          onAddMenuItem={ws.handleAddMenuItem}
          onAddNewCategory={ws.handleAddNewCategory}
        />
      )}

      {ws.isEditModalOpen && ws.selectedEditItem && (
        <EditMenuModal
          key={ws.selectedEditItem.id}
          isOpen={ws.isEditModalOpen}
          onClose={() => {
            ws.setIsEditModalOpen(false);
            ws.setSelectedEditItem(null);
          }}
          item={ws.selectedEditItem}
          channel={ws.channel}
          presets={ws.presets}
          categories={ws.categories}
          existingItems={ws.items}
          onSaveItem={ws.handleSaveEditedItem}
          onAddNewCategory={ws.handleAddNewCategory}
        />
      )}

      {ws.isCategoryModalOpen && (
        <ManageCategoriesModal
          isOpen={ws.isCategoryModalOpen}
          onClose={() => ws.setIsCategoryModalOpen(false)}
          categories={ws.categories}
          channel={ws.channel}
          items={ws.items}
          onUpdateCategories={ws.handleUpdateCategories}
          onShowToast={(msg, allowUndo) => ws.showToast(msg, allowUndo ?? false)}
        />
      )}

      {/* Accessible Toast Notification */}
      {ws.toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 animate-toast-in"
        >
          <span>{ws.toastMessage}</span>
          {ws.toastCanUndo && ws.undoSnapshot && (
            <button
              type="button"
              onClick={ws.handleUndo}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer"
            >
              <Undo2 className="w-3 h-3" />
              <span>Urungkan</span>
            </button>
          )}
        </div>
      )}
    </>
  );
}
