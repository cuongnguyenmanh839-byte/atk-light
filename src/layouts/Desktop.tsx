import { useEffect, useState } from 'react';
import { Home, MapPin, Sun, CalendarDays, Zap, TriangleAlert, FileText, Settings, CloudSun, UserRound, ChevronDown, ShieldCheck, Music, Palette, Sparkles, Wifi } from 'lucide-react';
import type { Lighting } from '../hooks/useLighting';
import type { RgbLedHook } from '../hooks/useRgbLed';
import { StatCards, EnergyChart, AlertList } from '../components/Summary';
import { HeritageMap } from '../components/HeritageMap';
import { QuickControl } from '../components/Controls';
import { useAuth } from '../contexts/AuthContext';
import { useHistoricalMusic } from '../contexts/MusicContext';

export const desktopNav = [
  { label: 'Tổng quan', icon: Home },
  { label: 'Khu vực', icon: MapPin },
  { label: 'Điều khiển', icon: Sun },
  { label: 'LED RGB (ESP32)', icon: Palette },
  { label: 'Kết nối IP thiết bị', icon: Wifi },
  { label: 'Lịch hoạt động', icon: CalendarDays },
  { label: 'Âm nhạc lịch sử', icon: Music },
  { label: 'Giám sát năng lượng', icon: Zap },
  { label: 'Cảnh báo', icon: TriangleAlert },
  { label: 'Phân quyền', icon: ShieldCheck },
  { label: 'Báo cáo', icon: FileText },
  { label: 'Cài đặt', icon: Settings },
];

export function Desktop({ state, rgb, onNavigate, currentPage = 'Tổng quan' }: { state: Lighting; rgb?: RgbLedHook; onNavigate: (page: string) => void; currentPage?: string }) {
  const { user } = useAuth();
  const { currentSong, isPlaying } = useHistoricalMusic();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const capitalizedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

  const roleText = user
    ? user.role === 'SUPER_ADMIN'
      ? 'Quản trị tối cao'
      : user.role === 'ADMIN'
      ? 'Quản trị viên'
      : user.role === 'OPERATOR'
      ? 'Người vận hành'
      : 'Người xem'
    : 'Trung tâm điều khiển';

  return (
    <div className="desktop-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mountain" aria-hidden="true" />
          <strong>ATK ĐỊNH HÓA</strong>
          <span>THÁI NGUYÊN</span>
          <p>GIỮ GÌN LỊCH SỬ<br />KIẾN TẠO TƯƠNG LAI</p>
        </div>
        <nav>
          {desktopNav.map(({ label, icon: Icon }) => (
            <button
              className={currentPage === label ? 'active' : ''}
              key={label}
              onClick={() => onNavigate(label)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-landscape" />
        <div className="sidebar-footer">ATK ĐỊNH HÓA<br />ỨNG DỤNG IOT CHO<br />VÙNG ĐƯỢC NGÀY MAI</div>
      </aside>
      <main className="desktop-main">
        <header className="desktop-header">
          <div className="heading">
            <h1>TRUNG TÂM ĐIỀU KHIỂN CHIẾU SÁNG</h1>
            <p>ATK ĐỊNH HÓA <span>•</span> THÁI NGUYÊN</p>
          </div>
          <div className="date-weather">
            <div>
              <span>{capitalizedDate}</span>
              <strong>{timeStr}</strong>
            </div>
            <CloudSun />
            <div>
              <span>26°C</span>
              <small>Trời ít mây</small>
            </div>
          </div>
          <button
            type="button"
            className="admin"
            onClick={() => onNavigate('Kết nối IP thiết bị')}
            title="Đổi IP hoặc tự động dò tìm IP ESP8266 & ESP32"
            style={{
              marginRight: '6px',
              background: state.connected ? 'rgba(58, 125, 68, 0.22)' : 'rgba(214, 48, 49, 0.22)',
              border: `1px solid ${state.connected ? '#64b75e' : '#e57373'}`,
            }}
          >
            <Wifi color={state.connected ? '#64b75e' : '#e57373'} size={16} />
            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {state.deviceConfig?.url?.replace(/^https?:\/\//, '') || 'Chưa nối IP'}
              <small style={{ color: state.connected ? '#8aca78' : '#ff9999', fontWeight: 600 }}>
                {state.connected ? '● ESP8266 Online' : '○ Đổi / Quét IP'}
              </small>
            </span>
          </button>
          <button
            type="button"
            className="admin"
            onClick={() => onNavigate('Âm nhạc lịch sử')}
            title="Mở Trình phát Âm nhạc Lịch sử Dân tộc"
            style={{ marginRight: '4px', background: isPlaying ? '#3b1613' : undefined, border: isPlaying ? '1px solid #ecd18a' : undefined }}
          >
            <Music color={isPlaying ? '#64b75e' : '#ecd18a'} />
            <span style={{ maxWidth: '105px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isPlaying ? currentSong.title : 'Nhạc Lịch Sử'}
              <small style={{ color: isPlaying ? '#8aca78' : '#a08870' }}>{isPlaying ? 'Đang phát' : 'Hào khí ATK'}</small>
            </span>
          </button>
          <button className="admin" onClick={() => onNavigate('Phân quyền')} title="Quản lý tài khoản & phân quyền">
            <UserRound />
            <span>{user?.fullName || state.displayName}<small>{roleText}</small></span>
            <ChevronDown />
          </button>
        </header>
        <div className="dashboard-content">
          <StatCards state={state} />
          <div className="middle-grid">
            <HeritageMap state={state} />
            <QuickControl state={state} />
          </div>
          <div className="bottom-grid">
            <EnergyChart state={state} />
            <AlertList state={state} onViewAll={() => onNavigate('Cảnh báo')} />
          </div>
        </div>
      </main>
    </div>
  );
}
