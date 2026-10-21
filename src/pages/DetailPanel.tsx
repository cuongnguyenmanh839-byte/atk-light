import { useEffect, useRef, useState } from 'react';
import { X, Plus, Trash2, Download, CheckCheck, KeyRound, LogOut, UserCheck } from 'lucide-react';
import type { Lighting } from '../hooks/useLighting';
import { AreaCard } from '../components/AreaCard';
import { QuickControl } from '../components/Controls';
import { AlertList, EnergyChart } from '../components/Summary';
import { useAuth } from '../contexts/AuthContext';
import { UserManagement } from '../components/UserManagement';
import { PermissionsPanel } from '../components/PermissionsPanel';
import { DeviceSettings } from '../components/DeviceSettings';
import { HistoricalMusicPlayer } from '../components/HistoricalMusicPlayer';
import { RgbLedControl } from '../components/RgbLedControl';
import type { RgbLedHook } from '../hooks/useRgbLed';
import { authService } from '../services/auth.service';

export function DetailPanel({
  page,
  state,
  rgb,
  onClose,
  onOpenLogin,
}: {
  page: string;
  state: Lighting;
  rgb?: RgbLedHook;
  onClose: () => void;
  onOpenLogin?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const { user, logout, canManageUsers } = useAuth();

  const [time, setTime] = useState('18:00');
  const [mode, setMode] = useState('Tham quan');
  const [name, setName] = useState(user?.fullName || state.displayName);
  const [saved, setSaved] = useState(false);

  // Change password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');

  const { schedules } = state;

  useEffect(() => {
    dialog.current?.showModal();
    const el = dialog.current;
    return () => el?.close();
  }, []);

  const download = () => {
    const csv =
      '\uFEFFKhu vực,Mã khu,Số đèn,Đang bật\n' +
      state.areas.map((a) => `${a.name},${a.id},${a.lamps},${a.on ? a.lit : 0}`).join('\n') +
      '\nĐiện năng hôm nay,' +
      (state.energyKwh ?? 0) +
      ',kWh\n' +
      'Tổng số đèn,' +
      state.totalLights +
      ',bóng\n' +
      'Đèn đang bật,' +
      state.lit +
      ',bóng\n';

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATK-bao-cao-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdErr('');
    setPwdMsg('');
    try {
      await authService.changePassword(oldPassword, newPassword);
      setPwdMsg('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPwdErr(err?.response?.data?.message || 'Không thể đổi mật khẩu');
    }
  };

  const roleText = user
    ? user.role === 'SUPER_ADMIN'
      ? 'Quản trị tối cao (SUPER_ADMIN)'
      : user.role === 'ADMIN'
      ? 'Quản trị viên (ADMIN)'
      : user.role === 'OPERATOR'
      ? 'Người vận hành (OPERATOR)'
      : 'Người xem (VIEWER)'
    : 'Khách';

  const isRgbPage = page === 'LED RGB (ESP32)';
  const isDevicePage = page === 'Kết nối IP thiết bị' || page === 'Kết nối IP';
  const isWidePage = isRgbPage || isDevicePage;

  return (
    <dialog
      ref={dialog}
      className={isWidePage ? 'detail-dialog rgb-page-dialog' : 'detail-dialog'}
      style={
        isWidePage
          ? {
              maxWidth: isRgbPage ? '1040px' : '960px',
              width: 'min(980px, calc(100vw - 32px))',
              maxHeight: '90vh',
              background: 'linear-gradient(135deg, #220c0a 0%, #140606 100%)',
              border: '1px solid #a87948',
              boxShadow: '0 25px 90px rgba(0, 0, 0, 0.95)',
              borderRadius: '12px',
            }
          : undefined
      }
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="detail-header"
        style={
          isWidePage
            ? {
                background: 'linear-gradient(90deg, #3d1411 0%, #1f0a09 100%)',
                borderBottom: '1px solid #794a2b',
                padding: '14px 20px',
              }
            : undefined
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isWidePage && (
            <button
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '5px 12px',
                background: 'linear-gradient(135deg, #5c201c 0%, #351210 100%)',
                border: '1px solid #a87948',
                borderRadius: '6px',
                color: '#fff0c8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ‹ Quay lại Tổng quan
            </button>
          )}
          <h2 style={{ fontSize: isWidePage ? '15px' : '16px' }}>
            {isRgbPage
              ? 'TRANG ĐIỀU KHIỂN: ĐÈN NGHỆ THUẬT RGB & ĐA CẢM BIẾN (ESP32)'
              : isDevicePage
              ? 'KẾT NỐI & DÒ TÌM IP THIẾT BỊ (ESP8266 & ESP32)'
              : page.toLocaleUpperCase('vi')}
          </h2>
        </div>
        <button aria-label="Đóng" onClick={onClose}>
          <X />
        </button>
      </div>

      <div
        className="detail-body"
        style={
          isWidePage
            ? {
                padding: '18px 20px 24px',
                maxHeight: 'calc(90vh - 70px)',
                overflowY: 'auto',
              }
            : undefined
        }
      >
        {state.error && (
          <p role="alert" className="connection-bad" style={{ padding: '8px 12px', background: '#551513', borderRadius: '4px' }}>
            {state.error}
          </p>
        )}

        {/* ── KHU VỰC ──────────────────────────────────────────────────────── */}
        {page === 'Khu vực' && (
          <>
            <p>
              {state.totalLights} đèn tại 4 khu di tích chính · {state.lit} đèn đang bật
            </p>
            <div className="area-grid">
              {state.areas.map((a) => (
                <AreaCard key={a.id} area={a} onClick={() => state.toggleArea(a.id)} />
              ))}
            </div>
            <small>Chạm vào khu vực để bật/tắt chiếu sáng. Dữ liệu đồng bộ trực tiếp với Cơ sở dữ liệu.</small>
          </>
        )}

        {/* ── ĐIỀU KHIỂN ────────────────────────────────────────────────────── */}
        {page === 'Điều khiển' && <QuickControl state={state} />}

        {/* ── TRẠM 2: LED NGHỆ THUẬT RGB (ESP32) ───────────────────────────── */}
        {page === 'LED RGB (ESP32)' && rgb && <RgbLedControl rgb={rgb} />}

        {/* ── KẾT NỐI IP THIẾT BỊ (ESP8266 & ESP32) ────────────────────────── */}
        {(page === 'Kết nối IP thiết bị' || page === 'Kết nối IP') && (
          <DeviceSettings state={state} rgb={rgb} />
        )}

        {/* ── ÂM NHẠC LỊCH SỬ ──────────────────────────────────────────────── */}
        {page === 'Âm nhạc lịch sử' && <HistoricalMusicPlayer />}

        {/* ── CẢNH BÁO ─────────────────────────────────────────────────────── */}
        {page === 'Cảnh báo' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <button
                className="gold-button"
                style={{ padding: '6px 12px', fontSize: '11px' }}
                onClick={() => state.acknowledgeAllAlerts()}
              >
                <CheckCheck size={14} /> Xác nhận tất cả cảnh báo
              </button>
            </div>
            <AlertList state={state} all />
          </>
        )}

        {/* ── PHÂN QUYỀN ───────────────────────────────────────────────────── */}
        {page === 'Phân quyền' && <PermissionsPanel onOpenLogin={onOpenLogin} />}

        {/* ── GIÁM SÁT NĂNG LƯỢNG ──────────────────────────────────────────── */}
        {page === 'Giám sát năng lượng' && (
          <>
            <EnergyChart state={state} />
            <p>Tiêu thụ hôm nay: {state.energyKwh?.toLocaleString('vi-VN')} kWh · Dữ liệu giám sát từ CSDL.</p>
          </>
        )}

        {/* ── BÁO CÁO ──────────────────────────────────────────────────────── */}
        {page === 'Báo cáo' && (
          <>
            <EnergyChart state={state} />
            <p>Báo cáo hoạt động chiếu sáng trung tâm ATK Định Hóa · Dữ liệu vận hành chính thức</p>
            <button className="gold-button" onClick={download}>
              <Download /> Tải báo cáo CSV
            </button>
          </>
        )}

        {/* ── LỊCH HOẠT ĐỘNG ───────────────────────────────────────────────── */}
        {page === 'Lịch hoạt động' && (
          <>
            <p>Lịch tự động lưu trên máy chủ và cơ sở dữ liệu, thực thi hàng ngày theo giờ Việt Nam.</p>
            {schedules.map((s) => (
              <div className="schedule-row" key={s.id}>
                <strong>{s.time}</strong>
                <span>{s.mode}</span>
                <button
                  aria-label={`Xóa lịch ${s.time}`}
                  onClick={() => state.deleteSchedule(s.id)}
                >
                  <Trash2 />
                </button>
              </div>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                state.addSchedule(time, mode);
              }}
            >
              <label>
                Thời gian
                <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} />
              </label>
              <label>
                Chế độ
                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                  {['Tham quan', 'Lễ tưởng niệm', 'An ninh', 'Tiết kiệm'].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              <button className="gold-button" type="submit">
                <Plus /> Thêm lịch
              </button>
            </form>
          </>
        )}

        {/* ── CÀI ĐẶT ──────────────────────────────────────────────────────── */}
        {page === 'Cài đặt' && (
          <>
            {/* User Session Info */}
            <div
              style={{
                padding: '14px',
                background: '#351613',
                border: '1px solid #734c2d',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f3dd9b' }}>
                  {user?.fullName || state.displayName}
                </div>
                <div style={{ fontSize: '11px', color: '#b4a08c' }}>
                  Vai trò: <strong style={{ color: '#ecd18a' }}>{roleText}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="gold-button"
                  style={{ padding: '6px 12px', fontSize: '11px' }}
                  onClick={onOpenLogin}
                >
                  <UserCheck size={13} /> Chuyển tài khoản
                </button>
                <button
                  type="button"
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    border: '1px solid #a6322d',
                    background: '#4a1210',
                    color: '#ffc7c2',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onClick={async () => {
                    await logout();
                    if (onOpenLogin) onOpenLogin();
                  }}
                >
                  <LogOut size={13} /> Đăng xuất
                </button>
              </div>
            </div>

            {/* General Info form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                state.changeDisplayName(name);
                setSaved(true);
              }}
            >
              <label>
                Tên hiển thị
                <input
                  value={name}
                  required
                  onChange={(e) => {
                    setName(e.target.value);
                    setSaved(false);
                  }}
                />
              </label>
              <label>
                Trung tâm
                <input readOnly value="ATK Định Hóa – Thái Nguyên" />
              </label>
              <p>Hệ thống kết nối Backend REST API và Socket.IO Real-time.</p>
              <button className="gold-button" type="submit">
                Lưu cài đặt
              </button>
              {saved && <p role="status">Đã lưu tên hiển thị: {name}</p>}
            </form>

            {/* Change password form */}
            <form onSubmit={handleChangePassword} style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f3dd9b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={15} /> Đổi mật khẩu
              </div>
              {pwdMsg && <p style={{ color: '#64b75e', fontSize: '11px' }}>{pwdMsg}</p>}
              {pwdErr && <p style={{ color: '#d66b6b', fontSize: '11px' }}>{pwdErr}</p>}
              <label>
                Mật khẩu cũ
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </label>
              <label>
                Mật khẩu mới (tối thiểu 6 ký tự)
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                />
              </label>
              <button className="gold-button" type="submit">
                Cập nhật mật khẩu
              </button>
            </form>

            {/* ESP32 Hardware Relay Connection */}
            <DeviceSettings state={state} rgb={rgb} />

            {/* User management section for Admin / SuperAdmin */}
            {canManageUsers() && <UserManagement />}
          </>
        )}
      </div>
    </dialog>
  );
}
