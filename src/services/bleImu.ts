//Loads type definitions for the Web Bluetooth API
/// <reference types="web-bluetooth" />

import { IMUSample } from './attemptService';

// UUIDs for the WitMotion IMU service and characteristic
export const FFE5_SERVICE_UUID = '0000ffe5-0000-1000-8000-00805f9a34fb';
export const FFE4_CHAR_UUID = '0000ffe4-0000-1000-8000-00805f9a34fb';

export interface BleSensorConnection {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer;
}

/**
 * Connect to a single WitMotion IMU over Web Bluetooth and stream raw
 * notification bytes into IMUSample objects for a fixed duration.
 *
 * We treat the raw WT901 packet bytes as the source of truth and also
 * decode accel/gyro for lightweight frontend visualisation.
 */

const WT901_HEADER = 0x55;
const WT901_TYPE_ACCEL_GYRO = 0x61;
const WT901_PACKET_LEN = 20;

function extractWt901Packet(bytes: Uint8Array): Uint8Array | null {
  // Most commonly notifications are exactly one 20-byte packet.
  if (
    bytes.length === WT901_PACKET_LEN &&
    bytes[0] === WT901_HEADER &&
    bytes[1] === WT901_TYPE_ACCEL_GYRO
  ) {
    return bytes;
  }

  // Otherwise, try to find a 0x55 0x61 frame within the notification.
  for (let i = 0; i + WT901_PACKET_LEN <= bytes.length; i += 1) {
    if (bytes[i] === WT901_HEADER && bytes[i + 1] === WT901_TYPE_ACCEL_GYRO) {
      return bytes.slice(i, i + WT901_PACKET_LEN);
    }
  }

  return null;
}

function decodeWt901AccelGyroFromPacket(packet: Uint8Array): {
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
} {
  // WT901 0x55 0x61 frame layout (little-endian int16) starting at offset 2:
  // ax, ay, az, gx, gy, gz
  const view = new DataView(packet.buffer, packet.byteOffset, packet.byteLength);

  const axRaw = view.getInt16(2, true);
  const ayRaw = view.getInt16(4, true);
  const azRaw = view.getInt16(6, true);

  const gxRaw = view.getInt16(8, true);
  const gyRaw = view.getInt16(10, true);
  const gzRaw = view.getInt16(12, true);

  // User-confirmed: accel range is ±16g.
  // WT901 family commonly uses full-scale mapping: raw/32768 * range.
  const accelScale = 16 / 32768;

  // Common WT901 gyro scale: raw/32768 * 2000 (deg/s).
  const gyroScale = 2000 / 32768;

  return {
    ax: axRaw * accelScale,
    ay: ayRaw * accelScale,
    az: azRaw * accelScale,
    gx: gxRaw * gyroScale,
    gy: gyRaw * gyroScale,
    gz: gzRaw * gyroScale,
  };
}

//Ensures that the browser supports Web Bluetooth API
export async function collectImuSamplesForDuration(durationMs: number): Promise<IMUSample[]> {
  if (typeof navigator === 'undefined' || !navigator.bluetooth) {
    throw new Error('Web Bluetooth API is not available in this browser');
  }

  const samples: IMUSample[] = [];

  // Opens browser prompt, requests a single device matching the WitMotion naming scheme
  // TODO: Update the namePrefix filters below if the supplier changes the BLE advertised names.
  const device = await navigator.bluetooth.requestDevice({
    filters: [
      { namePrefix: 'WT' },
      { namePrefix: 'WitMotion' },
    ],
    optionalServices: [FFE5_SERVICE_UUID],
  });

  const server = await device.gatt!.connect();
  const service = await server.getPrimaryService(FFE5_SERVICE_UUID);
  const characteristic = await service.getCharacteristic(FFE4_CHAR_UUID);

  await characteristic.startNotifications();

  const onValueChanged = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const value = target.value;
    if (!value) return;

    const bytes = new Uint8Array(value.buffer);
    const timestampMs = Date.now();

    const packet = extractWt901Packet(bytes);
    const decoded = packet ? decodeWt901AccelGyroFromPacket(packet) : undefined;

    const sample: IMUSample = {
      timestamp_ms: timestampMs,
      // Keep raw packet bytes so the backend can decode exactly what we decoded.
      raw: Array.from(packet ?? bytes),
      // Lightweight frontend-side decode for visualisation.
      ax: decoded?.ax,
      ay: decoded?.ay,
      az: decoded?.az,
      gx: decoded?.gx,
      gy: decoded?.gy,
      gz: decoded?.gz,
    };

    samples.push(sample);
  };

  characteristic.addEventListener('characteristicvaluechanged', onValueChanged);

  // Collect for the specified duration, then stop notifications and disconnect
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, durationMs);
  });

  try {
    characteristic.removeEventListener('characteristicvaluechanged', onValueChanged);
    await characteristic.stopNotifications();
  } catch {
    // Best-effort cleanup only
  }

  try {
    if (device.gatt && device.gatt.connected) {
      device.gatt.disconnect();
    }
  } catch {
    // Ignore disconnect errors
  }

  return samples;
}

export async function collectMultiImuSamplesForDuration(
  sensors: { role: string; characteristic: BluetoothRemoteGATTCharacteristic }[],
  durationMs: number
): Promise<{ samples: IMUSample[]; sampleCountByRole: Record<string, number> }> {
  if (!sensors.length) {
    return { samples: [], sampleCountByRole: {} };
  }

  const samples: IMUSample[] = [];
  const sampleCountByRole: Record<string, number> = {};
  for (const { role } of sensors) {
    sampleCountByRole[role] = 0;
  }

  const listeners: {
    characteristic: BluetoothRemoteGATTCharacteristic;
    handler: (event: Event) => void;
  }[] = [];

  for (const { role, characteristic } of sensors) {
    const handler = (event: Event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      const value = target.value;
      if (!value) return;

      const bytes = new Uint8Array(value.buffer);
      const timestampMs = Date.now();

      const packet = extractWt901Packet(bytes);
      const decoded = packet ? decodeWt901AccelGyroFromPacket(packet) : undefined;

      const sample: IMUSample = {
        timestamp_ms: timestampMs,
        raw: Array.from(packet ?? bytes),
        ax: decoded?.ax,
        ay: decoded?.ay,
        az: decoded?.az,
        gx: decoded?.gx,
        gy: decoded?.gy,
        gz: decoded?.gz,
        sensor_role: role,
      };

      samples.push(sample);
      sampleCountByRole[role] = (sampleCountByRole[role] || 0) + 1;
    };

    characteristic.addEventListener('characteristicvaluechanged', handler);
    listeners.push({ characteristic, handler });

    try {
      await characteristic.startNotifications();
    } catch (err) {
      console.error(`[bleImu] startNotifications failed for ${role}:`, err);
    }
  }

  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), durationMs);
  });

  for (const { characteristic, handler } of listeners) {
    try {
      characteristic.removeEventListener('characteristicvaluechanged', handler);
      await characteristic.stopNotifications();
    } catch {
      // best-effort cleanup
    }
  }

  return { samples, sampleCountByRole };
}
