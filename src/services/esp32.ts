import type { Alert } from '../data/mock';
export type Schedule = { id: string | number; time: string; mode: string };
export type DeviceConfig = { url: string; token: string };
export type LightSensorState = { lux: number; isDark: boolean; autoEnabled: boolean; threshold: number };
export type DeviceState = {
 apiVersion: 1; device: string; driver: 'relay'|'cct-pwm'; hardwareReady: boolean;
 brightness: number; temperature: number; mode: number; uptimeSeconds: number;
 timeSynced: boolean; schedulesEnabled: boolean; energyKwh: number|null;
 capabilities: { brightness: boolean; temperature: boolean; energy: boolean };
 areas: {id:string;on:boolean;lamps:number;lit:number}[]; alerts:Alert[]; schedules:Schedule[];
 lightSensor?: LightSensorState;
};
export function readDeviceConfig(): DeviceConfig|null {
 try {
  const stored = sessionStorage.getItem('atk-device') || localStorage.getItem('atk-device');
  if (stored) {
    const value = JSON.parse(stored);
    if (value && typeof value.url === 'string' && typeof value.token === 'string') {
      if (value.url === 'http://192.168.137.97' || value.url === 'http://192.168.137.93') {
        value.url = 'http://192.168.137.195';
        storeDeviceConfig(value);
      }
      return value;
    }
  }
  return { url: 'http://192.168.137.195', token: 'atk2026' };
 } catch {
  return { url: 'http://192.168.137.195', token: 'atk2026' };
 }
}
export function storeDeviceConfig(config: DeviceConfig|null) {
 if(config) {
   sessionStorage.setItem('atk-device', JSON.stringify(config));
   localStorage.setItem('atk-device', JSON.stringify(config));
 } else {
   sessionStorage.removeItem('atk-device');
   localStorage.removeItem('atk-device');
 }
}
export function normalizeDeviceUrl(value: string) {
  let clean = value.trim().replace(/\/+$/, '');
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `http://${clean}`;
  }
  const url = new URL(clean);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('Nhập URL ESP, ví dụ http://192.168.137.93');
  }
  return url.origin;
}
export class DeviceHttpError extends Error { constructor(message:string,public status:number){super(message);} }
export async function deviceRequest(config:DeviceConfig,path='/api/state',method='GET',body?:unknown):Promise<DeviceState>{
 const abort=new AbortController(); const timeout=setTimeout(()=>abort.abort(),5000);
 try {
  const response=await fetch(`${normalizeDeviceUrl(config.url)}${path}`,{method,headers:{Authorization:`Bearer ${config.token}`,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:abort.signal,cache:'no-store'});
  const data=await response.json();
  if(!response.ok)throw new DeviceHttpError(data.error||`ESP32 trả lỗi ${response.status}`,response.status);
  if(data.apiVersion!==1||!Array.isArray(data.areas)||data.areas.length!==4||!data.capabilities||!Array.isArray(data.schedules)||!Array.isArray(data.alerts)||!Number.isFinite(data.brightness)||!Number.isFinite(data.temperature)||!Number.isFinite(data.mode))throw new Error('Phản hồi không đúng firmware ATK ESP32');
  const ids=['khau-ty','tin-keo','memorial','square'];
  if(ids.some(id=>data.areas.filter((a:{id:string;on:boolean;lamps:number;lit:number})=>a.id===id&&typeof a.on==='boolean'&&Number.isInteger(a.lamps)&&a.lamps>=0&&Number.isInteger(a.lit)&&a.lit>=0&&a.lit<=a.lamps).length!==1))throw new Error('Danh sách khu vực ESP32 không hợp lệ');
  return data as DeviceState;
 } catch(error) { if(error instanceof TypeError||error instanceof DOMException)throw new Error('Không kết nối được ESP32. Kiểm tra Wi-Fi, địa chỉ IP và quyền truy cập mạng cục bộ.');throw error; } finally {clearTimeout(timeout);}
}
