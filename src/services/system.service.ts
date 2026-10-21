import api from './api';

export interface AreaState {
  id: string;
  code: string;
  name: string;
  icon: string;
  mapX: number;
  mapY: number;
  power: boolean;
  brightness: number;
  colorTemperature: number;
  totalLights: number;
  activeLights: number;
  on: boolean;
  lamps: number;
  lit: number;
}

export interface SystemStateData {
  power: boolean;
  brightness: number;
  colorTemperature: number;
  mode: number;
  areas: AreaState[];
  totalLights: number;
  activeLights: number;
  alerts: any[];
  scenes: any[];
  energyToday: number;
}

export const systemService = {
  async getState(): Promise<SystemStateData> {
    const { data } = await api.get('/system/state');
    return data.data;
  },

  async setPower(power: boolean): Promise<any> {
    const { data } = await api.post('/system/power', { power });
    return data.data;
  },

  async setBrightness(brightness: number): Promise<any> {
    const { data } = await api.patch('/system/brightness', { brightness });
    return data.data;
  },

  async setColorTemperature(colorTemperature: number): Promise<any> {
    const { data } = await api.patch('/system/color-temperature', { colorTemperature });
    return data.data;
  },

  async setMode(mode: number): Promise<any> {
    const { data } = await api.post('/system/mode', { mode });
    return data.data;
  },

  async getEnergyChart(): Promise<any[]> {
    const { data } = await api.get('/system/energy/chart');
    return data.data;
  },

  async getEsp32Config(): Promise<{ url: string; token?: string }> {
    const { data } = await api.get('/system/esp32');
    return data.data;
  },

  async setEsp32Config(url: string, token?: string): Promise<any> {
    const { data } = await api.post('/system/esp32', { url, token });
    return data.data;
  },
};
