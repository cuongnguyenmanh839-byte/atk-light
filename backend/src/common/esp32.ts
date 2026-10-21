import { Logger } from '@nestjs/common';

const logger = new Logger('Esp32Bridge');

let configuredEsp32Url = process.env.ESP32_URL || 'http://192.168.4.1';
let configuredEsp32Token = process.env.ESP32_TOKEN || 'atk2026';

export function getEsp32Config() {
  return { url: configuredEsp32Url, token: configuredEsp32Token };
}

export function setEsp32Config(url: string, token?: string) {
  configuredEsp32Url = url ? url.trim().replace(/\/+$/, '') : '';
  if (token) configuredEsp32Token = token.trim();
  logger.log(`Updated ESP32 endpoint: ${configuredEsp32Url}`);
}

export async function forwardToEsp32(command: {
  systemOn?: boolean;
  area?: { id: string; on: boolean };
  mode?: number;
  brightness?: number;
}): Promise<boolean> {
  if (!configuredEsp32Url) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${configuredEsp32Url}/api/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${configuredEsp32Token}`,
      },
      body: JSON.stringify(command),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      logger.log(`Relay command dispatched to ESP32: ${JSON.stringify(command)}`);
      return true;
    }
  } catch {
    // Non-blocking fallback: ESP32 might be in AP mode or offline
  }
  return false;
}
