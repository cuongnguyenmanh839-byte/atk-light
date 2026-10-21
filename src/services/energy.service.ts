import api from './api';

export const energyService = {
  async getToday() {
    const { data } = await api.get('/energy/today');
    return data.data;
  },

  async getChart(hours = 24) {
    const { data } = await api.get(`/energy/chart?hours=${hours}`);
    return data.data;
  },

  async getByArea() {
    const { data } = await api.get('/energy/areas');
    return data.data;
  },

  async getReport(from?: string, to?: string) {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const { data } = await api.get(`/energy/report?${params.toString()}`);
    return data.data;
  },
};
