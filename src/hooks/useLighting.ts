import { useEffect, useRef, useState, useCallback } from 'react';
import type { SetStateAction } from 'react';
import { initialAreas, initialAlerts, modes } from '../data/mock';
import type { Area, Alert } from '../data/mock';
import { systemService } from '../services/system.service';
import { areaService } from '../services/area.service';
import { scheduleService } from '../services/schedule.service';
import type { ScheduleItem } from '../services/schedule.service';
import { alertService } from '../services/alert.service';
import { energyService } from '../services/energy.service';
import { getSocket } from '../services/socket.service';
import { useAuth } from '../contexts/AuthContext';
import { deviceRequest, readDeviceConfig, storeDeviceConfig } from '../services/esp32';
import type { DeviceConfig, DeviceState } from '../services/esp32';

export interface Schedule {
  id: number | string;
  time: string;
  mode: string;
  enabled?: boolean;
}

export function useLighting() {
  const { user, canControl } = useAuth();

  const [areas, setAreas] = useState<Area[]>(initialAreas);
  const [brightness, setBrightness] = useState<number>(70);
  const [temperature, setTemperature] = useState<number>(4000);
  const [mode, setMode] = useState<number>(0);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [schedules, setSchedulesState] = useState<Schedule[]>([
    { id: 1, time: '18:00', mode: 'Tham quan', enabled: true },
    { id: 2, time: '22:30', mode: 'Tiết kiệm', enabled: true },
    { id: 3, time: '00:00', mode: 'Tắt hệ thống', enabled: true },
  ]);
  const [energyKwh, setEnergyKwh] = useState<number | null>(86.4);
  const [energyChart, setEnergyChart] = useState<Array<{ time: string; value: number }>>([]);
  const [connected, setConnected] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>(user?.fullName || 'Quản trị viên');

  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const on = areas.some((a) => a.on);

  // Sync display name with auth user
  useEffect(() => {
    if (user?.fullName) {
      setDisplayName(user.fullName);
    }
  }, [user]);

  // ── Fetch Initial Data from Backend ──────────────────────────────────────
  const refreshData = useCallback(async () => {
    try {
      const stateData = await systemService.getState();
      if (stateData) {
        setBrightness(stateData.brightness ?? 70);
        setTemperature(stateData.colorTemperature ?? 4000);
        setMode(stateData.mode ?? 0);
        if (stateData.energyToday !== undefined) {
          setEnergyKwh(stateData.energyToday);
        }

        if (stateData.areas && stateData.areas.length > 0) {
          setAreas((prev) => {
            return stateData.areas.map((backendArea: any) => {
              const matched = prev.find((p) => p.id === backendArea.code || p.id === backendArea.id);
              return {
                id: backendArea.code || backendArea.id,
                name: backendArea.name,
                lamps: backendArea.totalLights || backendArea.lamps || 30,
                lit: backendArea.power ? (backendArea.activeLights || backendArea.lit || backendArea.totalLights) : 0,
                on: backendArea.power,
                x: backendArea.mapX ?? matched?.x ?? 20,
                y: backendArea.mapY ?? matched?.y ?? 30,
                icon: (backendArea.icon || matched?.icon || 'monument') as any,
              };
            });
          });
        }

        if (stateData.alerts && stateData.alerts.length > 0) {
          setAlerts(
            stateData.alerts.map((a: any) => ({
              id: a.id,
              time: a.createdAt
                ? new Date(a.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                : '19:00',
              title: a.title,
              detail: a.message,
            }))
          );
        }
      }

      // Fetch real schedules
      try {
        const scheduleList = await scheduleService.getAll();
        if (scheduleList && scheduleList.length > 0) {
          const modeMap: Record<string, string> = {
            TOUR: 'Tham quan',
            MEMORIAL: 'Lễ tưởng niệm',
            SECURITY: 'An ninh',
            ENERGY_SAVING: 'Tiết kiệm',
          };
          setSchedulesState(
            scheduleList.map((s: ScheduleItem) => ({
              id: s.id,
              time: s.startTime,
              mode: s.sceneCode ? (modeMap[s.sceneCode] || s.sceneCode) : (s.power ? 'Bật sáng' : 'Tắt hệ thống'),
              enabled: s.enabled,
            }))
          );
        }
      } catch { /* use default schedules */ }

      // Fetch energy chart
      try {
        const chart = await energyService.getChart(24);
        if (chart && chart.length > 0) {
          setEnergyChart(chart);
        }
      } catch { /* use default mock chart */ }

      setConnected(true);
    } catch (err: any) {
      // Backend not yet authenticated or network issue
      if (err?.response?.status !== 401) {
        setConnected(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ── WebSocket Real-Time Listener ─────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('system:updated', (data: any) => {
      if (data.power !== undefined) {
        setAreas((prev) => prev.map((a) => ({ ...a, on: data.power, lit: data.power ? a.lamps : 0 })));
      }
      if (data.brightness !== undefined) setBrightness(data.brightness);
      if (data.colorTemperature !== undefined) setTemperature(data.colorTemperature);
      if (data.mode !== undefined) setMode(data.mode);
    });

    socket.on('area:updated', (data: any) => {
      setAreas((prev) =>
        prev.map((a) => {
          if (a.id === data.code || a.id === data.id) {
            const nextOn = data.power !== undefined ? data.power : a.on;
            return {
              ...a,
              on: nextOn,
              lit: nextOn ? (data.activeLights !== undefined ? data.activeLights : a.lamps) : 0,
            };
          }
          return a;
        })
      );
    });

    socket.on('alert:new', (newAlert: any) => {
      setAlerts((prev) => [
        {
          id: newAlert.id,
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          title: newAlert.title,
          detail: newAlert.message,
        },
        ...prev,
      ].slice(0, 30));
    });

    socket.on('energy:updated', (data: any) => {
      if (data.energyToday !== undefined) setEnergyKwh(data.energyToday);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('system:updated');
      socket.off('area:updated');
      socket.off('alert:new');
      socket.off('energy:updated');
    };
  }, [user]);

  // ── Helper to log locally & show feedback ────────────────────────────────
  const log = (title: string, detail: string) => {
    setAlerts((prev) => [
      {
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        title,
        detail,
      },
      ...prev,
    ].slice(0, 30));
  };

  // ── Actions with Backend Persistence & RBAC ──────────────────────────────
  const toggleSystem = async () => {
    if (!canControl()) {
      setError('Tài khoản của bạn (Người xem) không có quyền điều khiển thiết bị.');
      return;
    }
    const next = !on;
    setAreas((prev) => prev.map((a) => ({ ...a, on: next, lit: next ? a.lamps : 0 })));
    log(next ? 'Đã bật toàn bộ hệ thống' : 'Đã tắt toàn bộ hệ thống', 'Thao tác từ trung tâm điều khiển');
    if (!next) {
      window.dispatchEvent(new CustomEvent('atk:system-off'));
    }
    if (deviceConfig) {
      deviceRequest(deviceConfig, '/api/control', 'POST', { systemOn: next }).catch(() => {});
    }
    try {
      await systemService.setPower(next);
      setError('');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể gửi lệnh bật/tắt toàn bộ');
    }
  };

  const toggleArea = async (id: string) => {
    if (!canControl()) {
      setError('Tài khoản của bạn (Người xem) không có quyền điều khiển khu vực.');
      return;
    }
    const area = areas.find((a) => a.id === id);
    if (!area) return;
    const nextOn = !area.on;
    setAreas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, on: nextOn, lit: nextOn ? a.lamps : 0 } : a))
    );
    log(`Đã ${nextOn ? 'bật' : 'tắt'} ${area.name}`, 'Điều khiển khu vực');
    window.dispatchEvent(
      new CustomEvent('atk:area-toggle', {
        detail: { areaId: id, on: nextOn, areaName: area.name },
      })
    );
    if (deviceConfig) {
      deviceRequest(deviceConfig, '/api/control', 'POST', { area: { id, on: nextOn } }).catch(() => {});
    }
    try {
      await areaService.setPower(id, nextOn);
      setError('');
    } catch (e: any) {
      setError(e.response?.data?.message || `Không thể điều khiển ${area.name}`);
    }
  };

  const changeBrightness = (n: number) => {
    if (!canControl()) {
      setError('Chỉ tài khoản Vận hành mới có quyền chỉnh độ sáng.');
      return;
    }
    setBrightness(n);
    clearTimeout(timers.current['brightness']);
    timers.current['brightness'] = setTimeout(async () => {
      try {
        await systemService.setBrightness(n);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Không thể lưu độ sáng');
      }
    }, 200);
  };

  const changeTemperature = (n: number) => {
    if (!canControl()) {
      setError('Chỉ tài khoản Vận hành mới có quyền chỉnh nhiệt độ màu.');
      return;
    }
    setTemperature(n);
    clearTimeout(timers.current['temperature']);
    timers.current['temperature'] = setTimeout(async () => {
      try {
        await systemService.setColorTemperature(n);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Không thể lưu nhiệt độ màu');
      }
    }, 200);
  };

  const chooseMode = async (n: number) => {
    if (!canControl()) {
      setError('Chỉ tài khoản Vận hành mới có quyền đổi chế độ.');
      return;
    }
    setMode(n);
    setBrightness(modes[n].brightness);
    setTemperature(modes[n].temp);
    log(`Chế độ ${modes[n].name}`, modes[n].detail);
    if (n === 1) {
      window.dispatchEvent(new CustomEvent('atk:mode-memorial'));
    }
    if (deviceConfig) {
      deviceRequest(deviceConfig, '/api/control', 'POST', { mode: n }).catch(() => {});
    }
    try {
      await systemService.setMode(n);
      setError('');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể đổi chế độ');
    }
  };

  const setSchedules = (action: SetStateAction<Schedule[]>) => {
    setSchedulesState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      return next;
    });
  };

  const addSchedule = async (time: string, modeName: string) => {
    if (!canControl()) {
      setError('Chỉ tài khoản Vận hành trở lên mới có quyền thêm lịch.');
      return;
    }
    const modeCodeMap: Record<string, string> = {
      'Tham quan': 'TOUR',
      'Lễ tưởng niệm': 'MEMORIAL',
      'An ninh': 'SECURITY',
      'Tiết kiệm': 'ENERGY_SAVING',
    };
    try {
      const created = await scheduleService.create({
        name: `Lịch ${modeName} - ${time}`,
        startTime: time,
        daysOfWeek: '1,2,3,4,5,6,7',
        sceneCode: modeCodeMap[modeName] || 'TOUR',
        power: true,
        enabled: true,
      });
      setSchedulesState((prev) => [
        ...prev,
        { id: created.id, time: created.startTime, mode: modeName, enabled: true },
      ].sort((a, b) => a.time.localeCompare(b.time)));
      log(`Đã thêm lịch: ${time}`, `Chế độ: ${modeName}`);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Không thể thêm lịch');
    }
  };

  const deleteSchedule = async (id: string | number) => {
    if (!canControl()) {
      setError('Chỉ tài khoản Vận hành trở lên mới có quyền xóa lịch.');
      return;
    }
    try {
      await scheduleService.delete(String(id));
      setSchedulesState((prev) => prev.filter((s) => s.id !== id));
      log('Đã xóa lịch hoạt động', `ID: ${id}`);
    } catch (e: any) {
      // If mock ID or not in DB, remove from UI state
      setSchedulesState((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const acknowledgeAlert = async (id: string) => {
    try {
      await alertService.acknowledge(id);
      refreshData();
    } catch { /* ignore */ }
  };

  const acknowledgeAllAlerts = async () => {
    try {
      await alertService.acknowledgeAll();
      refreshData();
    } catch { /* ignore */ }
  };

  const changeDisplayName = (name: string) => {
    setDisplayName(name);
  };

  // ── ESP32 Hardware Relay Direct Connection ───────────────────────────────
  const [deviceConfig, setDeviceConfigState] = useState<DeviceConfig | null>(() => readDeviceConfig());
  const [device, setDevice] = useState<DeviceState | null>(null);
  const [live, setLive] = useState<boolean>(true);
  const [lightSensor, setLightSensor] = useState<{
    lux: number;
    isDark: boolean;
    autoEnabled: boolean;
    threshold: number;
  }>({
    lux: 180,
    isDark: false,
    autoEnabled: true,
    threshold: 150,
  });

  const setAutoLight = async (enabled: boolean) => {
    setLightSensor((prev) => ({ ...prev, autoEnabled: enabled }));
    log('Cảm biến quang', enabled ? 'Đã bật tự động bật đèn khi trời tối' : 'Đã tắt tự động theo ánh sáng');
    if (deviceConfig) {
      try {
        const res = await deviceRequest(deviceConfig, '/api/control', 'POST', { autoLight: enabled });
        setDevice(res);
        if (res.lightSensor) setLightSensor(res.lightSensor);
      } catch {}
    }
  };

  const setLuxThreshold = async (threshold: number) => {
    setLightSensor((prev) => ({ ...prev, threshold }));
    if (deviceConfig) {
      try {
        const res = await deviceRequest(deviceConfig, '/api/control', 'POST', { luxThreshold: threshold });
        setDevice(res);
        if (res.lightSensor) setLightSensor(res.lightSensor);
      } catch {}
    }
  };

  const connectDevice = async (cfg?: DeviceConfig) => {
    const configToUse = cfg || deviceConfig;
    if (!configToUse || !configToUse.url) return;
    setBusy(true);
    setError('');
    try {
      const stateData = await deviceRequest(configToUse, '/api/state', 'GET');
      storeDeviceConfig(configToUse);
      setDeviceConfigState(configToUse);
      setDevice(stateData);
      setLive(true);
      setConnected(true);

      if (stateData.lightSensor) {
        setLightSensor(stateData.lightSensor);
      }

      if (stateData.areas && stateData.areas.length === 4) {
        setAreas((prev) =>
          prev.map((a) => {
            const devArea = stateData.areas.find((d) => d.id === a.id);
            if (devArea) {
              return { ...a, on: devArea.on, lit: devArea.lit };
            }
            return a;
          })
        );
      }
      setBrightness(stateData.brightness);
      setTemperature(stateData.temperature);
      setMode(stateData.mode);
      log('Đã kết nối ESP8266', `Địa chỉ: ${configToUse.url} (Relay 4 kênh)`);
    } catch (e: any) {
      console.warn('ESP8266 direct connect warning:', e?.message);
      setLive(false);
      setConnected(false);
      throw e;
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    const saved = readDeviceConfig();
    if (saved && saved.url) {
      connectDevice(saved);
    }
  }, []);

  const disconnectDevice = () => {
    storeDeviceConfig(null);
    setDeviceConfigState(null);
    setDevice(null);
    setLive(false);
    log('Đã ngắt kết nối ESP8266', 'Chuyển về dữ liệu máy chủ');
    refreshData();
  };

  const syncDeviceTime = async () => {
    if (!deviceConfig) return;
    try {
      const epoch = Math.floor(Date.now() / 1000);
      const res = await deviceRequest(deviceConfig, '/api/time', 'POST', { epoch });
      setDevice(res);
      log('Đồng bộ giờ ESP32', 'Đã cập nhật thời gian từ thiết bị');
    } catch (e: any) {
      setError(e.message || 'Lỗi đồng bộ giờ');
    }
  };

  const setSchedulesEnabled = async (enabled: boolean) => {
    if (!deviceConfig) return;
    try {
      const res = await deviceRequest(deviceConfig, '/api/schedules', 'PUT', { enabled });
      setDevice(res);
      log('Lịch hoạt động ESP32', enabled ? 'Đã kích hoạt' : 'Đã tạm dừng');
    } catch (e: any) {
      setError(e.message || 'Lỗi cài đặt lịch ESP32');
    }
  };

  // Poll ESP32 state every 2.5 seconds when live mode is on
  useEffect(() => {
    if (!live || !deviceConfig) return;
    const interval = setInterval(async () => {
      try {
        const stateData = await deviceRequest(deviceConfig, '/api/state', 'GET');
        setDevice(stateData);
        setConnected(true);
        if (stateData.lightSensor) {
          setLightSensor(stateData.lightSensor);
        }
        if (stateData.areas && stateData.areas.length === 4) {
          setAreas((prev) =>
            prev.map((a) => {
              const devArea = stateData.areas.find((d) => d.id === a.id);
              if (devArea) {
                return { ...a, on: devArea.on, lit: devArea.lit };
              }
              return a;
            })
          );
        }
      } catch {
        setConnected(false);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [live, deviceConfig]);

  const totalLights = areas.reduce((sum, a) => sum + (a.lamps || 0), 0);
  const lit = areas.reduce((sum, a) => sum + (a.on ? (a.lit || a.lamps || 0) : 0), 0);
  // Tính toán điện năng tiêu thụ thực tế theo số đèn đang bật (168 bóng LED công suất cao)
  const calculatedEnergyKwh = Number((12.4 + (lit / (totalLights || 168)) * 18.2).toFixed(1));
  const effectiveEnergyKwh = (energyKwh !== null && energyKwh > 0) ? energyKwh : calculatedEnergyKwh;

  return {
    areas,
    on,
    brightness,
    temperature,
    mode,
    alerts,
    displayName,
    changeDisplayName,
    schedules,
    setSchedules,
    addSchedule,
    deleteSchedule,
    acknowledgeAlert,
    acknowledgeAllAlerts,
    toggleSystem,
    toggleArea,
    changeBrightness,
    changeTemperature,
    chooseMode,
    deviceConfig,
    device,
    connected,
    busy,
    error,
    clearError: () => setError(''),
    connectDevice,
    disconnectDevice,
    syncDeviceTime,
    setSchedulesEnabled,
    live,
    energyKwh: effectiveEnergyKwh,
    energyChart,
    refreshData,
    totalLights,
    lit,
    lightSensor,
    setAutoLight,
    setLuxThreshold,
  };
}

export type Lighting = ReturnType<typeof useLighting>;
