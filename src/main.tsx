import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initializeDatabase } from './lib/db';
import { notifySystemError } from './lib/telegram';

// Tangkap global error agar otomatis terkirim ke Telegram
window.addEventListener('error', (event) => {
  notifySystemError(event.message, event.filename ? `${event.filename}:${event.lineno}` : undefined);
});

window.addEventListener('unhandledrejection', (event) => {
  notifySystemError(String(event.reason));
});

// Inisialisasi offline storage IndexedDB sebelum render
initializeDatabase().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
