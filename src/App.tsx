import React, { useState } from 'react';
import { Header } from './components/Header';
import { Drawer } from './components/Drawer';
import { BottomNav } from './components/BottomNav';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { TransactionScreen } from './components/screens/TransactionScreen';
import { ProductScreen } from './components/screens/ProductScreen';
import { KasbonScreen } from './components/screens/KasbonScreen';
import { ExpenseScreen } from './components/screens/ExpenseScreen';
import { TotalScreen } from './components/screens/TotalScreen';
import { PulsaScreen } from './components/screens/PulsaScreen';
import { QrisScreen } from './components/screens/QrisScreen';
import { AdminScreen } from './components/screens/AdminScreen';

export const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const getScreenTitle = (): string => {
    switch (currentScreen) {
      case 'dashboard': return 'Aldea POS';
      case 'tx-bank': return 'Transaksi Bank';
      case 'tx-dana': return 'Transaksi Dana';
      case 'tx-ovo': return 'Transaksi OVO';
      case 'tx-bca': return 'Transaksi BCA';
      case 'product-acc': return 'Produk Acc';
      case 'product-atk': return 'Produk ATK';
      case 'product-voucher': return 'Voucher & SP';
      case 'pulsa': return 'Transaksi Pulsa';
      case 'qris': return 'Transaksi QRIS';
      case 'expense': return 'Pengeluaran';
      case 'kasbon': return 'Buku Kasbon';
      case 'total': return 'Totalan & Closing';
      case 'admin': return 'Panel Admin';
      default: return 'Aldea POS';
    }
  };

  const renderContent = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen onNavigate={setCurrentScreen} />;
      case 'tx-bank':
        return <TransactionScreen channel="Bank" onBack={() => setCurrentScreen('dashboard')} />;
      case 'tx-dana':
        return <TransactionScreen channel="Dana" onBack={() => setCurrentScreen('dashboard')} />;
      case 'tx-ovo':
        return <TransactionScreen channel="Ovo" onBack={() => setCurrentScreen('dashboard')} />;
      case 'tx-bca':
        return <TransactionScreen channel="BCA" onBack={() => setCurrentScreen('dashboard')} />;
      case 'product-acc':
        return <ProductScreen category="Acc" onBack={() => setCurrentScreen('dashboard')} />;
      case 'product-atk':
        return <ProductScreen category="Atk" onBack={() => setCurrentScreen('dashboard')} />;
      case 'product-voucher':
        return <ProductScreen category="Voucher" onBack={() => setCurrentScreen('dashboard')} />;
      case 'pulsa':
        return <PulsaScreen onBack={() => setCurrentScreen('dashboard')} />;
      case 'qris':
        return <QrisScreen onBack={() => setCurrentScreen('dashboard')} />;
      case 'expense':
        return <ExpenseScreen onBack={() => setCurrentScreen('dashboard')} />;
      case 'kasbon':
        return <KasbonScreen onBack={() => setCurrentScreen('dashboard')} />;
      case 'total':
        return <TotalScreen onBack={() => setCurrentScreen('dashboard')} />;
      case 'admin':
        return <AdminScreen onBack={() => setCurrentScreen('dashboard')} />;
      default:
        return <DashboardScreen onNavigate={setCurrentScreen} />;
    }
  };

  const isMainDashboard = currentScreen === 'dashboard';

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col max-w-md mx-auto relative shadow-2xl overflow-x-hidden">
      {/* Header */}
      <Header
        title={getScreenTitle()}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        showBack={!isMainDashboard}
        onBack={() => setCurrentScreen('dashboard')}
      />

      {/* Main Screen Body */}
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={setCurrentScreen}
      />

      {/* Persistent Bottom Nav (Single-Thumb Ergonomics) */}
      <BottomNav
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
      />
    </div>
  );
};

export default App;
