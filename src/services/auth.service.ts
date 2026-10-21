import api from './api';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    email: string;
    role: string;
    avatar: string | null;
  };
}

export const authService = {
  async login(username: string, password: string): Promise<LoginResult> {
    const { data } = await api.post('/auth/login', { username, password });
    const result: LoginResult = data.data;
    localStorage.setItem('atk-access-token', result.accessToken);
    localStorage.setItem('atk-refresh-token', result.refreshToken);
    return result;
  },

  async logout(refreshToken: string) {
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch { /* ignore */ }
    localStorage.removeItem('atk-access-token');
    localStorage.removeItem('atk-refresh-token');
  },

  async me() {
    const { data } = await api.get('/auth/me');
    return data.data;
  },

  async changePassword(oldPassword: string, newPassword: string) {
    const { data } = await api.post('/auth/change-password', { oldPassword, newPassword });
    return data;
  },

  getStoredTokens() {
    return {
      accessToken: localStorage.getItem('atk-access-token'),
      refreshToken: localStorage.getItem('atk-refresh-token'),
    };
  },
};
