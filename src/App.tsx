import { useEffect, useState } from 'react';
import { useLighting } from './hooks/useLighting';
import { useRgbLed } from './hooks/useRgbLed';
import { Desktop } from './layouts/Desktop';
import { Mobile } from './layouts/Mobile';
import { DetailPanel } from './pages/DetailPanel';
import { LoginModal } from './components/LoginModal';
import { AiAssistant } from './components/AiAssistant';
import { useAuth } from './contexts/AuthContext';
import { MusicProvider } from './contexts/MusicContext';

export default function App() {
  const state = useLighting();
  const rgb = useRgbLed();
  const { isAuthenticated, loading } = useAuth();
  const [page, setPage] = useState('Tổng quan');
  const [loginOpen, setLoginOpen] = useState(false);
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const resize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Default to desktop view so web always shows full desktop dashboard
  const [layoutMode, setLayoutMode] = useState<'desktop' | 'mobile'>(() => {
    const saved = localStorage.getItem('atk-layout-mode');
    if (saved === 'mobile' || saved === 'desktop') return saved;
    return 'desktop';
  });

  const isMobileView = layoutMode === 'mobile';
  const desktopScale = Math.max(0.65, Math.min(size.width / 900, (size.height - 12) / 556));

  const toggleLayoutMode = () => {
    const next = isMobileView ? 'desktop' : 'mobile';
    setLayoutMode(next);
    localStorage.setItem('atk-layout-mode', next);
  };

  return (
    <MusicProvider>
      <div
        className={isMobileView ? 'app-shell mobile-shell' : 'app-shell desktop-shell'}
        style={{
          minHeight: '100vh',
          height: isMobileView ? 'auto' : size.height,
          display: 'flex',
          alignItems: isMobileView ? 'stretch' : 'center',
          justifyContent: 'center',
          overflowY: isMobileView ? 'auto' : 'hidden',
          overflowX: isMobileView ? 'hidden' : 'auto',
          background: '#150505',
        }}
      >
        <div
          className={isMobileView ? 'mobile-root-wrapper' : 'scaled-app'}
          style={
            isMobileView
              ? { width: '100%', minHeight: '100vh' }
              : {
                  width: Math.max(900, size.width / desktopScale),
                  minHeight: 556,
                  zoom: desktopScale,
                }
          }
        >
          {isMobileView ? (
            <Mobile state={state} rgb={rgb} onNavigate={setPage} currentPage={page} />
          ) : (
            <Desktop state={state} rgb={rgb} onNavigate={setPage} currentPage={page} />
          )}
        </div>

        {/* Nút chuyển đổi nhanh Giao diện Máy tính / Điện thoại */}
        <div
          style={{
            position: 'fixed',
            bottom: '16px',
            left: '16px',
            zIndex: 9999,
          }}
        >
          <button
            onClick={toggleLayoutMode}
            style={{
              background: 'linear-gradient(135deg, #b58b42, #755020)',
              color: '#fff0c8',
              border: '1px solid #ffe29b',
              borderRadius: '24px',
              padding: '7px 15px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(8px)',
              transition: 'transform 0.2s',
            }}
          >
            {isMobileView ? '🖥️ Chuyển sang Web Máy Tính' : '📱 Xem giao diện Điện Thoại'}
          </button>
        </div>

        {page !== 'Tổng quan' && (
          <DetailPanel
            page={page}
            state={state}
            rgb={rgb}
            onClose={() => setPage('Tổng quan')}
            onOpenLogin={() => setLoginOpen(true)}
          />
        )}

        {state.error && page === 'Tổng quan' && (
          <div className="device-error" role="alert">
            {state.error}
            <button onClick={state.clearError} aria-label="Đóng thông báo">
              ×
            </button>
          </div>
        )}

        <LoginModal
          isOpen={loginOpen}
          onClose={() => setLoginOpen(false)}
          required={!isAuthenticated}
        />

        <AiAssistant state={state} rgb={rgb} onNavigate={setPage} />
      </div>
    </MusicProvider>
  );
}
