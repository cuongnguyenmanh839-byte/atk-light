export type RgbMode =
  | 'auto_light'
  | 'sound'
  | 'smart_combo'
  | 'rainbow'
  | 'chase'
  | 'fire'
  | 'ocean'
  | 'aurora'
  | 'breathe'
  | 'random'
  | 'scanner'
  | 'theater'
  | 'wipe'
  | 'strobe'
  | 'equalizer'
  | 'solid'
  | 'off';

export interface RgbDeviceState {
  device?: string;
  mode: RgbMode;
  numLeds: number;
  r: number;
  g: number;
  b: number;
  bri: number;
  speed: number;
  rawLight: number;
  rawSound: number;
  isDark: boolean;
  soundDetected: boolean;
  lightActLow: boolean;
  soundActLow: boolean;
  hour: number;
  min: number;
  sec: number;
  schedEn: boolean;
  countdown: number;
  wifiSsid: string;
  wifiIp: string;
  connected: boolean;
  lastUpdated?: string;
}

export const RGB_EFFECTS: { id: RgbMode; name: string; desc: string; icon: string }[] = [
  { id: 'rainbow', name: 'Cầu vồng cuộn', desc: 'Dải 7 màu mượt mà xoay chuyển liên tục', icon: '🌈' },
  { id: 'chase', name: 'Sao băng lướt đuổi', desc: 'Vệt sao băng lướt nhanh với đuôi sáng dần', icon: '🌠' },
  { id: 'fire', name: 'Ngọn lửa bập bùng', desc: 'Mô phỏng lửa hồng ấm áp với hiệu ứng bùng sáng', icon: '🔥' },
  { id: 'ocean', name: 'Sóng biển đại dương', desc: 'Dải sóng xanh dương dập dềnh êm dịu', icon: '🌊' },
  { id: 'aurora', name: 'Cực quang huyền ảo', desc: 'Vệt cực quang bắc cực hòa quyện đa sắc màu', icon: '✨' },
  { id: 'breathe', name: 'Nhịp thở thư giãn', desc: 'Tỏa sáng và dịu dần theo nhịp thở sinh học', icon: '🫁' },
  { id: 'random', name: 'Đom đóm ngân hà', desc: 'Từng điểm sáng ngẫu nhiên lấp lánh như bầu trời đêm', icon: '🌌' },
  { id: 'scanner', name: 'Quét laser mắt thần', desc: 'Tia laser quét qua lại phong cách phi thuyền', icon: '👁️' },
  { id: 'theater', name: 'Sân khấu rạp hát', desc: 'Đèn viền chạy nối tiếp như đại lộ Broadway', icon: '🎭' },
  { id: 'wipe', name: 'Thác màu nối tiếp', desc: 'Dải màu tràn ngập từng bóng LED liên hồi', icon: '🌊' },
  { id: 'strobe', name: 'Chớp disco vũ trường', desc: 'Chớp sáng ngẫu nhiên phong cách vũ trường', icon: '⚡' },
  { id: 'equalizer', name: 'Sóng nhạc từ tâm', desc: 'Sóng màu lan tỏa từ trung tâm ra hai đầu', icon: '🎵' },
];

export const SMART_MODES: { id: RgbMode; name: string; desc: string; icon: string }[] = [
  { id: 'auto_light', name: 'Tự động Ánh sáng', desc: 'Cảm biến quang (GPIO 18): Trời tối tự bật, trời sáng tự tắt', icon: '☀️' },
  { id: 'sound', name: 'Cảm biến Âm thanh', desc: 'Cảm biến Mic (GPIO 19): Có tiếng ồn/vỗ tay sáng 5s, yên tĩnh tắt', icon: '🎙️' },
  { id: 'smart_combo', name: 'Smart Combo (Đêm + Tiếng)', desc: 'Chỉ bật khi đồng thời: Đêm tối VÀ có âm thanh phát ra', icon: '🧠' },
  { id: 'solid', name: 'Màu tĩnh đơn sắc', desc: 'Giữ màu RGB cố định do bạn chọn', icon: '🎨' },
  { id: 'off', name: 'Tắt dải LED', desc: 'Ngắt toàn bộ bóng LED WS2812B', icon: '⭕' },
];

const STORAGE_KEY = 'atk-esp32-rgb-url';
const DEFAULT_URL = 'http://den-rgb.local';

export function getEsp32RgbUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
  } catch {
    return DEFAULT_URL;
  }
}

export function setEsp32RgbUrl(url: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, url.trim().replace(/\/+$/, ''));
  } catch {
    // Ignore storage errors
  }
}

// Fallback state if device offline
const defaultMockState: RgbDeviceState = {
  device: 'ATK-ESP32-RGB-WS2812B',
  mode: 'rainbow',
  numLeds: 120,
  r: 255,
  g: 130,
  b: 10,
  bri: 180,
  speed: 3,
  rawLight: 1,
  rawSound: 1,
  isDark: false,
  soundDetected: false,
  lightActLow: true,
  soundActLow: true,
  hour: 18,
  min: 0,
  sec: 0,
  schedEn: false,
  countdown: 0,
  wifiSsid: 'ESP-TEST',
  wifiIp: '192.168.4.1',
  connected: false,
  lastUpdated: new Date().toLocaleTimeString('vi-VN'),
};

class Esp32RgbService {
  private lastKnownState: RgbDeviceState = { ...defaultMockState };

  private getBaseUrl(): string {
    return getEsp32RgbUrl();
  }

  private async fetchWithTimeout(url: string, timeoutMs = 2500): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { signal: controller.signal, mode: 'cors' });
    } finally {
      clearTimeout(timer);
    }
  }

  async getStatus(): Promise<RgbDeviceState> {
    const baseUrl = this.getBaseUrl();
    try {
      const res = await this.fetchWithTimeout(`${baseUrl}/status`);
      if (res.ok) {
        const data = await res.json();
        this.lastKnownState = {
          ...data,
          connected: true,
          lastUpdated: new Date().toLocaleTimeString('vi-VN'),
        };
        return this.lastKnownState;
      }
      throw new Error(`HTTP ${res.status}`);
    } catch {
      // Return last known state but marked disconnected
      this.lastKnownState = {
        ...this.lastKnownState,
        connected: false,
        lastUpdated: new Date().toLocaleTimeString('vi-VN'),
      };
      return this.lastKnownState;
    }
  }

  async setMode(mode: RgbMode): Promise<boolean> {
    this.lastKnownState.mode = mode;
    const baseUrl = this.getBaseUrl();
    try {
      await this.fetchWithTimeout(`${baseUrl}/mode?val=${mode}`);
      return true;
    } catch {
      return false;
    }
  }

  async setColor(r: number, g: number, b: number): Promise<boolean> {
    this.lastKnownState.r = r;
    this.lastKnownState.g = g;
    this.lastKnownState.b = b;
    this.lastKnownState.mode = 'solid';
    const baseUrl = this.getBaseUrl();
    try {
      await this.fetchWithTimeout(`${baseUrl}/set?r=${r}&g=${g}&b=${b}`);
      return true;
    } catch {
      return false;
    }
  }

  async setBrightness(val: number): Promise<boolean> {
    this.lastKnownState.bri = val;
    const baseUrl = this.getBaseUrl();
    try {
      await this.fetchWithTimeout(`${baseUrl}/bri?val=${val}`);
      return true;
    } catch {
      return false;
    }
  }

  async setSpeed(val: number): Promise<boolean> {
    this.lastKnownState.speed = val;
    const baseUrl = this.getBaseUrl();
    try {
      await this.fetchWithTimeout(`${baseUrl}/speed?val=${val}`);
      return true;
    } catch {
      return false;
    }
  }

  async setNumLeds(count: number): Promise<boolean> {
    this.lastKnownState.numLeds = count;
    const baseUrl = this.getBaseUrl();
    try {
      await this.fetchWithTimeout(`${baseUrl}/leds?count=${count}`);
      return true;
    } catch {
      return false;
    }
  }

  async invertSensor(type: 'light' | 'sound'): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    try {
      await this.fetchWithTimeout(`${baseUrl}/invert?type=${type}`);
      if (type === 'light') {
        this.lastKnownState.lightActLow = !this.lastKnownState.lightActLow;
      } else {
        this.lastKnownState.soundActLow = !this.lastKnownState.soundActLow;
      }
      return true;
    } catch {
      return false;
    }
  }

  async setTimer(minutes: number): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    try {
      await this.fetchWithTimeout(`${baseUrl}/timer?min=${minutes}`);
      this.lastKnownState.countdown = minutes * 60;
      return true;
    } catch {
      return false;
    }
  }

  async setSchedule(en: boolean, onH: number, onM: number, offH: number, offM: number): Promise<boolean> {
    const baseUrl = this.getBaseUrl();
    try {
      await this.fetchWithTimeout(
        `${baseUrl}/sched?en=${en ? 1 : 0}&onH=${onH}&onM=${onM}&offH=${offH}&offM=${offM}`
      );
      this.lastKnownState.schedEn = en;
      return true;
    } catch {
      return false;
    }
  }
}

export const esp32RgbService = new Esp32RgbService();
