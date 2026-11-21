import React, { useState, useEffect } from 'react';
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
import { LoginScreen } from './components/screens/LoginScreen';
import { OcrModal } from './components/OcrModal';
import { isUserAuthenticated, clearAuthSession, initializeAuth } from './lib/auth';
import { syncTelegramConfigFromCloud, startTelegramPolling } from './lib/telegram';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isUserAuthenticated());
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // State OCR Struk Modal
  const [isOcrOpen, setIsOcrOpen] = useState<boolean>(false);
  const [prefillTx, setPrefillTx] = useState<{ channel: string; nominalRibuan: number } | null>(null);
  const [prefillExpense, setPrefillExpense] = useState<{ name: string; amountRibuan: number } | null>(null);

  useEffect(() => {
    initializeAuth();
    syncTelegramConfigFromCloud();
    startTelegramPolling();
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    setIsAuthenticated(false);
    setCurrentScreen('dashboard');
  };

  // Jika belum login, tampilkan layar login aman
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

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

  const handleApplyOcrTransaction = (data: {
    channel: 'BCA' | 'Bank' | 'Dana' | 'Ovo' | 'QRIS' | 'Lainnya';
    nominalRibuan: number;
    nominalRupiah: number;
    adminFee?: number;
    refNumber?: string;
  }) => {
    let target = 'tx-bank';
    if (data.channel === 'BCA') target = 'tx-bca';
    else if (data.channel === 'Dana') target = 'tx-dana';
    else if (data.channel === 'Ovo') target = 'tx-ovo';
    else if (data.channel === 'QRIS') target = 'qris';

    setPrefillTx({ channel: data.channel, nominalRibuan: data.nominalRibuan });
    setCurrentScreen(target);
  };

  const handleApplyOcrExpense = (data: {
    name: string;
    amountRibuan: number;
    amountRupiah: number;
  }) => {
    setPrefillExpense({ name: data.name, amountRibuan: data.amountRibuan });
    setCurrentScreen('expense');
  };

  const renderContent = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <DashboardScreen 
            onNavigate={setCurrentScreen} 
            onOpenOcr={() => setIsOcrOpen(true)} 
          />
        );
      case 'tx-bank':
        return (
          <TransactionScreen 
            channel="Bank" 
            onBack={() => setCurrentScreen('dashboard')} 
            onOpenOcr={() => setIsOcrOpen(true)}
            initialNominalRibuan={prefillTx?.channel === 'Bank' || prefillTx?.channel === 'Lainnya' ? prefillTx.nominalRibuan : undefined}
          />
        );
      case 'tx-dana':
        return (
          <TransactionScreen 
            channel="Dana" 
            onBack={() => setCurrentScreen('dashboard')} 
            onOpenOcr={() => setIsOcrOpen(true)}
            initialNominalRibuan={prefillTx?.channel === 'Dana' ? prefillTx.nominalRibuan : undefined}
          />
        );
      case 'tx-ovo':
        return (
          <TransactionScreen 
            channel="Ovo" 
            onBack={() => setCurrentScreen('dashboard')} 
            onOpenOcr={() => setIsOcrOpen(true)}
            initialNominalRibuan={prefillTx?.channel === 'Ovo' ? prefillTx.nominalRibuan : undefined}
          />
        );
      case 'tx-bca':
        return (
          <TransactionScreen 
            channel="BCA" 
            onBack={() => setCurrentScreen('dashboard')} 
            onOpenOcr={() => setIsOcrOpen(true)}
            initialNominalRibuan={prefillTx?.channel === 'BCA' ? prefillTx.nominalRibuan : undefined}
          />
        );
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
        return (
          <ExpenseScreen 
            onBack={() => setCurrentScreen('dashboard')} 
            onOpenOcr={() => setIsOcrOpen(true)}
            initialExpense={prefillExpense}
          />
        );
      case 'kasbon':
        return <KasbonScreen onBack={() => setCurrentScreen('dashboard')} />;
      case 'total':
        return <TotalScreen onBack={() => setCurrentScreen('dashboard')} />;
      case 'admin':
        return <AdminScreen onBack={() => setCurrentScreen('dashboard')} />;
      default:
        return (
          <DashboardScreen 
            onNavigate={setCurrentScreen} 
            onOpenOcr={() => setIsOcrOpen(true)} 
          />
        );
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
        onOpenOcr={() => setIsOcrOpen(true)}
      />

      {/* Main Screen Body */}
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Modal Scanner OCR Struk */}
      <OcrModal
        isOpen={isOcrOpen}
        onClose={() => {
          setIsOcrOpen(false);
          setPrefillTx(null);
          setPrefillExpense(null);
        }}
        onApplyTransaction={handleApplyOcrTransaction}
        onApplyExpense={handleApplyOcrExpense}
      />

      {/* Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={setCurrentScreen}
        onLogout={handleLogout}
      />

      {/* Persistent Bottom Nav */}
      <BottomNav
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
      />
    </div>
  );
};

export default App;
