import { useState, useEffect, useCallback, useRef } from 'react';
import {
  esp32RgbService,
  getEsp32RgbUrl,
  setEsp32RgbUrl,
} from '../services/esp32Rgb.service';
import type { RgbDeviceState, RgbMode } from '../services/esp32Rgb.service';

export function useRgbLed() {
  const [rgbState, setRgbState] = useState<RgbDeviceState | null>(null);
  const [url, setUrlState] = useState<string>(getEsp32RgbUrl());
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await esp32RgbService.getStatus();
      if (isMounted.current) {
        setRgbState(data);
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    fetchStatus();

    const interval = setInterval(() => {
      fetchStatus();
    }, 2500);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchStatus]);

  const updateUrl = useCallback((newUrl: string) => {
    setEsp32RgbUrl(newUrl);
    setUrlState(newUrl);
    fetchStatus();
  }, [fetchStatus]);

  const setMode = useCallback(async (mode: RgbMode) => {
    setRgbState((prev) => (prev ? { ...prev, mode } : prev));
    setLoading(true);
    await esp32RgbService.setMode(mode);
    setLoading(false);
    fetchStatus();
  }, [fetchStatus]);

  const setColor = useCallback(async (r: number, g: number, b: number) => {
    setRgbState((prev) => (prev ? { ...prev, r, g, b, mode: 'solid' } : prev));
    setLoading(true);
    await esp32RgbService.setColor(r, g, b);
    setLoading(false);
    fetchStatus();
  }, [fetchStatus]);

  const setBrightness = useCallback(async (val: number) => {
    setRgbState((prev) => (prev ? { ...prev, bri: val } : prev));
    await esp32RgbService.setBrightness(val);
  }, []);

  const setSpeed = useCallback(async (val: number) => {
    setRgbState((prev) => (prev ? { ...prev, speed: val } : prev));
    await esp32RgbService.setSpeed(val);
  }, []);

  const setNumLeds = useCallback(async (count: number) => {
    setRgbState((prev) => (prev ? { ...prev, numLeds: count } : prev));
    await esp32RgbService.setNumLeds(count);
  }, []);

  const invertSensor = useCallback(async (type: 'light' | 'sound') => {
    await esp32RgbService.invertSensor(type);
    fetchStatus();
  }, [fetchStatus]);

  const setTimer = useCallback(async (minutes: number) => {
    await esp32RgbService.setTimer(minutes);
    fetchStatus();
  }, [fetchStatus]);

  const setSchedule = useCallback(
    async (en: boolean, onH: number, onM: number, offH: number, offM: number) => {
      await esp32RgbService.setSchedule(en, onH, onM, offH, offM);
      fetchStatus();
    },
    [fetchStatus]
  );

  return {
    rgbState,
    connected: rgbState?.connected ?? false,
    url,
    loading,
    refresh: fetchStatus,
    updateUrl,
    setMode,
    setColor,
    setBrightness,
    setSpeed,
    setNumLeds,
    invertSensor,
    setTimer,
    setSchedule,
  };
}

export type RgbLedHook = ReturnType<typeof useRgbLed>;
