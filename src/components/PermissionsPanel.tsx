import React, { useEffect, useState } from 'react';
import { userService } from '../services/user.service';
import type { UserItem } from '../services/user.service';
import { useAuth } from '../contexts/AuthContext';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  Check,
  X as CloseIcon,
  AlertCircle,
  KeyRound,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export function PermissionsPanel({ onOpenLogin }: { onOpenLogin?: () => void }) {
  const { user: currentUser, canManageUsers, login } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'VIEWER'>('OPERATOR');
  const [newPassword, setNewPassword] = useState('Atk@2026');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err: any) {
      // If viewer, show current users demo list
      if (!users.length) {
        setUsers([
          { id: '1', username: 'superadmin', fullName: 'Quản trị tối cao', email: 'superadmin@atk.vn', role: 'SUPER_ADMIN', status: 'ACTIVE', createdAt: '' },
          { id: '2', username: 'admin', fullName: 'Quản trị viên', email: 'admin@atk.vn', role: 'ADMIN', status: 'ACTIVE', createdAt: '' },
          { id: '3', username: 'operator', fullName: 'Người vận hành', email: 'operator@atk.vn', role: 'OPERATOR', status: 'ACTIVE', createdAt: '' },
          { id: '4', username: 'viewer', fullName: 'Người xem', email: 'viewer@atk.vn', role: 'VIEWER', status: 'ACTIVE', createdAt: '' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await userService.create({
        username: newUsername,
        email: newEmail,
        fullName: newFullName,
        role: newRole,
        password: newPassword,
      });
      setMessage(`Đã tạo người dùng "${newUsername}" với quyền ${newRole} thành công!`);
      setShowAddModal(false);
      setNewUsername('');
      setNewFullName('');
      setNewEmail('');
      loadUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tạo người dùng. Vui lòng thử lại.');
    }
  };

  const handleRoleChange = async (userId: string, targetUsername: string, targetRole: string) => {
    setError('');
    setMessage('');
    try {
      await userService.update(userId, { role: targetRole });
      setMessage(`Đã cập nhật quyền của ${targetUsername} thành ${targetRole}!`);
      loadUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể đổi quyền. Cần quyền ADMIN hoặc SUPER_ADMIN.');
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (username === currentUser?.username) {
      setError('Không thể xóa tài khoản của chính bạn!');
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${username}"?`)) return;
    try {
      await userService.delete(userId);
      setMessage(`Đã xóa người dùng "${username}".`);
      loadUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể xóa người dùng.');
    }
  };

  const handleSwitchAccount = async (u: string, p: string) => {
    try {
      await login(u, p);
      setMessage(`Đã chuyển sang tài khoản ${u}!`);
    } catch {
      if (onOpenLogin) onOpenLogin();
    }
  };

  const permissionsMatrix = [
    { name: 'Bật / Tắt toàn bộ hệ thống', super: true, admin: true, op: true, view: false },
    { name: 'Điều khiển bật / tắt từng khu vực', super: true, admin: true, op: true, view: false },
    { name: 'Chỉnh độ sáng (0–100%)', super: true, admin: true, op: true, view: false },
    { name: 'Chỉnh nhiệt độ màu (3000K–6000K)', super: true, admin: true, op: true, view: false },
    { name: 'Chuyển cảnh chiếu sáng (4 Scenes)', super: true, admin: true, op: true, view: false },
    { name: 'Thêm, sửa, xóa lịch tự động', super: true, admin: true, op: true, view: false },
    { name: 'Xác nhận cảnh báo hệ thống', super: true, admin: true, op: true, view: false },
    { name: 'Xem bản đồ di tích & năng lượng', super: true, admin: true, op: true, view: true },
    { name: 'Xem & Tải báo cáo CSV', super: true, admin: true, op: true, view: true },
    { name: 'Tạo tài khoản & Phân quyền người dùng', super: true, admin: true, op: false, view: false },
    { name: 'Cấu hình kết nối & Toàn quyền hệ thống', super: true, admin: false, op: false, view: false },
  ];

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '15px', color: '#eed090', fontFamily: "'Noto Serif', Georgia, serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#ecd18a" />
            HỆ THỐNG PHÂN QUYỀN & QUẢN TRỊ VAI TRÒ
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#b4a08c' }}>
            Tài khoản hiện tại: <strong style={{ color: '#f5ddb2' }}>{currentUser?.fullName}</strong> ({currentUser?.role})
          </p>
        </div>

        <button
          type="button"
          className="gold-button"
          style={{ padding: '8px 14px', fontSize: '11px' }}
          onClick={() => setShowAddModal(!showAddModal)}
        >
          <UserPlus size={14} />
          {showAddModal ? 'Đóng biểu mẫu' : 'Thêm tài khoản & Cấp quyền'}
        </button>
      </div>

      {message && (
        <div style={{ padding: '8px 12px', background: '#1c4224', border: '1px solid #4a8a54', borderRadius: '4px', color: '#c4f0cb', fontSize: '11px' }}>
          <Check size={14} style={{ display: 'inline', marginRight: '6px' }} /> {message}
        </div>
      )}

      {error && (
        <div style={{ padding: '8px 12px', background: '#5a1311', border: '1px solid #a6322d', borderRadius: '4px', color: '#ffc7c2', fontSize: '11px' }}>
          <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px' }} /> {error}
        </div>
      )}

      {/* Quick Switch Accounts Bar */}
      <div style={{ padding: '12px 14px', background: '#2a110f', border: '1px solid #633627', borderRadius: '6px' }}>
        <div style={{ fontSize: '11px', color: '#ecd18a', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={13} /> Chuyển nhanh vai trò để thử nghiệm phân quyền thực tế:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handleSwitchAccount('superadmin', 'SuperAdmin@2026')}
            style={{
              padding: '6px 10px',
              background: currentUser?.role === 'SUPER_ADMIN' ? '#b58b42' : '#351613',
              color: currentUser?.role === 'SUPER_ADMIN' ? '#220b0a' : '#ecd18a',
              border: '1px solid #997042',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ★ Super Admin
          </button>
          <button
            type="button"
            onClick={() => handleSwitchAccount('admin', 'Admin@2026')}
            style={{
              padding: '6px 10px',
              background: currentUser?.role === 'ADMIN' ? '#b58b42' : '#351613',
              color: currentUser?.role === 'ADMIN' ? '#220b0a' : '#ecd18a',
              border: '1px solid #997042',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🛡 Quản trị viên (Admin)
          </button>
          <button
            type="button"
            onClick={() => handleSwitchAccount('operator', 'Operator@2026')}
            style={{
              padding: '6px 10px',
              background: currentUser?.role === 'OPERATOR' ? '#2d7a36' : '#351613',
              color: currentUser?.role === 'OPERATOR' ? '#fff' : '#88d492',
              border: '1px solid #3c8245',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ⚡ Vận hành (Operator)
          </button>
          <button
            type="button"
            onClick={() => handleSwitchAccount('viewer', 'Viewer@2026')}
            style={{
              padding: '6px 10px',
              background: currentUser?.role === 'VIEWER' ? '#4f3a38' : '#351613',
              color: currentUser?.role === 'VIEWER' ? '#fff' : '#cbb5a5',
              border: '1px solid #64402d',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            👁 Người xem (Viewer)
          </button>
        </div>
      </div>

      {/* Add User Form */}
      {showAddModal && (
        <form
          onSubmit={handleCreateUser}
          style={{
            padding: '16px',
            background: '#2c100e',
            border: '1px solid #8e6238',
            borderRadius: '6px',
            display: 'grid',
            gap: '12px',
          }}
        >
          <strong style={{ fontSize: '13px', color: '#ecd18a' }}>
            + Thêm tài khoản mới & Gán quyền
          </strong>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label style={{ fontSize: '11px', display: 'grid', gap: '4px' }}>
              Tên đăng nhập (Username)
              <input
                required
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="vd: kythuatvien1"
              />
            </label>
            <label style={{ fontSize: '11px', display: 'grid', gap: '4px' }}>
              Họ và tên đầy đủ
              <input
                required
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="vd: Trần Văn Hùng"
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <label style={{ fontSize: '11px', display: 'grid', gap: '4px' }}>
              Địa chỉ Email
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="hung@atk.vn"
              />
            </label>
            <label style={{ fontSize: '11px', display: 'grid', gap: '4px' }}>
              Mật khẩu khởi tạo
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
          </div>

          <label style={{ fontSize: '11px', display: 'grid', gap: '4px' }}>
            Chọn vai trò & phân quyền
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              style={{ padding: '10px', background: '#381613', color: '#ecd18a', border: '1px solid #79532f' }}
            >
              <option value="VIEWER">👁 VIEWER - Người xem (Chỉ xem giám sát, không được điều khiển)</option>
              <option value="OPERATOR">⚡ OPERATOR - Người vận hành (Được bật/tắt đèn, chỉnh sáng, đổi cảnh, quản lý lịch)</option>
              <option value="ADMIN">🛡 ADMIN - Quản trị viên (Toàn quyền điều khiển và quản lý người dùng)</option>
              <option value="SUPER_ADMIN">★ SUPER_ADMIN - Quản trị tối cao (Cấu hình hệ thống toàn diện)</option>
            </select>
          </label>

          <button type="submit" className="gold-button" style={{ padding: '10px', marginTop: '4px' }}>
            <UserPlus size={15} /> Tạo tài khoản & Cấp quyền ngay
          </button>
        </form>
      )}

      {/* User Management List */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#f3dd9b', marginBottom: '8px' }}>
          DANH SÁCH NGƯỜI DÙNG & GÁN QUYỀN TRỰC TIẾP
        </div>
        <div style={{ display: 'grid', gap: '6px' }}>
          {users.map((u) => (
            <div
              key={u.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: '#321412',
                border: '1px solid #633627',
                borderRadius: '5px',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div>
                <strong style={{ color: '#f7e3ba', fontSize: '13px', marginRight: '8px' }}>
                  {u.fullName}
                </strong>
                <span style={{ color: '#b4a08c', fontSize: '11px' }}>@{u.username}</span>
                <div style={{ fontSize: '10px', color: '#8e7565', marginTop: '2px' }}>
                  {u.email}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#cbb5a5' }}>Vai trò:</span>
                <select
                  value={u.role}
                  disabled={!canManageUsers() || u.username === currentUser?.username || u.role === 'SUPER_ADMIN'}
                  onChange={(e) => handleRoleChange(u.id, u.username, e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    background: '#240d0c',
                    color: '#ecd18a',
                    border: '1px solid #734c2d',
                    borderRadius: '4px',
                    cursor: canManageUsers() ? 'pointer' : 'default',
                  }}
                >
                  <option value="VIEWER">VIEWER</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>

                {canManageUsers() && u.username !== currentUser?.username && u.role !== 'SUPER_ADMIN' && (
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(u.id, u.username)}
                    aria-label={`Xóa tài khoản ${u.username}`}
                    style={{ color: '#d66b6b', padding: '6px', background: 'rgba(214,107,107,0.1)', borderRadius: '4px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div style={{ marginTop: '8px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#f3dd9b', marginBottom: '8px' }}>
          MA TRẬN QUYỀN HẠN HỆ THỐNG CHI TIẾT
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
              textAlign: 'center',
              border: '1px solid #633627',
              borderRadius: '4px',
            }}
          >
            <thead>
              <tr style={{ background: '#250b0a', borderBottom: '1px solid #79532f' }}>
                <th style={{ textAlign: 'left', padding: '8px 10px', color: '#eed090' }}>Chức năng hệ thống</th>
                <th style={{ padding: '8px', color: '#ecd18a' }}>Viewer</th>
                <th style={{ padding: '8px', color: '#64b75e' }}>Operator</th>
                <th style={{ padding: '8px', color: '#f4c877' }}>Admin</th>
                <th style={{ padding: '8px', color: '#f7768e' }}>Super Admin</th>
              </tr>
            </thead>
            <tbody>
              {permissionsMatrix.map((item, idx) => (
                <tr
                  key={item.name}
                  style={{
                    background: idx % 2 === 0 ? '#341513' : '#2d1210',
                    borderBottom: '1px solid #4a271c',
                  }}
                >
                  <td style={{ textAlign: 'left', padding: '8px 10px', color: '#ddc19a' }}>{item.name}</td>
                  <td style={{ padding: '8px' }}>
                    {item.view ? <Check size={14} color="#64b75e" /> : <CloseIcon size={14} color="#a6322d" />}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {item.op ? <Check size={14} color="#64b75e" /> : <CloseIcon size={14} color="#a6322d" />}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {item.admin ? <Check size={14} color="#64b75e" /> : <CloseIcon size={14} color="#a6322d" />}
                  </td>
                  <td style={{ padding: '8px' }}>
                    {item.super ? <Check size={14} color="#64b75e" /> : <CloseIcon size={14} color="#a6322d" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
