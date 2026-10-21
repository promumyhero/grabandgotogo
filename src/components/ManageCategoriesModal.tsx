'use client';

import React, { useState } from 'react';
import { MenuItem, WorkspaceChannel } from '@/types/pricing';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  Tags,
  FolderPlus,
  AlertTriangle,
} from 'lucide-react';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  channel: WorkspaceChannel;
  items: MenuItem[];
  onUpdateCategories: (
    newCategories: string[],
    updatedItems?: MenuItem[],
    deletedCategoryName?: string
  ) => void;
  onShowToast: (message: string, allowUndo?: boolean) => void;
}

export function ManageCategoriesModal({
  isOpen,
  onClose,
  categories,
  channel,
  items,
  onUpdateCategories,
  onShowToast,
}: ManageCategoriesModalProps) {
  const [newCatName, setNewCatName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<string | null>(null);

  if (!isOpen) return null;

  const isGrab = channel === 'GRABFOOD';

  // Count items per category
  const categoryCounts = new Map<string, number>();
  categories.forEach((c) => categoryCounts.set(c, 0));
  items.forEach((item) => {
    const cat = item.category || 'Umum';
    categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
  });

  // Handle Add New Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      onShowToast(`Kategori "${trimmed}" sudah ada.`);
      return;
    }

    const updated = [...categories, trimmed];
    onUpdateCategories(updated);
    setNewCatName('');
    onShowToast(`Kategori "${trimmed}" berhasil ditambahkan.`);
  };

  // Start editing category
  const handleStartEdit = (index: number, currentName: string) => {
    setEditingIndex(index);
    setEditingValue(currentName);
  };

  // Save renamed category
  const handleSaveEdit = (oldName: string) => {
    const trimmed = editingValue.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingIndex(null);
      return;
    }

    // Check duplicate
    if (
      categories.some(
        (c, idx) => idx !== editingIndex && c.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      onShowToast(`Kategori "${trimmed}" sudah ada.`);
      return;
    }

    const updatedCategories = categories.map((c) => (c === oldName ? trimmed : c));

    // Synchronize to all items using this category
    let countAffected = 0;
    const updatedItems = items.map((item) => {
      if (item.category === oldName) {
        countAffected++;
        return {
          ...item,
          category: trimmed,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    onUpdateCategories(updatedCategories, updatedItems);
    setEditingIndex(null);
    onShowToast(
      `Kategori "${oldName}" diubah menjadi "${trimmed}" (${countAffected} menu diperbarui).`
    );
  };

  // Delete category
  const handleDeleteCategory = (catToDelete: string) => {
    const updatedCategories = categories.filter((c) => c !== catToDelete);
    const affectedCount = categoryCounts.get(catToDelete) || 0;

    // Reassign any item in this category to 'Lainnya' if affected
    let updatedItems: MenuItem[] | undefined = undefined;
    if (affectedCount > 0) {
      const fallbackCat = 'Lainnya';
      if (!updatedCategories.includes(fallbackCat)) {
        updatedCategories.push(fallbackCat);
      }
      updatedItems = items.map((item) => {
        if (item.category === catToDelete) {
          return {
            ...item,
            category: fallbackCat,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      });
    }

    onUpdateCategories(updatedCategories, updatedItems, catToDelete);
    setDeleteConfirmCat(null);
    onShowToast(
      `Kategori "${catToDelete}" dihapus${
        affectedCount > 0 ? ` (${affectedCount} menu dipindahkan ke "Lainnya")` : ''
      }.`,
      true
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs ${
                isGrab ? 'bg-[#00B14F]' : 'bg-[#EE2737]'
              }`}
            >
              <Tags className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Kelola Kategori Menu
              </h3>
              <p className="text-xs text-slate-500">
                Workspace {isGrab ? 'GrabFood' : 'GoFood'} • Atur pengelompokan menu Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800">
          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Tambah Kategori Baru
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <FolderPlus className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Contoh: Paket Bento, Camilan Sore..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={!newCatName.trim()}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isGrab
                    ? 'bg-[#00B14F] hover:bg-emerald-600'
                    : 'bg-[#EE2737] hover:bg-rose-700'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>
          </form>

          {/* List of Categories */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b border-slate-100">
              <span>Daftar Kategori Aktif ({categories.length})</span>
              <span className="text-slate-400 font-normal">Jumlah Menu</span>
            </div>

            <div className="space-y-2 max-h-70 overflow-y-auto pr-1">
              {categories.map((cat, index) => {
                const count = categoryCounts.get(cat) || 0;
                const isEditing = editingIndex === index;
                const isConfirmingDelete = deleteConfirmCat === cat;

                return (
                  <div
                    key={`cat-${cat}-${index}`}
                    className="p-2.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2 text-xs transition-colors"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(cat);
                            if (e.key === 'Escape') setEditingIndex(null);
                          }}
                          autoFocus
                          className="flex-1 px-2 py-1 bg-white border border-emerald-500 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat)}
                          className="p-1 rounded-md text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="Simpan Perubahan"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Batal"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : isConfirmingDelete ? (
                      <div className="flex items-center justify-between gap-2 flex-1 bg-rose-50 border border-rose-200 p-1.5 rounded-lg text-rose-800">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span className="font-semibold text-[11px]">
                            Hapus &quot;{cat}&quot;? ({count} menu dipindah ke &quot;Lainnya&quot;)
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-md cursor-pointer"
                          >
                            Ya
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmCat(null)}
                            className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-[11px] rounded-md cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{cat}</span>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-slate-200 text-slate-600">
                            {count} menu
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(index, cat)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Ubah Nama Kategori"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmCat(cat)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>Perubahan kategori langsung tersimpan di sistem.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
