import React, { useState } from 'react';
import {
  Palette,
  Sun,
  Mic,
  Zap,
  Sliders,
  Clock,
  Sparkles,
  Wifi,
  Power,
  RotateCcw,
  Check,
  ChevronRight,
  Info,
  Layers,
  Flame,
  Waves,
  Eye,
  Radio,
} from 'lucide-react';
import type { RgbLedHook } from '../hooks/useRgbLed';
import { RGB_EFFECTS, SMART_MODES } from '../services/esp32Rgb.service';
import type { RgbMode } from '../services/esp32Rgb.service';

const QUICK_COLORS = [
  { name: 'Đỏ Cờ', r: 255, g: 0, b: 0, hex: '#ff0000' },
  { name: 'Vàng Kim', r: 255, g: 200, b: 0, hex: '#ffc800' },
  { name: 'Cam Hoàng Hôn', r: 255, g: 90, b: 0, hex: '#ff5a00' },
  { name: 'Hổ Phách ATK', r: 255, g: 130, b: 10, hex: '#ff820a' },
  { name: 'Xanh Lá Rừng', r: 0, g: 220, b: 30, hex: '#00dc1e' },
  { name: 'Xanh Ngọc Lục', r: 0, g: 230, b: 160, hex: '#00e6a0' },
  { name: 'Xanh Lam', r: 0, g: 120, b: 255, hex: '#0078ff' },
  { name: 'Xanh Biển Sâu', r: 10, g: 40, b: 220, hex: '#0a28dc' },
  { name: 'Tím Hoa Sen', r: 170, g: 0, b: 255, hex: '#aa00ff' },
  { name: 'Hồng Sen', r: 255, g: 20, b: 140, hex: '#ff148c' },
  { name: 'Trắng Ấm 3000K', r: 255, g: 220, b: 160, hex: '#ffdca0' },
  { name: 'Trắng Tinh 6500K', r: 255, g: 255, b: 255, hex: '#ffffff' },
];

export function RgbLedControl({ rgb }: { rgb: RgbLedHook }) {
  const { rgbState, connected, url, updateUrl, setMode, setColor, setBrightness, setSpeed, setNumLeds, invertSensor, setTimer } = rgb;
  const [showConfig, setShowConfig] = useState(false);
  const [customIp, setCustomIp] = useState(url);
  const [customColor, setCustomColor] = useState('#ff820a');

  const currentMode = rgbState?.mode || 'rainbow';
  const currentBri = rgbState?.bri ?? 180;
  const currentSpeed = rgbState?.speed ?? 3;
  const currentLeds = rgbState?.numLeds ?? 120;
  const isDark = rgbState?.isDark ?? false;
  const soundDetected = rgbState?.soundDetected ?? false;
  const isLightActLow = rgbState?.lightActLow ?? true;
  const isSoundActLow = rgbState?.soundActLow ?? true;

  const handleColorPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setCustomColor(hex);
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    setColor(r, g, b);
  };

  const currentRgbString = `rgb(${rgbState?.r ?? 255}, ${rgbState?.g ?? 130}, ${rgbState?.b ?? 10})`;

  return (
    <div className="rgb-led-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── CARD HEADER TRẠM 2 ──────────────────────────────────────────────── */}
      <div
        className="panel"
        style={{
          background: 'linear-gradient(135deg, #2a110f 0%, #170908 100%)',
          border: '1px solid #734c2d',
          borderRadius: '8px',
          padding: '16px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '18px' }}>🎨</span>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#f3dd9b', letterSpacing: '0.5px' }}>
                TRẠM 2: LED NGHỆ THUẬT RGB & ĐA CẢM BIẾN (ESP32)
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: '#c9b09a' }}>
              Chân DIN: <strong>GPIO 4</strong> · WS2812B {currentLeds} bóng · Quang trở LM393: <strong>GPIO 18</strong> · Mic âm thanh: <strong>GPIO 19</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 600,
                background: connected ? 'rgba(40, 167, 69, 0.2)' : 'rgba(255, 193, 7, 0.15)',
                color: connected ? '#6cd47e' : '#ffd358',
                border: `1px solid ${connected ? '#3a7d44' : '#997318'}`,
              }}
            >
              <Wifi size={12} />
              {connected ? 'ESP32 Trực tuyến' : 'Chờ ESP32 (Mô phỏng)'}
            </span>
            <button
              onClick={() => setShowConfig(!showConfig)}
              style={{
                padding: '4px 8px',
                background: '#3e1614',
                border: '1px solid #6c3f30',
                borderRadius: '4px',
                color: '#ebd49d',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              {showConfig ? 'Đóng cấu hình' : 'IP: ' + url.replace('http://', '')}
            </button>
          </div>
        </div>

        {/* IP Config Dropdown */}
        {showConfig && (
          <div
            style={{
              marginTop: '12px',
              padding: '10px',
              background: '#1d0c0b',
              border: '1px dashed #734c2d',
              borderRadius: '6px',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '11px', color: '#c9b09a' }}>Địa chỉ ESP32:</span>
            <input
              type="text"
              value={customIp}
              onChange={(e) => setCustomIp(e.target.value)}
              placeholder="http://den-rgb.local hoặc http://192.168.137.98"
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '6px 10px',
                background: '#2b1210',
                border: '1px solid #734c2d',
                borderRadius: '4px',
                color: '#f3dd9b',
                fontSize: '12px',
              }}
            />
            <button
              onClick={() => updateUrl(customIp)}
              style={{
                padding: '6px 12px',
                background: '#631d1a',
                border: '1px solid #a87948',
                borderRadius: '4px',
                color: '#f9e7b9',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Lưu & Kết nối
            </button>
            <button
              onClick={() => {
                setCustomIp('http://192.168.4.1');
                updateUrl('http://192.168.4.1');
              }}
              style={{
                padding: '6px 8px',
                background: '#230e0d',
                border: '1px solid #4d2b24',
                borderRadius: '4px',
                color: '#bba795',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              Dự phòng (192.168.4.1)
            </button>
          </div>
        )}

        {/* ── MÔ PHỎNG DẢI SÁNG WS2812B THỜI GIAN THỰC ───────────────────────── */}
        <div style={{ marginTop: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#c9b09a', marginBottom: '6px' }}>
            <span>Mô phỏng dải LED WS2812B ({currentLeds} bóng)</span>
            <span style={{ color: '#ffd56b', fontWeight: 600 }}>
              Hiệu ứng: {currentMode.toUpperCase()} · Độ sáng {Math.round((currentBri / 255) * 100)}%
            </span>
          </div>

          <div
            style={{
              height: '18px',
              borderRadius: '9px',
              overflow: 'hidden',
              background: '#0d0505',
              border: '1px solid #5a3825',
              boxShadow: currentMode === 'off' ? 'none' : `0 0 16px ${currentMode === 'solid' ? currentRgbString : 'rgba(255, 140, 0, 0.4)'}`,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {currentMode === 'off' ? (
              <div style={{ width: '100%', height: '100%', background: '#1a0c0b', opacity: 0.5 }} />
            ) : currentMode === 'solid' ? (
              <div style={{ width: '100%', height: '100%', background: currentRgbString }} />
            ) : currentMode === 'rainbow' ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)',
                  backgroundSize: '200% 100%',
                  animation: 'rgbRainbowAnim 3s linear infinite',
                }}
              />
            ) : currentMode === 'fire' ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #ff1a00, #ff8400, #ffea00, #ff5100)',
                  opacity: 0.9,
                }}
              />
            ) : currentMode === 'ocean' ? (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #0033aa, #0099ff, #00eeff, #0044cc)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 50%, #f77062 100%)',
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── THẺ 2 CẢM BIẾN LM393: QUANG TRỞ + MICROPHONE ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        {/* Cảm biến Ánh Sáng */}
        <div
          className="panel"
          style={{
            background: '#230e0d',
            border: `1px solid ${isDark ? '#e09838' : '#593a24'}`,
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: isDark ? 'rgba(230, 138, 30, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDark ? '#f9ab40' : '#c9b09a',
              }}
            >
              <Sun size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#bba795' }}>Quang Trở LM393 (GPIO 18)</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: isDark ? '#ffd56b' : '#c7b4a2' }}>
                {isDark ? 'Trời Tối (Đã kích hoạt)' : 'Đủ Sáng (Ban ngày)'}
              </div>
            </div>
          </div>
          <button
            onClick={() => invertSensor('light')}
            title="Đảo logic kích hoạt cảm biến quang"
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              background: '#331513',
              border: '1px solid #6b402e',
              borderRadius: '4px',
              color: '#d6beab',
              cursor: 'pointer',
            }}
          >
            Đảo: {isLightActLow ? 'LOW' : 'HIGH'}
          </button>
        </div>

        {/* Cảm biến Âm Thanh */}
        <div
          className="panel"
          style={{
            background: '#230e0d',
            border: `1px solid ${soundDetected ? '#00e676' : '#593a24'}`,
            borderRadius: '8px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: soundDetected ? 'rgba(0, 230, 118, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: soundDetected ? '#00e676' : '#c9b09a',
                boxShadow: soundDetected ? '0 0 12px rgba(0, 230, 118, 0.6)' : 'none',
              }}
            >
              <Mic size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#bba795' }}>Microphone LM393 (GPIO 19)</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: soundDetected ? '#00e676' : '#c7b4a2' }}>
                {soundDetected ? 'Phát hiện âm thanh!' : 'Yên tĩnh'}
              </div>
            </div>
          </div>
          <button
            onClick={() => invertSensor('sound')}
            title="Đảo logic kích hoạt cảm biến âm thanh"
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              background: '#331513',
              border: '1px solid #6b402e',
              borderRadius: '4px',
              color: '#d6beab',
              cursor: 'pointer',
            }}
          >
            Đảo: {isSoundActLow ? 'LOW' : 'HIGH'}
          </button>
        </div>
      </div>

      {/* ── 4 CHẾ ĐỘ THÔNG MINH ─────────────────────────────────────────────── */}
      <div className="panel" style={{ background: '#250f0e', border: '1px solid #5d3623', borderRadius: '8px', padding: '14px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#f3dd9b', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={14} /> CHẾ ĐỘ CẢM BIẾN THÔNG MINH
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
          {SMART_MODES.map((m) => {
            const isActive = currentMode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '4px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${isActive ? '#f3dd9b' : '#573322'}`,
                  background: isActive ? 'linear-gradient(135deg, #6c1f1c 0%, #3d1210 100%)' : '#1e0c0b',
                  color: isActive ? '#fff1cc' : '#cbb4a1',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '15px' }}>{m.icon}</span>
                  <strong style={{ fontSize: '12px', flex: 1, marginLeft: '4px' }}>{m.name}</strong>
                  {isActive && <Check size={14} color="#f3dd9b" />}
                </div>
                <span style={{ fontSize: '10px', opacity: 0.8, lineHeight: 1.3 }}>{m.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 12 HIỆU ỨNG ÁNH SÁNG NGHỆ THUẬT WS2812B ─────────────────────────── */}
      <div className="panel" style={{ background: '#250f0e', border: '1px solid #5d3623', borderRadius: '8px', padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <h4 style={{ margin: 0, fontSize: '13px', color: '#f3dd9b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} /> 12 HIỆU ỨNG MÀU SẮC NGHỆ THUẬT
          </h4>
          <span style={{ fontSize: '11px', color: '#bba795' }}>Chọn 1 hiệu ứng để kích hoạt</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
          {RGB_EFFECTS.map((eff) => {
            const isActive = currentMode === eff.id;
            return (
              <button
                key={eff.id}
                onClick={() => setMode(eff.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 10px',
                  borderRadius: '6px',
                  border: `1px solid ${isActive ? '#f3dd9b' : '#573322'}`,
                  background: isActive ? 'linear-gradient(135deg, #741d1a 0%, #3e120f 100%)' : '#1e0c0b',
                  color: isActive ? '#fff1cc' : '#cbb4a1',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '16px' }}>{eff.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {eff.name}
                  </div>
                  <div style={{ fontSize: '9px', opacity: 0.7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {eff.desc}
                  </div>
                </div>
                {isActive && <Check size={12} color="#f3dd9b" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── BẢNG CHỌN MÀU TĨNH RGB PALETTE ───────────────────────────────────── */}
      <div className="panel" style={{ background: '#250f0e', border: '1px solid #5d3623', borderRadius: '8px', padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '13px', color: '#f3dd9b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Palette size={14} /> MÀU TĨNH TÙY CHỌN (PALETTE)
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#bba795' }}>Tùy chọn:</span>
            <input
              type="color"
              value={customColor}
              onChange={handleColorPick}
              style={{
                width: '28px',
                height: '24px',
                padding: '0',
                border: '1px solid #734c2d',
                borderRadius: '4px',
                cursor: 'pointer',
                background: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '6px' }}>
          {QUICK_COLORS.map((c) => {
            const isMatch = currentMode === 'solid' && rgbState?.r === c.r && rgbState?.g === c.g && rgbState?.b === c.b;
            return (
              <button
                key={c.name}
                onClick={() => setColor(c.r, c.g, c.b)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  background: '#1d0c0b',
                  border: `1px solid ${isMatch ? '#f3dd9b' : '#573322'}`,
                  borderRadius: '4px',
                  color: isMatch ? '#fff1cc' : '#cbb4a1',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: c.hex,
                    border: '1px solid #734c2d',
                    flexShrink: 0,
                  }}
                />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ĐIỀU CHỈNH ĐỘ SÁNG, TỐC ĐỘ, SỐ BÓNG & HẸN GIỜ ────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        {/* Độ sáng */}
        <div className="panel" style={{ background: '#230e0d', border: '1px solid #593a24', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
            <span style={{ color: '#cbb4a1', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sun size={14} /> Độ sáng dải LED
            </span>
            <strong style={{ color: '#ffd56b' }}>{Math.round((currentBri / 255) * 100)}% ({currentBri}/255)</strong>
          </div>
          <input
            type="range"
            min="5"
            max="255"
            value={currentBri}
            onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
            style={{ width: '100%', accentColor: '#ffd56b' }}
          />
        </div>

        {/* Tốc độ */}
        <div className="panel" style={{ background: '#230e0d', border: '1px solid #593a24', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
            <span style={{ color: '#cbb4a1', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sliders size={14} /> Tốc độ hiệu ứng
            </span>
            <strong style={{ color: '#ffd56b' }}>Mức {currentSpeed} / 5</strong>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={currentSpeed}
            onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
            style={{ width: '100%', accentColor: '#ff8400' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#9d8777', marginTop: '4px' }}>
            <span>Rất chậm</span>
            <span>Vừa</span>
            <span>Cực nhanh</span>
          </div>
        </div>

        {/* Số bóng LED */}
        <div className="panel" style={{ background: '#230e0d', border: '1px solid #593a24', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
            <span style={{ color: '#cbb4a1', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Layers size={14} /> Số bóng LED WS2812B
            </span>
            <strong style={{ color: '#ffd56b' }}>{currentLeds} bóng</strong>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[60, 120, 180, 300, 600].map((num) => (
              <button
                key={num}
                onClick={() => setNumLeds(num)}
                style={{
                  flex: 1,
                  padding: '5px 2px',
                  background: currentLeds === num ? '#631d1a' : '#1b0b0a',
                  border: `1px solid ${currentLeds === num ? '#f3dd9b' : '#573322'}`,
                  borderRadius: '4px',
                  color: currentLeds === num ? '#fff1cc' : '#cbb4a1',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Hẹn giờ tắt */}
        <div className="panel" style={{ background: '#230e0d', border: '1px solid #593a24', borderRadius: '8px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
            <span style={{ color: '#cbb4a1', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={14} /> Hẹn giờ tắt (Sleep Timer)
            </span>
            <strong style={{ color: '#ffd56b' }}>
              {rgbState?.countdown && rgbState.countdown > 0 ? `${Math.ceil(rgbState.countdown / 60)} phút` : 'Tắt'}
            </strong>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[15, 30, 60, 120].map((min) => (
              <button
                key={min}
                onClick={() => setTimer(min)}
                style={{
                  flex: 1,
                  padding: '5px 2px',
                  background: '#1b0b0a',
                  border: '1px solid #573322',
                  borderRadius: '4px',
                  color: '#cbb4a1',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {min}p
              </button>
            ))}
            <button
              onClick={() => setTimer(0)}
              style={{
                flex: 1,
                padding: '5px 2px',
                background: '#331210',
                border: '1px solid #6b3528',
                borderRadius: '4px',
                color: '#e2887c',
                fontSize: '10px',
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
