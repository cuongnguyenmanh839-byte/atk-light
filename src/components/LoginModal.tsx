import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BASE_URL } from '../services/api';
import { X, Lock, User, ShieldCheck, Zap, Eye, CheckCircle2, WifiOff } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  required?: boolean;
}

export function LoginModal({ isOpen, onClose, required = false }: LoginModalProps) {
  const { login, loginOffline, isAuthenticated, user, logout } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [customHost, setCustomHost] = useState(localStorage.getItem('atk-api-url') || '');
  const [showHostInput, setShowHostInput] = useState(false);

  if (!isOpen && (!required || isAuthenticated)) return null;

  const handleNetworkError = (err: any) => {
    if (err?.code === 'ERR_NETWORK' || !err?.response) {
      setError(`⚠️ Lỗi kết nối máy chủ (${BASE_URL}). Khi dùng APK trên điện thoại, máy tính và điện thoại cần chung Wi-Fi và nhập đúng IP máy tính.`);
      setShowHostInput(true);
    } else {
      setError(err?.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      if (onClose) onClose();
    } catch (err: any) {
      handleNetworkError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
    setLoading(true);
    try {
      await login(u, p);
      if (onClose) onClose();
    } catch (err: any) {
      handleNetworkError(err);
    } finally {
      setLoading(false);
    }
  };

  const saveCustomHost = () => {
    if (customHost.trim()) {
      let formatted = customHost.trim();
      if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
        formatted = 'http://' + formatted;
      }
      if (!formatted.endsWith('/api')) {
        formatted = formatted.replace(/\/$/, '') + '/api';
      }
      localStorage.setItem('atk-api-url', formatted);
      window.location.reload();
    } else {
      localStorage.removeItem('atk-api-url');
      window.location.reload();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(17, 4, 3, 0.82)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => {
        if (!required && e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div
        className="panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '24px 28px',
          border: '1px solid #997042',
          borderRadius: '8px',
          background: 'linear-gradient(145deg, #381411, #220b0a)',
          boxShadow: '0 20px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(236,209,138,0.15)',
          position: 'relative',
        }}
      >
        {!required && onClose && (
          <button
            onClick={onClose}
            aria-label="Đóng"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              color: '#d0b8a7',
              padding: '6px',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        )}

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '2px',
              color: '#ecd18a',
              marginBottom: '4px',
              fontFamily: "'Noto Serif', Georgia, serif",
            }}
          >
            TRUNG TÂM ĐIỀU KHIỂN CHIẾU SÁNG
          </div>
          <div style={{ fontSize: '10px', letterSpacing: '1px', color: '#cdb59b' }}>
            ATK ĐỊNH HÓA — THÁI NGUYÊN
          </div>
          <h2
            style={{
              fontFamily: "'Noto Serif', Georgia, serif",
              fontSize: '18px',
              fontWeight: 700,
              color: '#f4e6d0',
              marginTop: '12px',
              letterSpacing: '0.5px',
            }}
          >
            {isAuthenticated ? 'TÀI KHOẢN HIỆN TẠI' : 'ĐĂNG NHẬP HỆ THỐNG'}
          </h2>
        </div>

        {isAuthenticated && user ? (
          <div style={{ display: 'grid', gap: '14px', textAlign: 'center' }}>
            <div
              style={{
                padding: '16px',
                background: '#2b0f0e',
                border: '1px solid #64402d',
                borderRadius: '6px',
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f3dd9b', marginBottom: '4px' }}>
                {user.fullName}
              </div>
              <div style={{ fontSize: '11px', color: '#b4a08c', marginBottom: '8px' }}>
                @{user.username} · {user.email}
              </div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 600,
                  background:
                    user.role === 'SUPER_ADMIN'
                      ? '#b58b42'
                      : user.role === 'ADMIN'
                      ? '#755020'
                      : user.role === 'OPERATOR'
                      ? '#1e6628'
                      : '#3a2522',
                  color: '#fff',
                  border: '1px solid #d5af62',
                }}
              >
                {user.role === 'SUPER_ADMIN'
                  ? 'Quản trị tối cao'
                  : user.role === 'ADMIN'
                  ? 'Quản trị viên'
                  : user.role === 'OPERATOR'
                  ? 'Người vận hành'
                  : 'Người xem'}
              </span>
            </div>

            <button
              className="gold-button"
              onClick={async () => {
                await logout();
              }}
              style={{ width: '100%' }}
            >
              Đăng xuất khỏi hệ thống
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
            {error && (
              <div
                role="alert"
                style={{
                  padding: '8px 12px',
                  background: '#5a1311',
                  border: '1px solid #a6322d',
                  borderRadius: '4px',
                  color: '#ffc7c2',
                  fontSize: '11px',
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: '#ddc19a',
                  marginBottom: '6px',
                }}
              >
                <User size={13} /> Tên đăng nhập
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#2b0f0e',
                  border: '1px solid #79532f',
                  borderRadius: '4px',
                  color: '#efdbb4',
                  fontSize: '12px',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  color: '#ddc19a',
                  marginBottom: '6px',
                }}
              >
                <Lock size={13} /> Mật khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#2b0f0e',
                  border: '1px solid #79532f',
                  borderRadius: '4px',
                  color: '#efdbb4',
                  fontSize: '12px',
                }}
              />
            </div>

            {showHostInput && (
              <div style={{ padding: '10px', background: '#200b09', border: '1px solid #844c2d', borderRadius: '4px', fontSize: '11px' }}>
                <div style={{ color: '#ecd18a', fontWeight: 600, marginBottom: '6px' }}>⚙️ Cấu hình IP Server Backend (cho APK):</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    value={customHost}
                    onChange={(e) => setCustomHost(e.target.value)}
                    placeholder="vd: http://192.168.1.100:3001/api"
                    style={{ flex: 1, padding: '6px 8px', background: '#110403', border: '1px solid #5a3023', color: '#fff', fontSize: '11px', borderRadius: '3px' }}
                  />
                  <button
                    type="button"
                    onClick={saveCustomHost}
                    style={{ padding: '6px 10px', background: '#997042', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                  >
                    Lưu IP
                  </button>
                </div>
                <div style={{ fontSize: '9px', color: '#a08976', marginTop: '4px' }}>
                  Nhập IP máy tính đang bật backend (VD: 192.168.1.15:3001/api). Để trống để quay lại mặc định.
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="gold-button"
              style={{
                width: '100%',
                marginTop: '6px',
                padding: '11px',
                fontSize: '12px',
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP VÀO HỆ THỐNG'}
            </button>

            <button
              type="button"
              onClick={() => {
                loginOffline();
                if (onClose) onClose();
              }}
              style={{
                width: '100%',
                marginTop: '8px',
                padding: '10px',
                background: 'linear-gradient(135deg, #2b6133 0%, #17381d 100%)',
                border: '1px solid #81c784',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              }}
            >
              <Zap size={14} color="#ecd18a" />
              ⚡ VÀO THẲNG APP (ĐIỀU KHIỂN ESP TRỰC TIẾP)
            </button>
          </form>
        )}

        {/* Quick Demo Accounts Selection */}
        <div style={{ marginTop: '22px', borderTop: '1px solid #5a3023', paddingTop: '16px' }}>
          <div
            style={{
              fontSize: '10px',
              color: '#b4a08c',
              marginBottom: '10px',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}
          >
            ⚡ Đăng nhập nhanh theo phân quyền
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin', 'Admin@2026')}
              style={{
                padding: '8px 10px',
                background: '#351613',
                border: '1px solid #734c2d',
                borderRadius: '4px',
                color: '#edd7b7',
                fontSize: '10px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ShieldCheck size={14} color="#ecd18a" />
              <div>
                <strong>Admin</strong>
                <div style={{ fontSize: '8px', color: '#9d8776' }}>Toàn quyền cấu hình</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('operator', 'Operator@2026')}
              style={{
                padding: '8px 10px',
                background: '#351613',
                border: '1px solid #734c2d',
                borderRadius: '4px',
                color: '#edd7b7',
                fontSize: '10px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Zap size={14} color="#64b75e" />
              <div>
                <strong>Vận hành</strong>
                <div style={{ fontSize: '8px', color: '#9d8776' }}>Bật/tắt, chỉnh sáng</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('viewer', 'Viewer@2026')}
              style={{
                padding: '8px 10px',
                background: '#351613',
                border: '1px solid #734c2d',
                borderRadius: '4px',
                color: '#edd7b7',
                fontSize: '10px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Eye size={14} color="#a9b1d6" />
              <div>
                <strong>Người xem</strong>
                <div style={{ fontSize: '8px', color: '#9d8776' }}>Chỉ xem giám sát</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('superadmin', 'SuperAdmin@2026')}
              style={{
                padding: '8px 10px',
                background: '#351613',
                border: '1px solid #734c2d',
                borderRadius: '4px',
                color: '#edd7b7',
                fontSize: '10px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={14} color="#f7768e" />
              <div>
                <strong>Toàn quyền</strong>
                <div style={{ fontSize: '8px', color: '#9d8776' }}>Super Admin</div>
              </div>
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setShowHostInput(!showHostInput)}
              style={{
                background: 'none',
                border: 'none',
                color: '#b4a08c',
                fontSize: '10px',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              ⚙️ {showHostInput ? 'Ẩn cấu hình IP Server' : 'Cấu hình IP Server (Cho APK)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
