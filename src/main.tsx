import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import '@fontsource/roboto/latin-400.css';
import '@fontsource/roboto/vietnamese-400.css';
import '@fontsource/roboto/latin-500.css';
import '@fontsource/roboto/vietnamese-500.css';
import '@fontsource/roboto/latin-700.css';
import '@fontsource/roboto/vietnamese-700.css';
import '@fontsource/noto-serif/latin-700.css';
import '@fontsource/noto-serif/vietnamese-700.css';
import './styles/dashboard.css';
import './styles/sharpness.css';
import './styles/mobile-modern.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
