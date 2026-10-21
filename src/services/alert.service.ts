import api from './api';

export interface AlertItem {
  id: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
  areaId?: string | null;
  acknowledged: boolean;
  acknowledgedAt?: string | null;
  createdAt: string;
}

export const alertService = {
  async getAll(unreadOnly = false): Promise<AlertItem[]> {
    const { data } = await api.get(`/alerts${unreadOnly ? '?unread=true' : ''}`);
    return data.data;
  },

  async acknowledge(id: string): Promise<AlertItem> {
    const { data } = await api.patch(`/alerts/${id}/acknowledge`);
    return data.data;
  },

  async acknowledgeAll(): Promise<void> {
    await api.patch('/alerts/acknowledge-all');
  },
};
