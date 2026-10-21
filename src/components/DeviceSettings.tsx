import React, { useState } from 'react';
import { Wifi, Search, CheckCircle2, AlertTriangle, RefreshCw, Server, Cpu, ExternalLink, Zap, Radio, Globe, Shield } from 'lucide-react';
import type { Lighting } from '../hooks/useLighting';
import type { RgbLedHook } from '../hooks/useRgbLed';
import { systemService } from '../services/system.service';

const SUBNET_PRESETS = [
  { label: 'Hotspot Máy tính (192.168.137.x)', subnet: '192.168.137', sampleIp: 'http://192.168.137.195' },
  { label: 'Hotspot Android (192.168.43.x)', subnet: '192.168.43', sampleIp: 'http://192.168.43.100' },
  { label: 'Hotspot iPhone (172.20.10.x)', subnet: '172.20.10', sampleIp: 'http://172.20.10.2' },
  { label: 'WiFi Nhà / Cơ quan (192.168.1.x)', subnet: '192.168.1', sampleIp: 'http://192.168.1.50' },
  { label: 'WiFi Router TP-Link (192.168.0.x)', subnet: '192.168.0', sampleIp: 'http://192.168.0.100' },
];

export function DeviceSettings({ state, rgb }: { state: Lighting; rgb?: RgbLedHook }) {
  // Trạm 1: ESP8266
  const [esp8266Url, setEsp8266Url] = useState(state.deviceConfig?.url || 'http://192.168.137.195');
  const [esp8266Token, setEsp8266Token] = useState(state.deviceConfig?.token || 'atk2026');
  const [selectedSubnet8266, setSelectedSubnet8266] = useState('192.168.137');
  const [scanning8266, setScanning8266] = useState(false);
  const [scanStatus8266, setScanStatus8266] = useState('');

  // Trạm 2: ESP32 RGB
  const [esp32Url, setEsp32Url] = useState(rgb?.url || 'http://192.168.137.130');
  const [selectedSubnet32, setSelectedSubnet32] = useState('192.168.137');
  const [scanning32, setScanning32] = useState(false);
  const [scanStatus32, setScanStatus32] = useState('');

  // ── XỬ LÝ KẾT NỐI ESP8266 ──────────────────────────────────────────────────
  const handleConnectEsp8266 = async (targetUrl: string = esp8266Url) => {
    let cleanUrl = targetUrl.trim().replace(/\/+$/, '');
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `http://${cleanUrl}`;
    }
    setEsp8266Url(cleanUrl);
    setScanStatus8266('Đang kiểm tra kết nối tới ' + cleanUrl + '...');

    try {
      await state.connectDevice({ url: cleanUrl, token: esp8266Token.trim() });
      // Đồng bộ sang backend để API NestJS cũng chuyển sang IP này
      try {
        await systemService.setEsp32Config(cleanUrl, esp8266Token.trim());
      } catch {
        // Backend update optional nếu chưa đăng nhập
      }
      setScanStatus8266(`✅ Đã kết nối thành công với ESP8266 tại ${cleanUrl}`);
    } catch (e: any) {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      const httpsNote = isHttps
        ? ' (Lưu ý: Bạn đang mở web HTTPS, Chrome chặn kết nối IP nội bộ. Vui lòng bấm biểu tượng 🔒 trên thanh địa chỉ -> Cho phép "Nội dung không an toàn" -> F5)'
        : '';
      setScanStatus8266(`❌ Không thể kết nối tới ${cleanUrl}: ${e.message || 'Thiết bị không phản hồi'}${httpsNote}`);
    }
  };

  // ── TỰ ĐỘNG DÒ TÌM IP ESP8266 ─────────────────────────────────────────────
  const handleAutoScanEsp8266 = async () => {
    setScanning8266(true);
    setScanStatus8266(`Đang quét dải IP ${selectedSubnet8266}.x và tên miền mDNS...`);

    const candidates: string[] = [
      'http://atk-light.local',
      esp8266Url,
      `http://${selectedSubnet8266}.195`,
      `http://${selectedSubnet8266}.93`,
      `http://${selectedSubnet8266}.97`,
      `http://${selectedSubnet8266}.100`,
      'http://192.168.137.195',
      'http://192.168.137.93',
      'http://192.168.4.1',
    ];

    // Dải IP phổ biến của DHCP hotspot và router
    for (let i = 180; i <= 215; i++) {
      const u = `http://${selectedSubnet8266}.${i}`;
      if (!candidates.includes(u)) candidates.push(u);
    }
    for (let i = 120; i <= 150; i++) {
      const u = `http://${selectedSubnet8266}.${i}`;
      if (!candidates.includes(u)) candidates.push(u);
    }
    for (let i = 85; i <= 115; i++) {
      const u = `http://${selectedSubnet8266}.${i}`;
      if (!candidates.includes(u)) candidates.push(u);
    }
    for (let i = 2; i <= 30; i++) {
      const u = `http://${selectedSubnet8266}.${i}`;
      if (!candidates.includes(u)) candidates.push(u);
    }

    let found = false;
    const BATCH_SIZE = 8;
    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      const batch = candidates.slice(i, i + BATCH_SIZE);
      const progress = Math.round((i / candidates.length) * 100);
      setScanStatus8266(`Đang quét IP: ${batch[0]} ... (${progress}%)`);

      const promises = batch.map(async (testUrl) => {
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 950);
          const res = await fetch(`${testUrl}/api/state?token=${esp8266Token.trim()}`, {
            signal: ctrl.signal,
            mode: 'cors',
          });
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            if (data.apiVersion === 1 && Array.isArray(data.areas)) {
              return testUrl;
            }
          }
        } catch {}

        // Kiểm tra phương án 2: /api/relay
        try {
          const ctrl2 = new AbortController();
          const timer2 = setTimeout(() => ctrl2.abort(), 950);
          const res2 = await fetch(`${testUrl}/api/relay`, {
            signal: ctrl2.signal,
            mode: 'cors',
          });
          clearTimeout(timer2);
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2.relays || data2.success !== undefined) {
              return testUrl;
            }
          }
        } catch {}

        return null;
      });

      const results = await Promise.all(promises);
      const matched = results.find((r) => r !== null);
      if (matched) {
        found = true;
        setEsp8266Url(matched);
        setScanStatus8266(`🎉 Đã tìm thấy ESP8266 tại: ${matched}! Đang kết nối...`);
        await handleConnectEsp8266(matched);
        break;
      }
    }

    if (!found) {
      setScanStatus8266(`⚠️ Không tìm thấy ESP8266 trong dải ${selectedSubnet8266}.x. Hãy kiểm tra lại IP hoặc nhập trực tiếp IP từ hotspot/router.`);
    }
    setScanning8266(false);
  };

  // ── XỬ LÝ KẾT NỐI ESP32 RGB ───────────────────────────────────────────────
  const handleConnectEsp32 = async (targetUrl: string = esp32Url) => {
    let cleanUrl = targetUrl.trim().replace(/\/+$/, '');
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `http://${cleanUrl}`;
    }
    setEsp32Url(cleanUrl);
    setScanStatus32('Đang kiểm tra kết nối ESP32 tại ' + cleanUrl + '...');

    if (rgb) {
      rgb.updateUrl(cleanUrl);
      setTimeout(() => {
        if (rgb.connected) {
          setScanStatus32(`✅ Đã kết nối thành công với ESP32 RGB tại ${cleanUrl}`);
        } else {
          setScanStatus32(`Đã lưu ${cleanUrl}. Đang đồng bộ tín hiệu với ESP32...`);
        }
      }, 1000);
    }
  };

  // ── TỰ ĐỘNG DÒ TÌM IP ESP32 ───────────────────────────────────────────────
  const handleAutoScanEsp32 = async () => {
    setScanning32(true);
    setScanStatus32(`Đang dò tìm ESP32 RGB trong dải ${selectedSubnet32}.x và mDNS...`);

    const candidates: string[] = [
      'http://den-rgb.local',
      esp32Url,
      `http://${selectedSubnet32}.130`,
      `http://${selectedSubnet32}.195`,
      `http://${selectedSubnet32}.98`,
      `http://${selectedSubnet32}.94`,
      `http://${selectedSubnet32}.93`,
      `http://${selectedSubnet32}.100`,
      'http://192.168.137.130',
      'http://192.168.4.1',
    ];

    for (let i = 120; i <= 150; i++) {
      const u = `http://${selectedSubnet32}.${i}`;
      if (!candidates.includes(u)) candidates.push(u);
    }
    for (let i = 180; i <= 215; i++) {
      const u = `http://${selectedSubnet32}.${i}`;
      if (!candidates.includes(u)) candidates.push(u);
    }
    for (let i = 85; i <= 115; i++) {
      const u = `http://${selectedSubnet32}.${i}`;
      if (!candidates.includes(u)) candidates.push(u);
    }
    for (let i = 2; i <= 30; i++) {
      const u = `http://${selectedSubnet32}.${i}`;
      if (!candidates.includes(u)) candidates.push(u);
    }

    let found = false;
    const BATCH_SIZE = 8;
    for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
      const batch = candidates.slice(i, i + BATCH_SIZE);
      const progress = Math.round((i / candidates.length) * 100);
      setScanStatus32(`Đang dò ESP32: ${batch[0]} ... (${progress}%)`);

      const promises = batch.map(async (testUrl) => {
        try {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 950);
          const res = await fetch(`${testUrl}/status`, { signal: ctrl.signal, mode: 'cors' });
          clearTimeout(timer);
          if (res.ok) {
            const data = await res.json();
            if (data.mode !== undefined && data.numLeds !== undefined) return testUrl;
          }
        } catch {}
        return null;
      });

      const results = await Promise.all(promises);
      const matched = results.find((r) => r !== null);
      if (matched) {
        found = true;
        setEsp32Url(matched);
        setScanStatus32(`🎉 Đã tìm thấy ESP32 RGB tại: ${matched}!`);
        await handleConnectEsp32(matched);
        break;
      }
    }

    if (!found) {
      setScanStatus32(`⚠️ Không tìm thấy ESP32 tự động trong dải ${selectedSubnet32}.x. Hãy nhập IP hoặc dùng tên miền http://den-rgb.local`);
    }
    setScanning32(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── THÔNG TIN HƯỚNG DẪN ĐỔI MẠNG ───────────────────────────────────── */}
      {typeof window !== 'undefined' && window.location.protocol === 'https:' && (
        <div
          style={{
            padding: '12px 15px',
            background: 'rgba(230, 140, 30, 0.15)',
            border: '1px solid #d48b2a',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#ffdd99',
            lineHeight: '1.6',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
          }}
        >
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div>
            <strong style={{ color: '#fff0c8', fontSize: '13px' }}>
              Trình duyệt đang chặn kết nối IP nội bộ (Lỗi Mixed Content):
            </strong>
            <br />
            Bạn đang truy cập qua link bảo mật <code>https://</code>. Để kết nối được tới địa chỉ IP của ESP, bạn chỉ cần mở quyền 1 lần duy nhất:
            <br />
            • <strong>Bước 1:</strong> Bấm vào biểu tượng 🔒 hoặc ⚙️ ở góc trái thanh địa chỉ trình duyệt (cạnh chữ https://...).
            <br />
            • <strong>Bước 2:</strong> Chọn <em>Cài đặt trang web</em> (Site settings).
            <br />
            • <strong>Bước 3:</strong> Tìm dòng <em>Nội dung không an toàn</em> (Insecure content) → Đổi sang <strong>Cho phép</strong> (Allow).
            <br />
            • <strong>Bước 4:</strong> Quay lại web và bấm phím <strong>F5</strong> để kết nối lại!
          </div>
        </div>
      )}

      <div
        style={{
          padding: '14px 16px',
          background: 'linear-gradient(135deg, #2c1210 0%, #160807 100%)',
          border: '1px solid #734c2d',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#ecd18a',
          lineHeight: '1.6',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#f3dd9b' }}>
          <Wifi size={16} /> Hướng dẫn khi chuyển sang Wi-Fi mới hoặc bật Hotspot từ điện thoại:
        </div>
        <div>
          Mỗi khi bạn đổi mạng Wi-Fi hoặc phát 4G từ điện thoại, router sẽ cấp một địa chỉ IP mới cho ESP8266 và ESP32.
          <br />
          • <strong>Cách 1:</strong> Chọn nhanh loại mạng của bạn bên dưới rồi bấm <strong>"🔍 Tự dò tìm IP"</strong> để hệ thống tự động quét và kết nối.
          <br />
          • <strong>Cách 2:</strong> Xem địa chỉ IP trên điện thoại phát Wi-Fi (trong danh sách thiết bị kết nối) hoặc Serial Monitor, nhập thẳng vào ô IP rồi bấm <strong>"Lưu & Kết nối ngay"</strong>.
        </div>
      </div>

      {/* ── TRẠM 1: CẤU HÌNH IP ESP8266 RELAY ──────────────────────────────── */}
      <section
        className="panel"
        style={{
          background: '#230e0d',
          border: `1px solid ${state.connected ? '#3a7d44' : '#8c3d38'}`,
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>⚡</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#f3dd9b' }}>
                TRẠM 1: CHIẾU SÁNG 4 KHU (ESP8266 RELAY)
              </h4>
              <span style={{ fontSize: '11px', color: '#c9b09a' }}>
                4 Kênh Relay (D5, D6, D7, D8) · Cảm biến ánh sáng LDR (A0)
              </span>
            </div>
          </div>

          <span
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: state.connected ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
              color: state.connected ? '#81c784' : '#e57373',
              border: `1px solid ${state.connected ? '#3a7d44' : '#9c3434'}`,
            }}
          >
            {state.connected ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            {state.connected ? `Đang kết nối: ${state.deviceConfig?.url || esp8266Url}` : 'Chưa kết nối'}
          </span>
        </div>

        {/* Chọn nhanh Subnet */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', color: '#c9b09a', display: 'block', marginBottom: '6px' }}>
            Chọn nhanh loại mạng Wi-Fi hiện tại để quét:
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {SUBNET_PRESETS.map((preset) => (
              <button
                key={preset.subnet}
                type="button"
                onClick={() => {
                  setSelectedSubnet8266(preset.subnet);
                  setEsp8266Url(preset.sampleIp);
                }}
                style={{
                  padding: '5px 10px',
                  background: selectedSubnet8266 === preset.subnet ? '#5c221c' : '#1e0c0b',
                  border: `1px solid ${selectedSubnet8266 === preset.subnet ? '#ecd18a' : '#573322'}`,
                  borderRadius: '4px',
                  color: selectedSubnet8266 === preset.subnet ? '#fff' : '#c9b09a',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: selectedSubnet8266 === preset.subnet ? 600 : 400,
                }}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setEsp8266Url('http://atk-light.local');
              }}
              style={{
                padding: '5px 10px',
                background: '#1e0c0b',
                border: '1px solid #573322',
                borderRadius: '4px',
                color: '#ecd18a',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              mDNS: atk-light.local
            </button>
          </div>
        </div>

        {/* Ô nhập URL và Token */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#c9b09a', display: 'block', marginBottom: '4px' }}>
              Địa chỉ IP ESP8266 (Ví dụ: 192.168.137.93 hoặc http://atk-light.local)
            </label>
            <input
              type="text"
              value={esp8266Url}
              onChange={(e) => setEsp8266Url(e.target.value)}
              placeholder="http://192.168.137.93"
              style={{
                width: '100%',
                padding: '8px 10px',
                background: '#1a0b0a',
                border: '1px solid #734c2d',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '13px',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#c9b09a', display: 'block', marginBottom: '4px' }}>
              Khóa API Token
            </label>
            <input
              type="text"
              value={esp8266Token}
              onChange={(e) => setEsp8266Token(e.target.value)}
              placeholder="atk2026"
              style={{
                width: '100%',
                padding: '8px 10px',
                background: '#1a0b0a',
                border: '1px solid #734c2d',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '13px',
              }}
            />
          </div>
        </div>

        {/* Nút hành động */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="gold-button"
            disabled={state.busy}
            onClick={() => handleConnectEsp8266(esp8266Url)}
            style={{ padding: '8px 14px', fontSize: '12px' }}
          >
            {state.busy ? 'Đang kết nối…' : 'Lưu & Kết nối ngay'}
          </button>

          <button
            type="button"
            disabled={scanning8266}
            onClick={handleAutoScanEsp8266}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#351613',
              border: '1px solid #8c5035',
              borderRadius: '4px',
              color: '#ecd18a',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <Search size={14} />
            {scanning8266 ? 'Đang dò tìm IP…' : `🔍 Tự dò tìm IP trong dải ${selectedSubnet8266}.x`}
          </button>

          <button
            type="button"
            onClick={() => handleConnectEsp8266('http://192.168.4.1')}
            style={{
              padding: '8px 10px',
              background: '#1e0c0b',
              border: '1px solid #573322',
              borderRadius: '4px',
              color: '#c9b09a',
              fontSize: '11px',
              cursor: 'pointer',
            }}
            title="Dùng khi kết nối trực tiếp vào Wi-Fi do bo mạch phát ra"
          >
            Mạng AP mặc định (192.168.4.1)
          </button>
        </div>

        {scanStatus8266 && (
          <p
            style={{
              margin: '10px 0 0 0',
              padding: '8px 10px',
              borderRadius: '4px',
              background: '#170807',
              border: '1px dashed #6b3e2d',
              fontSize: '11px',
              color: '#ecd18a',
            }}
          >
            {scanStatus8266}
          </p>
        )}

        {/* 🧪 THỬ NGHIỆM ĐIỀU KHIỂN RELAY TẠI CHỖ */}
        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #4a241b' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#f3dd9b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={14} color="#ecd18a" /> Thử nghiệm điều khiển Relay trực tiếp (Kiểm chứng kết nối ngay tại chỗ):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
            {state.areas.map((area) => (
              <button
                key={area.id}
                type="button"
                onClick={() => state.toggleArea(area.id)}
                style={{
                  padding: '8px 10px',
                  background: area.on ? 'linear-gradient(135deg, #2b6133 0%, #17381d 100%)' : '#26100e',
                  border: `1px solid ${area.on ? '#81c784' : '#6b3e2d'}`,
                  color: area.on ? '#ffffff' : '#e0cfbe',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: area.on ? '0 0 10px rgba(129, 199, 132, 0.3)' : undefined,
                }}
              >
                <span>{area.name}</span>
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: area.on ? '#3a7d44' : '#140706',
                    color: area.on ? '#fff' : '#b49f8b',
                    fontSize: '10px',
                    fontWeight: 700,
                  }}
                >
                  {area.on ? 'ĐANG BẬT' : 'TẮT'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRẠM 2: CẤU HÌNH IP ESP32 RGB ──────────────────────────────────── */}
      <section
        className="panel"
        style={{
          background: '#210d24',
          border: `1px solid ${rgb?.connected ? '#3a7d44' : '#883a91'}`,
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>🎨</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#f8d5ff' }}>
                TRẠM 2: LED NGHỆ THUẬT RGB (ESP32 WS2812B)
              </h4>
              <span style={{ fontSize: '11px', color: '#d8b9e6' }}>
                DIN GPIO 4 · Mic GPIO 19 · Quang GPIO 18 · 12 Hiệu ứng động
              </span>
            </div>
          </div>

          <span
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: rgb?.connected ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 193, 7, 0.15)',
              color: rgb?.connected ? '#81c784' : '#ffd54f',
              border: `1px solid ${rgb?.connected ? '#3a7d44' : '#997318'}`,
            }}
          >
            {rgb?.connected ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            {rgb?.connected ? `Đang kết nối: ${rgb.url}` : 'Chờ thiết bị'}
          </span>
        </div>

        {/* Chọn nhanh Subnet ESP32 */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', color: '#d8b9e6', display: 'block', marginBottom: '6px' }}>
            Chọn nhanh loại mạng Wi-Fi hiện tại để dò tìm ESP32:
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {SUBNET_PRESETS.map((preset) => (
              <button
                key={preset.subnet}
                type="button"
                onClick={() => {
                  setSelectedSubnet32(preset.subnet);
                  setEsp32Url(`http://${preset.subnet}.98`);
                }}
                style={{
                  padding: '5px 10px',
                  background: selectedSubnet32 === preset.subnet ? '#571c5e' : '#1b0a1f',
                  border: `1px solid ${selectedSubnet32 === preset.subnet ? '#e68aee' : '#57265e'}`,
                  borderRadius: '4px',
                  color: selectedSubnet32 === preset.subnet ? '#fff' : '#d8b9e6',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: selectedSubnet32 === preset.subnet ? 600 : 400,
                }}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setEsp32Url('http://den-rgb.local');
              }}
              style={{
                padding: '5px 10px',
                background: '#1b0a1f',
                border: '1px solid #57265e',
                borderRadius: '4px',
                color: '#e68aee',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              mDNS: den-rgb.local
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '11px', color: '#d8b9e6', display: 'block', marginBottom: '4px' }}>
            Địa chỉ IP ESP32 (Ví dụ: http://den-rgb.local hoặc 192.168.137.98)
          </label>
          <input
            type="text"
            value={esp32Url}
            onChange={(e) => setEsp32Url(e.target.value)}
            placeholder="http://den-rgb.local"
            style={{
              width: '100%',
              padding: '8px 10px',
              background: '#190a1c',
              border: '1px solid #7c4484',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '13px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="gold-button"
            onClick={() => handleConnectEsp32(esp32Url)}
            style={{
              padding: '8px 14px',
              fontSize: '12px',
              background: 'linear-gradient(135deg, #742566 0%, #441738 100%)',
              border: '1px solid #d88ce8',
              color: '#fff',
            }}
          >
            Lưu & Kết nối ESP32
          </button>

          <button
            type="button"
            disabled={scanning32}
            onClick={handleAutoScanEsp32}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#36113b',
              border: '1px solid #8e479c',
              borderRadius: '4px',
              color: '#f8d5ff',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <Search size={14} />
            {scanning32 ? 'Đang dò tìm IP…' : `🔍 Tự dò tìm IP trong dải ${selectedSubnet32}.x`}
          </button>

          <button
            type="button"
            onClick={() => handleConnectEsp32('http://den-rgb.local')}
            style={{
              padding: '8px 10px',
              background: '#1f0d23',
              border: '1px solid #63326b',
              borderRadius: '4px',
              color: '#d8b9e6',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Tên miền mDNS (den-rgb.local)
          </button>

          <button
            type="button"
            onClick={() => handleConnectEsp32('http://192.168.4.1')}
            style={{
              padding: '8px 10px',
              background: '#1f0d23',
              border: '1px solid #63326b',
              borderRadius: '4px',
              color: '#d8b9e6',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Mạng AP mặc định (192.168.4.1)
          </button>
        </div>

        {scanStatus32 && (
          <p
            style={{
              margin: '10px 0 0 0',
              padding: '8px 10px',
              borderRadius: '4px',
              background: '#160818',
              border: '1px dashed #7a3e82',
              fontSize: '11px',
              color: '#f8d5ff',
            }}
          >
            {scanStatus32}
          </p>
        )}
      </section>
    </div>
  );
}
