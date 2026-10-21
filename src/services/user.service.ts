import api from './api';

export interface UserItem {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'VIEWER';
  status: 'ACTIVE' | 'LOCKED' | 'DISABLED';
  avatar?: string | null;
  createdAt: string;
  lastLogin?: string | null;
}

export const userService = {
  async getAll(): Promise<UserItem[]> {
    const { data } = await api.get('/users');
    return data.data;
  },

  async create(user: { username: string; email: string; fullName: string; role: string; password: string }): Promise<UserItem> {
    const { data } = await api.post('/users', user);
    return data.data;
  },

  async update(id: string, user: Partial<{ fullName: string; role: string; status: string; password?: string }>): Promise<UserItem> {
    const { data } = await api.patch(`/users/${id}`, user);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
