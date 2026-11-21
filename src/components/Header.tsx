import React from 'react';
import { Menu, Cloud, CloudOff } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

interface HeaderProps {
  title: string;
  onOpenDrawer: () => void;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onOpenDrawer,
  showBack = false,
  onBack,
  rightAction
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-3 bg-[#09275F] text-white shadow-sm border-b border-[#1749B5]/30">
      <div className="flex items-center gap-2">
        {showBack ? (
          <button
            onClick={onBack}
            className="p-2 -ml-1 text-white hover:bg-white/10 rounded-lg btn-press flex items-center justify-center font-bold text-lg"
            aria-label="Kembali"
          >
            ←
          </button>
        ) : (
          <button
            onClick={onOpenDrawer}
            className="p-2 -ml-1 text-white hover:bg-white/10 rounded-lg btn-press flex items-center justify-center"
            aria-label="Buka Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}
        <img src="/favicon.webp" alt="Aldea Logo" className="w-6 h-6 object-contain rounded-md" />
        <h1 className="text-lg font-bold tracking-tight truncate max-w-[200px]">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium bg-black/25 text-white/90 border border-white/10"
          title={isSupabaseConfigured ? "Tersambung ke Supabase" : "Mode Offline Lokal"}
        >
          {isSupabaseConfigured ? (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Online</span>
            </>
          ) : (
            <>
              <CloudOff className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Lokal</span>
            </>
          )}
        </div>

        {rightAction}
      </div>
    </header>
  );
};
