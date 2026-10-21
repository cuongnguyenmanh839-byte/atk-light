import React, { useEffect, useState } from 'react';
import {
  House, MapPin, Sun, Palette, Wifi, Settings, Zap, Music, Bell,
  CircleCheck, AlertTriangle, ShieldCheck, ChevronRight, Play, Pause,
  Sliders, Calendar, BarChart3, Radio, Sparkles, User, RefreshCw
} from 'lucide-react';
import type { Lighting } from '../hooks/useLighting';
import type { RgbLedHook } from '../hooks/useRgbLed';
import { PowerControl, BrightnessSlider } from '../components/Controls';
import { LightSensorControl } from '../components/LightSensorControl';
import { AreaCard } from '../components/AreaCard';
import { HeritageMap } from '../components/HeritageMap';
import { EnergyChart, AlertList } from '../components/Summary';
import { RgbLedControl } from '../components/RgbLedControl';
import { DeviceSettings } from '../components/DeviceSettings';
import { HistoricalMusicPlayer } from '../components/HistoricalMusicPlayer';
import { useHistoricalMusic } from '../contexts/MusicContext';
import { useAuth } from '../contexts/AuthContext';

export function Mobile({
  state,
  rgb,
  onNavigate,
  currentPage = 'Tổng quan',
}: {
  state: Lighting;
  rgb?: RgbLedHook;
  onNavigate: (page: string) => void;
  currentPage?: string;
}) {
  const { isPlaying, togglePlay, currentSong, nextSong } = useHistoricalMusic();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'areas' | 'rgb' | 'stats' | 'more'>('home');
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const update = () => {
      setTimeStr(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Đồng bộ tab khi currentPage thay đổi từ ngoài
  useEffect(() => {
    if (currentPage === 'Khu vực') setActiveTab('areas');
    else if (currentPage === 'LED RGB (ESP32)') setActiveTab('rgb');
    else if (currentPage === 'Giám sát năng lượng' || currentPage === 'Báo cáo') setActiveTab('stats');
    else if (currentPage === 'Cài đặt' || currentPage === 'Kết nối IP thiết bị') setActiveTab('more');
    else if (currentPage === 'Tổng quan') setActiveTab('home');
  }, [currentPage]);

  return (
    <div className="mobile-modern-app">
      {/* ── HEADER HIỆN ĐẠI ──────────────────────────────────────────────── */}
      <header className="m-header">
        <div className="m-header-brand">
          <h1 className="m-header-title">ATK ĐỊNH HÓA</h1>
          <span className="m-header-sub">HỆ THỐNG CHIẾU SÁNG THÔNG MINH</span>
        </div>

        <div className="m-header-actions">
          {/* Nút Nhạc Lịch Sử */}
          <button
            type="button"
            className={`m-icon-btn ${isPlaying ? 'active' : ''}`}
            onClick={() => onNavigate('Âm nhạc lịch sử')}
            title="Âm nhạc Lịch sử Dân tộc"
          >
            <Music size={18} />
          </button>

          {/* Nút Cảnh Báo */}
          <button
            type="button"
            className="m-icon-btn"
            onClick={() => onNavigate('Cảnh báo')}
            title="Xem Cảnh báo"
          >
            <Bell size={18} />
            {state.alerts.length > 0 && <span className="m-badge-dot" />}
          </button>

          {/* Nút Kết nối IP Thiết Bị */}
          <button
            type="button"
            className="m-icon-btn"
            style={{ color: state.connected ? '#64b75e' : '#e57373' }}
            onClick={() => onNavigate('Kết nối IP thiết bị')}
            title="Cấu hình & Tự động quét IP ESP"
          >
            <Wifi size={18} />
          </button>
        </div>
      </header>

      {/* ── THANH TRẠNG THÁI IP NHANH ────────────────────────────────────── */}
      <div className="m-ip-strip" onClick={() => onNavigate('Kết nối IP thiết bị')}>
        <div className="m-ip-info">
          <div
            className="m-ip-dot"
            style={{
              backgroundColor: state.connected ? '#4caf50' : '#f44336',
              color: state.connected ? '#4caf50' : '#f44336',
            }}
          />
          <div className="m-ip-text">
            <strong>
              {state.connected
                ? `ESP8266: ${state.deviceConfig?.url?.replace(/^https?:\/\//, '') || 'Online'}`
                : 'Mất kết nối ESP8266'}
            </strong>
            <span>
              {state.connected
                ? `RGB ESP32: ${rgb?.connected ? 'Online' : 'Sẵn sàng'} · ${timeStr}`
                : 'Chạm để quét hoặc nhập IP mới'}
            </span>
          </div>
        </div>
        <div className="m-ip-action">
          <span>Đổi IP</span>
          <ChevronRight size={14} />
        </div>
      </div>

      {/* ── NỘI DUNG THEO TỪNG TAB ───────────────────────────────────────── */}

      {/* ── TAB 1: TRANG CHỦ (TỔNG QUAN) ──────────────────────────────────── */}
      {activeTab === 'home' && (
        <main style={{ paddingBottom: '20px' }}>
          {/* Nút Nguồn Tổng Hệ Thống */}
          <div className="m-power-hero">
            <button
              type="button"
              className={`m-power-ring ${state.on ? 'on' : ''}`}
              onClick={state.toggleSystem}
              disabled={state.busy}
              aria-label="Công tắc tổng"
            >
              <Zap size={44} />
            </button>
            <div className="m-power-label">
              {state.on ? 'HỆ THỐNG ĐANG BẬT' : 'HỆ THỐNG ĐANG TẮT'}
            </div>
            <div className="m-power-hint">
              {state.on
                ? `${state.lit} / ${state.totalLights} bóng đang sáng · Chạm để tắt toàn bộ`
                : 'Chạm để bật toàn bộ đèn 4 khu di tích'}
            </div>
          </div>

          {/* Hàng Thống kê 3 chỉ số */}
          <div className="m-stats-row">
            <div className="m-stat-box">
              <div className="m-stat-val">{state.lit} / {state.totalLights}</div>
              <div className="m-stat-lbl">Đèn đang sáng</div>
            </div>
            <div className="m-stat-box">
              <div className="m-stat-val">{state.energyKwh ?? 86.4}</div>
              <div className="m-stat-lbl">Điện năng (kWh)</div>
            </div>
            <div className="m-stat-box">
              <div className="m-stat-val" style={{ color: state.connected ? '#81c784' : '#e57373' }}>
                {state.connected ? 'Ổn định' : 'Mất kết nối'}
              </div>
              <div className="m-stat-lbl">Hệ thống</div>
            </div>
          </div>

          {/* 4 Khu Di Tích - Relay Điều Khiển Trực Tiếp */}
          <section className="m-section">
            <div className="m-section-header">
              <h2 className="m-section-title">
                <Zap size={16} color="#ecd18a" />
                4 KHU DI TÍCH (RELAY ESP8266)
              </h2>
              <button
                type="button"
                className="m-section-more"
                onClick={() => onNavigate('Khu vực')}
              >
                Chi tiết ›
              </button>
            </div>

            <div className="m-relay-grid">
              {state.areas.map((area) => (
                <div
                  key={area.id}
                  className={`m-relay-card ${area.on ? 'on' : ''}`}
                  onClick={() => state.toggleArea(area.id)}
                >
                  <div className="m-relay-card-top">
                    <div className="m-relay-icon">
                      <Zap size={18} />
                    </div>
                    <span className="m-relay-badge">
                      {area.on ? 'BẬT' : 'TẮT'}
                    </span>
                  </div>
                  <div>
                    <div className="m-relay-name">{area.name}</div>
                    <div className="m-relay-lamps">
                      {area.on ? `${area.lit} bóng đang sáng` : `${area.lamps} bóng sẵn sàng`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Cảm Biến Ánh Sáng Tự Động (LDR A0) */}
          <div style={{ margin: '0 16px 14px' }}>
            <LightSensorControl state={state} />
          </div>

          {/* Điều Chỉnh Độ Sáng & Nhiệt Độ Màu */}
          <div className="m-card-panel">
            <BrightnessSlider state={state} />
          </div>

          {/* Chế Độ Chiếu Sáng Nhanh (Tham quan, Lễ hội, An ninh, Tiết kiệm) */}
          <div className="m-card-panel">
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f3dd9b', marginBottom: '10px' }}>
              CHẾ ĐỘ CHIẾU SÁNG ĐẶC BIỆT
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { id: 0, label: 'Tham quan', desc: '100% sáng · Ấm áp' },
                { id: 1, label: 'Lễ tưởng niệm', desc: 'Sắc vàng trang trọng' },
                { id: 2, label: 'An ninh đêm', desc: '50% sáng · Cảm biến' },
                { id: 3, label: 'Tiết kiệm điện', desc: 'Chỉ bật luân phiên' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => state.chooseMode(m.id)}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    background: state.mode === m.id ? 'linear-gradient(135deg, #b58b42 0%, #755020 100%)' : '#220b0a',
                    border: `1px solid ${state.mode === m.id ? '#ffe082' : '#573322'}`,
                    color: state.mode === m.id ? '#fff' : '#edd7b7',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700 }}>{m.label}</div>
                  <div style={{ fontSize: '10px', color: state.mode === m.id ? '#fff8e1' : '#a8907e', marginTop: '2px' }}>
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Bản Đồ Tương Tác Thu Nhỏ */}
          <section className="m-section">
            <div className="m-section-header">
              <h2 className="m-section-title">
                <MapPin size={16} color="#ecd18a" />
                BẢN ĐỒ DI TÍCH LỊCH SỬ ATK
              </h2>
            </div>
            <div style={{ height: '220px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #734c2d' }}>
              <HeritageMap state={state} />
            </div>
          </section>

          {/* Mini Player Âm Nhạc Dân Tộc */}
          <div
            className="m-card-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #321110 0%, #1a0808 100%)',
              border: '1px solid #997042',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: isPlaying ? '#2e7d32' : '#4a1b18',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Music size={18} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f3dd9b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentSong?.title || 'Âm nhạc ATK Định Hóa'}
                </div>
                <div style={{ fontSize: '10px', color: '#bfa895' }}>
                  {isPlaying ? 'Đang phát hào khí lịch sử' : 'Tạm dừng'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="gold-button"
                style={{ padding: '6px 12px', fontSize: '11px' }}
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button
                type="button"
                style={{ padding: '6px 10px', background: '#351613', border: '1px solid #734c2d', borderRadius: '4px', color: '#ecd18a' }}
                onClick={nextSong}
              >
                Bài tiếp
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ── TAB 2: KHU VỰC (RELAY CHI TIẾT) ──────────────────────────────── */}
      {activeTab === 'areas' && (
        <main className="m-section" style={{ paddingBottom: '20px' }}>
          <div className="m-section-header">
            <h2 className="m-section-title">
              <MapPin size={16} color="#ecd18a" />
              QUẢN LÝ 4 KHU CHIẾU SÁNG
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {state.areas.map((a) => (
              <div
                key={a.id}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  background: a.on ? 'linear-gradient(135deg, #254d2a 0%, #152b18 100%)' : '#230e0d',
                  border: `1px solid ${a.on ? '#81c784' : '#6b3e2d'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{a.name}</div>
                  <div style={{ fontSize: '11px', color: a.on ? '#c8e6c9' : '#bdaaa0', marginTop: '3px' }}>
                    {a.on ? `Đang bật ${a.lit}/${a.lamps} đèn` : `Đang tắt · ${a.lamps} bóng`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => state.toggleArea(a.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '12px',
                    background: a.on ? '#388e3c' : '#4a1715',
                    border: `1px solid ${a.on ? '#a5d6a7' : '#8d3b37'}`,
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  {a.on ? 'TẮT' : 'BẬT'}
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ── TAB 3: LED NGHỆ THUẬT RGB (ESP32) ─────────────────────────────── */}
      {activeTab === 'rgb' && rgb && (
        <main className="m-section" style={{ paddingBottom: '20px' }}>
          <RgbLedControl rgb={rgb} />
        </main>
      )}

      {/* ── TAB 4: GIÁM SÁT & BÁO CÁO ────────────────────────────────────── */}
      {activeTab === 'stats' && (
        <main className="m-section" style={{ paddingBottom: '20px' }}>
          <div className="m-card-panel" style={{ margin: '0 0 14px 0' }}>
            <h3 style={{ fontSize: '13px', color: '#f3dd9b', marginTop: 0 }}>BIỂU ĐỒ TIÊU THỤ NĂNG LƯỢNG</h3>
            <EnergyChart state={state} />
          </div>

          <div className="m-card-panel" style={{ margin: '0' }}>
            <h3 style={{ fontSize: '13px', color: '#f3dd9b', marginTop: 0 }}>DANH SÁCH CẢNH BÁO HỆ THỐNG</h3>
            <AlertList state={state} all />
          </div>
        </main>
      )}

      {/* ── TAB 5: CÀI ĐẶT & KẾT NỐI IP ──────────────────────────────────── */}
      {activeTab === 'more' && (
        <main className="m-section" style={{ paddingBottom: '20px' }}>
          <DeviceSettings state={state} rgb={rgb} />
        </main>
      )}

      {/* ── THANH ĐIỀU HƯỚNG DƯỚI ĐÁY (5 TABS CHUYÊN NGHIỆP) ──────────────── */}
      <nav className="m-nav-bar">
        <button
          type="button"
          className={`m-nav-item ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <House />
          <span>Tổng quan</span>
        </button>

        <button
          type="button"
          className={`m-nav-item ${activeTab === 'areas' ? 'active' : ''}`}
          onClick={() => setActiveTab('areas')}
        >
          <MapPin />
          <span>Khu vực</span>
        </button>

        <button
          type="button"
          className={`m-nav-item ${activeTab === 'rgb' ? 'active' : ''}`}
          onClick={() => setActiveTab('rgb')}
        >
          <Palette />
          <span>LED RGB</span>
        </button>

        <button
          type="button"
          className={`m-nav-item ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <BarChart3 />
          <span>Giám sát</span>
        </button>

        <button
          type="button"
          className={`m-nav-item ${activeTab === 'more' ? 'active' : ''}`}
          onClick={() => setActiveTab('more')}
        >
          <Settings />
          <span>Kết nối IP</span>
        </button>
      </nav>
    </div>
  );
}
