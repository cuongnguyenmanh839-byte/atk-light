import api from './api';

export interface ScheduleItem {
  id: string;
  name: string;
  startTime: string;
  daysOfWeek: string;
  sceneCode?: string | null;
  brightness?: number | null;
  colorTemperature?: number | null;
  power: boolean;
  enabled: boolean;
}

export const scheduleService = {
  async getAll(): Promise<ScheduleItem[]> {
    const { data } = await api.get('/schedules');
    return data.data;
  },

  async create(dto: Partial<ScheduleItem>): Promise<ScheduleItem> {
    const { data } = await api.post('/schedules', dto);
    return data.data;
  },

  async update(id: string, dto: Partial<ScheduleItem>): Promise<ScheduleItem> {
    const { data } = await api.patch(`/schedules/${id}`, dto);
    return data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/schedules/${id}`);
  },
};
