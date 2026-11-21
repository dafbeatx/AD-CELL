import React from 'react';
import { LayoutGrid, ArrowLeftRight, Package, BookOpen, Calculator } from 'lucide-react';

interface BottomNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Menu', icon: LayoutGrid },
    { id: 'tx-bank', label: 'Transaksi', icon: ArrowLeftRight },
    { id: 'product-acc', label: 'Produk', icon: Package },
    { id: 'kasbon', label: 'Kasbon', icon: BookOpen },
    { id: 'total', label: 'Totalan', icon: Calculator },
  ];

  const isActive = (id: string) => {
    if (id === 'dashboard') return currentScreen === 'dashboard';
    if (id === 'tx-bank') return currentScreen.startsWith('tx-') || currentScreen === 'pulsa' || currentScreen === 'qris';
    if (id === 'product-acc') return currentScreen.startsWith('product-');
    if (id === 'kasbon') return currentScreen === 'kasbon';
    if (id === 'total') return currentScreen === 'total';
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E0E7F2] shadow-lg max-w-md mx-auto">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const active = isActive(item.id);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center gap-1 pt-1 pb-1 transition-colors btn-press ${
                active ? 'text-[#1749B5] font-bold' : 'text-[#6F7C92] hover:text-[#182338]'
              }`}
            >
              <div className={`p-1 rounded-full ${active ? 'bg-[#EBF1FD]' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
