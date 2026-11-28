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
import { isUserAuthenticated, clearAuthSession, initializeAuth } from './lib/auth';
import { startTelegramPolling } from './lib/telegram';
import { syncAppConfigFromCloud } from './lib/cloudConfig';
import { getChannels, getChannelById } from './lib/channels';
import { TxChannelConfig } from './types';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isUserAuthenticated());
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [channels, setChannels] = useState<TxChannelConfig[]>(() => getChannels());

  useEffect(() => {
    initializeAuth();
    syncAppConfigFromCloud();
    startTelegramPolling();

    const handleConfigUpdate = () => setChannels(getChannels());
    window.addEventListener('aldea-config-updated', handleConfigUpdate);
    return () => window.removeEventListener('aldea-config-updated', handleConfigUpdate);
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    setIsAuthenticated(false);
    setCurrentScreen('dashboard');
  };

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const getChannelName = (id: string, fallback: string) =>
    channels.find(c => c.id === id)?.name || fallback;

  const getScreenTitle = (): string => {
    if (currentScreen.startsWith('tx:')) {
      const chId = currentScreen.slice(3);
      const ch = channels.find(c => c.id === chId) || getChannelById(chId);
      return ch ? `Transaksi ${ch.name}` : 'Transaksi';
    }
    switch (currentScreen) {
      case 'dashboard': return 'Aldea POS';
      case 'product-acc': return 'Produk Acc';
      case 'product-atk': return 'Produk ATK';
      case 'product-voucher': return 'Voucher & SP';
      case 'pulsa': return `Transaksi ${getChannelName('pulsa', 'Pulsa')}`;
      case 'qris': return `Transaksi ${getChannelName('qris', 'QRIS')}`;
      case 'expense': return 'Pengeluaran';
      case 'kasbon': return 'Buku Kasbon';
      case 'total': return 'Totalan & Closing';
      case 'admin': return 'Panel Admin';
      default: return 'Aldea POS';
    }
  };

  const renderContent = () => {
    if (currentScreen.startsWith('tx:')) {
      const chId = currentScreen.slice(3);
      const ch = channels.find(c => c.id === chId) || getChannelById(chId) || channels[0];
      return <TransactionScreen channelConfig={ch} onBack={() => setCurrentScreen('dashboard')} />;
    }

    switch (currentScreen) {
      case 'dashboard':
        return <DashboardScreen onNavigate={setCurrentScreen} />;
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
      <Header
        title={getScreenTitle()}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        showBack={!isMainDashboard}
        onBack={() => setCurrentScreen('dashboard')}
      />

      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigate={setCurrentScreen}
        onLogout={handleLogout}
      />

      <BottomNav
        currentScreen={currentScreen}
        onNavigate={setCurrentScreen}
      />
    </div>
  );
};

export default App;
