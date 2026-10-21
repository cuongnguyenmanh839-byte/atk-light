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

  // Login modal can be opened by user via header or detail panel

  const mobile = size.width <= 768;
  const desktopScale = Math.min(size.width / 900, (size.height - 12) / 556);

  return (
    <MusicProvider>
      <div
        className={mobile ? 'app-shell mobile-shell' : 'app-shell desktop-shell'}
        style={{
          minHeight: '100vh',
          height: mobile ? 'auto' : size.height,
          display: 'flex',
          alignItems: mobile ? 'stretch' : 'center',
          justifyContent: 'center',
          overflowY: mobile ? 'auto' : 'hidden',
          background: '#150505',
        }}
      >
        <div
          className={mobile ? 'mobile-root-wrapper' : 'scaled-app'}
          style={
            mobile
              ? { width: '100%', minHeight: '100vh' }
              : {
                  width: size.width / desktopScale,
                  minHeight: 556,
                  zoom: desktopScale,
                }
          }
        >
          {mobile ? (
            <Mobile state={state} rgb={rgb} onNavigate={setPage} currentPage={page} />
          ) : (
            <Desktop state={state} rgb={rgb} onNavigate={setPage} currentPage={page} />
          )}
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
