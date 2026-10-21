import api from './api';

export const areaService = {
  async getAll() {
    const { data } = await api.get('/areas');
    return data.data;
  },

  async getOne(id: string) {
    const { data } = await api.get(`/areas/${id}`);
    return data.data;
  },

  async setPower(id: string, power: boolean) {
    const { data } = await api.patch(`/areas/${id}/power`, { power });
    return data.data;
  },

  async setBrightness(id: string, brightness: number) {
    const { data } = await api.patch(`/areas/${id}/brightness`, { brightness });
    return data.data;
  },
};
