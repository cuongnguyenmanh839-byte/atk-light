import React, { useEffect, useState } from 'react';
import { userService } from '../services/user.service';
import type { UserItem } from '../services/user.service';
import { useAuth } from '../contexts/AuthContext';
import { Users, UserPlus, Trash2, Shield, AlertCircle, Check } from 'lucide-react';

export function UserManagement() {
  const { canManageUsers, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('OPERATOR');
  const [newPassword, setNewPassword] = useState('Atk@2026');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadUsers = async () => {
    if (!canManageUsers()) return;
    setLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [canManageUsers]);

  if (!canManageUsers()) {
    return (
      <div style={{ padding: '12px', background: '#301311', border: '1px solid #5a3023', borderRadius: '4px', fontSize: '11px', color: '#b4a08c' }}>
        Tài khoản hiện tại không có quyền quản lý người dùng (Yêu cầu quyền ADMIN).
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
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
      setMessage(`Đã tạo tài khoản ${newUsername} thành công`);
      setShowAddForm(false);
      setNewUsername('');
      setNewEmail('');
      setNewFullName('');
      loadUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tạo người dùng');
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (username === currentUser?.username) {
      setError('Không thể xóa tài khoản đang đăng nhập');
      return;
    }
    if (!confirm(`Xác nhận xóa người dùng ${username}?`)) return;
    try {
      await userService.delete(id);
      setMessage(`Đã xóa người dùng ${username}`);
      loadUsers();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể xóa');
    }
  };

  return (
    <div style={{ marginTop: '16px', borderTop: '1px solid #64402d', paddingTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '13px', margin: 0, color: '#f3dd9b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={16} color="#ecd18a" /> QUẢN LÝ NGƯỜI DÙNG HỆ THỐNG
        </h3>
        <button
          type="button"
          className="gold-button"
          style={{ padding: '6px 12px', fontSize: '11px' }}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <UserPlus size={14} /> {showAddForm ? 'Đóng biểu mẫu' : 'Thêm người dùng'}
        </button>
      </div>

      {message && (
        <div style={{ padding: '8px 12px', background: '#1c4224', border: '1px solid #4a8a54', borderRadius: '4px', color: '#c4f0cb', fontSize: '11px', marginBottom: '10px' }}>
          <Check size={13} style={{ display: 'inline', marginRight: '6px' }} /> {message}
        </div>
      )}

      {error && (
        <div style={{ padding: '8px 12px', background: '#5a1311', border: '1px solid #a6322d', borderRadius: '4px', color: '#ffc7c2', fontSize: '11px', marginBottom: '10px' }}>
          <AlertCircle size={13} style={{ display: 'inline', marginRight: '6px' }} /> {error}
        </div>
      )}

      {showAddForm && (
        <form onSubmit={handleCreate} style={{ padding: '14px', background: '#260d0c', border: '1px solid #734c2d', borderRadius: '6px', marginBottom: '14px', display: 'grid', gap: '10px' }}>
          <strong style={{ fontSize: '12px', color: '#ecd18a' }}>Thêm tài khoản mới</strong>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <label style={{ fontSize: '11px' }}>
              Tên đăng nhập
              <input required value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="vd: operator2" />
            </label>
            <label style={{ fontSize: '11px' }}>
              Họ và tên
              <input required value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="vd: Nguyễn Văn A" />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <label style={{ fontSize: '11px' }}>
              Email
              <input type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@atk.vn" />
            </label>
            <label style={{ fontSize: '11px' }}>
              Mật khẩu khởi tạo
              <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </label>
          </div>
          <label style={{ fontSize: '11px' }}>
            Vai trò / Phân quyền
            <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
              <option value="VIEWER">Người xem (VIEWER) - Chỉ giám sát</option>
              <option value="OPERATOR">Người vận hành (OPERATOR) - Bật/tắt, đổi cảnh</option>
              <option value="ADMIN">Quản trị viên (ADMIN) - Quản lý người dùng, lịch</option>
            </select>
          </label>
          <button type="submit" className="gold-button" style={{ padding: '8px', marginTop: '4px' }}>
            Lưu người dùng mới
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gap: '6px' }}>
        {users.map((u) => (
          <div
            key={u.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: '#351613',
              border: '1px solid #633627',
              borderRadius: '4px',
              fontSize: '11px',
            }}
          >
            <div>
              <strong style={{ color: '#f5ddb2', marginRight: '8px' }}>{u.fullName}</strong>
              <span style={{ color: '#b4a08c', fontSize: '10px' }}>@{u.username}</span>
              <div style={{ fontSize: '9px', color: '#8e7565', marginTop: '2px' }}>{u.email}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '9px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background:
                    u.role === 'SUPER_ADMIN'
                      ? '#b58b42'
                      : u.role === 'ADMIN'
                      ? '#755020'
                      : u.role === 'OPERATOR'
                      ? '#1e6628'
                      : '#402a28',
                  color: '#fff',
                  border: '1px solid #734c2d',
                }}
              >
                {u.role}
              </span>
              {u.username !== currentUser?.username && u.role !== 'SUPER_ADMIN' && (
                <button
                  type="button"
                  onClick={() => handleDelete(u.id, u.username)}
                  aria-label={`Xóa người dùng ${u.username}`}
                  style={{ color: '#d66b6b', padding: '4px' }}
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
