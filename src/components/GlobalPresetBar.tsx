'use client';

import React, { memo, useState, useRef, useEffect } from 'react';
import {
  DiscountTemplate,
  DiscountType,
  GlobalPresets,
  RoundingRule,
  WorkspaceChannel,
} from '@/types/pricing';
import {
  sanitizeNumericInput,
  handleNumberInputFocus,
} from '@/lib/input-utils';
import {
  RotateCcw,
  Bookmark,
  Plus,
  Trash2,
  Lock,
  Check,
  Database,
  Receipt,
  ChevronDown,
  Copy,
  Percent,
  Eraser,
} from 'lucide-react';

interface GlobalPresetBarProps {
  channel: WorkspaceChannel;
  presets: GlobalPresets;
  onPresetsChange: (updated: GlobalPresets) => void;
  onApplyAllIdealPrices: () => void;
  onApplyPresetsToAllItems: () => void;
  onResetDefaults: () => void;
  onResetEmptyMenu?: () => void;
  onResetZeroDiscounts?: () => void;
  onResetDisplayToOffline?: () => void;
  onCopyFromOtherChannel?: () => void;
  onOpenReceiptModal: () => void;
  onSyncDatabase: () => void;
  isSyncingDb: boolean;
  dbSyncStatus: 'idle' | 'success' | 'fallback' | 'error';
  isAuthenticated?: boolean;
  discountTemplates?: DiscountTemplate[];
  onApplyTemplate?: (template: DiscountTemplate) => void;
  onSaveCustomTemplate?: (name: string) => void;
  onDeleteCustomTemplate?: (templateId: string) => void;
  onRequireAuth?: (reason: string) => void;
}

export const GlobalPresetBar = memo(function GlobalPresetBar({
  channel,
  presets,
  onPresetsChange,
  onApplyAllIdealPrices,
  onApplyPresetsToAllItems,
  onResetDefaults,
  onResetEmptyMenu,
  onResetZeroDiscounts,
  onResetDisplayToOffline,
  onCopyFromOtherChannel,
  onOpenReceiptModal,
  onSyncDatabase,
  isSyncingDb,
  dbSyncStatus,
  isAuthenticated = false,
  discountTemplates = [],
  onApplyTemplate,
  onSaveCustomTemplate,
  onDeleteCustomTemplate,
  onRequireAuth,
}: GlobalPresetBarProps) {
  const isGrab = channel === 'GRABFOOD';
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [isResetMenuOpen, setIsResetMenuOpen] = useState(false);
  const resetDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isResetMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resetDropdownRef.current &&
        !resetDropdownRef.current.contains(e.target as Node)
      ) {
        setIsResetMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isResetMenuOpen]);

  const handleChange = <K extends keyof GlobalPresets>(
    key: K,
    value: GlobalPresets[K]
  ) => {
    setSelectedTemplateId('');
    onPresetsChange({
      ...presets,
      [key]: value,
    });
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const found = discountTemplates.find((t) => t.id === templateId);
    if (found && onApplyTemplate) {
      onApplyTemplate(found);
    }
  };

  const handleStartCreateTemplate = () => {
    if (!isAuthenticated) {
      onRequireAuth?.(
        'Masuk ke Akun Resto untuk menyimpan Template Skema Promo khusus restoran Anda.'
      );
      return;
    }
    setIsCreatingTemplate(true);
  };

  const handleConfirmCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTemplateName.trim();
    if (!trimmed) return;
    onSaveCustomTemplate?.(trimmed);
    setNewTemplateName('');
    setIsCreatingTemplate(false);
  };

  const customTemplates = discountTemplates.filter((t) => !t.isBuiltIn);
  const otherChannelName = isGrab ? 'GoFood' : 'GrabFood';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5">
      {/* Top Row: Title + Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Parameter & Skema Diskon Default ({isGrab ? 'GrabFood' : 'GoFood / GoBiz'})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isGrab
              ? 'Komisi reguler GrabFood 20% + Booster Pemasaran 14% dihitung dari harga setelah diskon.'
              : 'Komisi GoFood Delivery 20% + Rp 800, dengan pembagian subsidi promo bersama Gojek.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenReceiptModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-slate-500" />
            Simulasi Struk
          </button>

          <button
            type="button"
            onClick={onSyncDatabase}
            disabled={isSyncingDb}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title={
              isAuthenticated
                ? 'Simpan seluruh menu & preset ke Supabase Cloud Database'
                : 'Login untuk menyimpan ke Supabase Cloud Database'
            }
          >
            {isAuthenticated ? (
              <Database className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>
              {isSyncingDb
                ? 'Menyimpan...'
                : dbSyncStatus === 'success'
                  ? 'Tersimpan di Cloud'
                  : 'Simpan ke Cloud'}
            </span>
          </button>

          {/* Granular Reset & Cross-Channel Copy Dropdown */}
          <div ref={resetDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsResetMenuOpen((prev) => !prev)}
              aria-expanded={isResetMenuOpen}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset & Salin Menu</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isResetMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl border border-slate-200 shadow-xl z-30 py-1.5 text-xs">
                {onCopyFromOtherChannel && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMenuOpen(false);
                      onCopyFromOtherChannel();
                    }}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-start gap-2.5 cursor-pointer"
                  >
                    <Copy className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900">
                        Salin Menu dari {otherChannelName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Impor daftar menu {otherChannelName} & hitung harga ideal otomatis
                      </div>
                    </div>
                  </button>
                )}

                {onResetZeroDiscounts && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMenuOpen(false);
                      onResetZeroDiscounts();
                    }}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-start gap-2.5 cursor-pointer"
                  >
                    <Percent className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900">
                        Reset Semua Diskon ke 0%
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Matikan diskon promo tanpa menghapus daftar menu
                      </div>
                    </div>
                  </button>
                )}

                {onResetDisplayToOffline && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMenuOpen(false);
                      onResetDisplayToOffline();
                    }}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-start gap-2.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900">
                        Reset Harga Tayang = Harga Offline
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Kembalikan harga tayang ke harga dasar (0% markup)
                      </div>
                    </div>
                  </button>
                )}

                {onResetEmptyMenu && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMenuOpen(false);
                      onResetEmptyMenu();
                    }}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-amber-50 flex items-start gap-2.5 cursor-pointer border-t border-slate-100"
                  >
                    <Eraser className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-amber-950">
                        Kosongkan Semua Menu (Mulai dari 0)
                      </div>
                      <div className="text-[11px] text-amber-800">
                        Hapus menu contoh untuk mulai input menu asli resto
                      </div>
                    </div>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsResetMenuOpen(false);
                    onResetDefaults();
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-50 text-slate-600 border-t border-slate-100 cursor-pointer"
                >
                  Kembalikan ke Menu Contoh Bawaan
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onApplyPresetsToAllItems}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Terapkan Parameter ke Semua Menu
          </button>

          <button
            type="button"
            onClick={onApplyAllIdealPrices}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-lg transition-colors cursor-pointer ${
              isGrab
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            Sesuaikan Semua ke Harga Ideal
          </button>
        </div>
      </div>

      {/* Template Skema Promo Resto Bar */}
      <div className="bg-slate-50/80 rounded-lg border border-slate-200/80 p-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-slate-600 shrink-0" />
            <div>
              <span className="text-xs font-semibold text-slate-800">
                Template Skema Promo Resto
              </span>
              <span className="hidden md:inline text-[11px] text-slate-500 ml-2">
                Pilih skema kampanye siap pakai atau simpan racikan diskon khusus restoran Anda
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Pilih Template Skema Promo Resto"
              value={selectedTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="">-- Pilih Skema Promo Cepat --</option>
              <optgroup label="Skema Standar Platform">
                {discountTemplates
                  .filter((t) => t.isBuiltIn)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </optgroup>
              {customTemplates.length > 0 && (
                <optgroup label="Skema Kustom Resto Saya">
                  {customTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      ★ {t.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {!isCreatingTemplate ? (
              <button
                type="button"
                onClick={handleStartCreateTemplate}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title={
                  isAuthenticated
                    ? 'Simpan pengaturan komisi & diskon saat ini sebagai Template Resto'
                    : 'Login untuk menyimpan Template Skema Promo Resto'
                }
              >
                {isAuthenticated ? (
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                )}
                Simpan Skema Resto
              </button>
            ) : (
              <form
                onSubmit={handleConfirmCreateTemplate}
                className="flex items-center gap-1.5"
              >
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Misal: Promo Payday 35%"
                  maxLength={60}
                  autoFocus
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 w-44"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingTemplate(false);
                    setNewTemplateName('');
                  }}
                  className="px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Saved Custom Templates Pills */}
        {customTemplates.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-200/70">
            <span className="text-[11px] font-medium text-slate-500 mr-1">
              Skema Tersimpan:
            </span>
            {customTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  selectedTemplateId === tpl.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className="cursor-pointer"
                >
                  {tpl.name} (
                  {tpl.merchantDiscountType === 'PERCENT'
                    ? `${tpl.merchantDiscountValue}%`
                    : `Rp ${tpl.merchantDiscountValue.toLocaleString('id-ID')}`}
                  )
                </button>
                {onDeleteCustomTemplate && (
                  <button
                    type="button"
                    onClick={() => onDeleteCustomTemplate(tpl.id)}
                    aria-label={`Hapus skema ${tpl.name}`}
                    className={`p-0.5 rounded hover:bg-rose-500/20 transition-colors cursor-pointer ${
                      selectedTemplateId === tpl.id
                        ? 'text-slate-300 hover:text-white'
                        : 'text-slate-400 hover:text-rose-600'
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Parameter Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div>
          <label
            htmlFor="preset-commission-pct"
            className="block text-xs font-medium text-slate-600 mb-1.5"
          >
            {isGrab ? 'Komisi Platform (%)' : 'Biaya Layanan GoFood (%)'}
          </label>
          <div className="relative">
            <input
              id="preset-commission-pct"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={presets.platformCommissionPct}
              onFocus={handleNumberInputFocus}
              onChange={(e) => {
                const { stringValue, numericValue } = sanitizeNumericInput(
                  e.target.value,
                  { min: 0, max: 100, allowDecimals: true }
                );
                e.target.value = stringValue;
                handleChange('platformCommissionPct', numericValue);
              }}
              className="w-full px-3 py-2 text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
              {isGrab ? '%' : '% + 800'}
            </span>
          </div>
        </div>

        {isGrab ? (
          <div>
            <label
              htmlFor="preset-booster-pct"
              className="block text-xs font-medium text-slate-600 mb-1.5"
            >
              Biaya Sukses Pemasaran (%)
            </label>
            <div className="relative">
              <input
                id="preset-booster-pct"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={presets.marketingBoosterPct}
                onFocus={handleNumberInputFocus}
                onChange={(e) => {
                  const { stringValue, numericValue } = sanitizeNumericInput(
                    e.target.value,
                    { min: 0, max: 100, allowDecimals: true }
                  );
                  e.target.value = stringValue;
                  handleChange('marketingBoosterPct', numericValue);
                }}
                className="w-full px-3 py-2 text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                %
              </span>
            </div>
          </div>
        ) : (
          <div>
            <label
              htmlFor="preset-gojek-subsidy"
              className="block text-xs font-medium text-slate-600 mb-1.5"
            >
              Subsidi Promo Gojek (%)
            </label>
            <div className="relative">
              <input
                id="preset-gojek-subsidy"
                type="number"
                min="0"
                max="100"
                step="1"
                value={presets.gojekSubsidyPct ?? 25}
                onFocus={handleNumberInputFocus}
                onChange={(e) => {
                  const { stringValue, numericValue } = sanitizeNumericInput(
                    e.target.value,
                    { min: 0, max: 100, allowDecimals: true }
                  );
                  e.target.value = stringValue;
                  handleChange('gojekSubsidyPct', numericValue);
                }}
                className="w-full px-3 py-2 text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                % Subsidi
              </span>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="preset-discount-val"
            className="block text-xs font-medium text-slate-600 mb-1.5"
          >
            {isGrab ? 'Default Diskon Merchant' : 'Default Promo Konsumen'}
          </label>
          <div className="flex gap-1.5">
            <select
              aria-label="Tipe Diskon Default"
              value={presets.merchantDiscountType}
              onChange={(e) =>
                handleChange('merchantDiscountType', e.target.value as DiscountType)
              }
              className="px-2.5 py-2 text-xs font-semibold bg-slate-100 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="PERCENT">%</option>
              <option value="NOMINAL">Rp</option>
            </select>
            <input
              id="preset-discount-val"
              type="number"
              min="0"
              value={presets.merchantDiscountValue}
              onFocus={handleNumberInputFocus}
              onChange={(e) => {
                const isPercent = presets.merchantDiscountType === 'PERCENT';
                const { stringValue, numericValue } = sanitizeNumericInput(
                  e.target.value,
                  {
                    min: 0,
                    max: isPercent ? 95 : 100_000_000,
                    allowDecimals: isPercent,
                  }
                );
                e.target.value = stringValue;
                handleChange('merchantDiscountValue', numericValue);
              }}
              className="w-full px-3 py-2 text-sm font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="preset-rounding-rule"
            className="block text-xs font-medium text-slate-600 mb-1.5"
          >
            Aturan Pembulatan Harga
          </label>
          <select
            id="preset-rounding-rule"
            value={presets.roundingRule}
            onChange={(e) =>
              handleChange('roundingRule', e.target.value as RoundingRule)
            }
            className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
          >
            <option value="CEIL_500">Ke Atas Kelipatan Rp 500</option>
            <option value="CEIL_1000">Ke Atas Kelipatan Rp 1.000</option>
            <option value="CEIL_100">Ke Atas Kelipatan Rp 100</option>
            <option value="EXACT">Harga Eksak (Rp 1)</option>
          </select>
        </div>

        {isGrab ? (
          <div>
            <span className="block text-xs font-medium text-slate-600 mb-1.5">
              Status Default Booster (14%)
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={presets.isBoosterActiveDefault}
              onClick={() =>
                handleChange(
                  'isBoosterActiveDefault',
                  !presets.isBoosterActiveDefault
                )
              }
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                presets.isBoosterActiveDefault
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <span>
                {presets.isBoosterActiveDefault
                  ? 'Aktif (Total 34%)'
                  : 'Nonaktif (20%)'}
              </span>
              <div
                className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                  presets.isBoosterActiveDefault ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    presets.isBoosterActiveDefault ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>
        ) : (
          <div>
            <span className="block text-xs font-medium text-slate-600 mb-1.5">
              Skema Kampanye Gojek
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={presets.isCoFundedPromo ?? true}
              onClick={() =>
                handleChange('isCoFundedPromo', !(presets.isCoFundedPromo ?? true))
              }
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                (presets.isCoFundedPromo ?? true)
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <span>
                {(presets.isCoFundedPromo ?? true)
                  ? `Subsidi ${presets.gojekSubsidyPct ?? 25}%`
                  : 'Mandiri 100%'}
              </span>
              <div
                className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                  (presets.isCoFundedPromo ?? true) ? 'bg-rose-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white transition-transform ${
                    (presets.isCoFundedPromo ?? true)
                      ? 'translate-x-4'
                      : 'translate-x-0'
                  }`}
                />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
