'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FoodSuggestion } from '@/lib/food-catalog';
import { formatRupiah } from '@/lib/pricing-engine';
import { X, Check, Utensils } from 'lucide-react';

interface MenuNameAutocompleteProps {
  id?: string;
  value: string;
  inferredBadge: string | null;
  suggestions: FoodSuggestion[];
  onChange: (val: string) => void;
  onClear: () => void;
  onSelectSuggestion: (sug: FoodSuggestion) => void;
}

export function MenuNameAutocomplete({
  id = 'menu-name-input',
  value,
  inferredBadge,
  suggestions,
  onChange,
  onClear,
  onSelectSuggestion,
}: MenuNameAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && suggestions[selectedIndex]) {
      e.preventDefault();
      onSelectSuggestion(suggestions[selectedIndex]);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
          Nama Menu <span className="text-rose-500">*</span>
        </label>
        {inferredBadge && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Kategori: <strong className="text-slate-900">{inferredBadge}</strong></span>
          </span>
        )}
      </div>

      <div className="relative">
        <input
          id={id}
          type="text"
          required
          placeholder="Contoh: Nasi Rames, Ayam Geprek, Es Teh..."
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 bg-slate-50/50 focus:bg-white text-slate-900 transition-colors"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onClear();
              setSelectedIndex(-1);
            }}
            aria-label="Bersihkan nama menu"
            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
        >
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-500">
            <span>Saran Menu & Kategori</span>
            <span className="text-[10px] text-slate-400">Pilih untuk isi otomatis</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
            {suggestions.map((sug, idx) => (
              <button
                key={`${sug.name}-${idx}`}
                type="button"
                role="option"
                aria-selected={selectedIndex === idx}
                onClick={() => {
                  onSelectSuggestion(sug);
                  setShowSuggestions(false);
                }}
                className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors cursor-pointer ${
                  selectedIndex === idx ? 'bg-slate-100' : ''
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                    <Utensils className="w-3 h-3" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {sug.name}
                    </div>
                    <div className="text-[10px] text-slate-400 tabular-nums">
                      Estimasi offline: {formatRupiah(sug.suggestedOfflinePrice)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
                    {sug.category}
                  </span>
                  {sug.source === 'existing' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-50 text-emerald-700">
                      Tersimpan
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

