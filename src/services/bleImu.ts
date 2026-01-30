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
 * For this POC we apply a simple placeholder decode on the raw packet to
 * estimate ax/ay/az from the first few bytes, and still attach the full
 * raw byte array so the backend can refine decoding later.
 */

// Very simple placeholder decoder: interpret the first 3 little-endian
// int16 values as accelerometer axes and apply a common IMU scale factor.
// This may need to be updated once the exact WitMotion BLE packet format
// is confirmed, but is good enough to surface ax/ay/az in the demo.
function decodeAccelFromBytes(bytes: Uint8Array): { ax?: number; ay?: number; az?: number } {
  if (bytes.length < 6) {
    return {};
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const axRaw = view.getInt16(0, true);
  const ayRaw = view.getInt16(2, true);
  const azRaw = view.getInt16(4, true);

  // Typical ±2g scale for many IMUs is 16384 LSB/g; adjust as needed.
  const scale = 1 / 16384;

  return {
    //Measures acceleration in g's
    ax: axRaw * scale,
    ay: ayRaw * scale,
    az: azRaw * scale,
  };
}

//Ensures that the browser supports Web Bluetooth API
export async function collectImuSamplesForDuration(durationMs: number): Promise<IMUSample[]> {
  if (typeof navigator === 'undefined' || !navigator.bluetooth) {
    throw new Error('Web Bluetooth API is not available in this browser');
  }

  const samples: IMUSample[] = [];

  // Opens browser prompt, requests a single device matching the WitMotion naming scheme
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

    const { ax, ay, az } = decodeAccelFromBytes(bytes);

    const sample: IMUSample = {
      timestamp_ms: timestampMs,
      // Keep raw bytes so the backend can decode them later
      raw: Array.from(bytes),
      // Lightweight frontend-side decode for POC visualisation
      ax,
      ay,
      az,
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
): Promise<IMUSample[]> {
  if (!sensors.length) {
    return [];
  }

  const samples: IMUSample[] = [];

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

      const { ax, ay, az } = decodeAccelFromBytes(bytes);

      const sample: IMUSample = {
        timestamp_ms: timestampMs,
        raw: Array.from(bytes),
        ax,
        ay,
        az,
        sensor_role: role,
      };

      samples.push(sample);
    };

    characteristic.addEventListener('characteristicvaluechanged', handler);
    listeners.push({ characteristic, handler });

    try {
      await characteristic.startNotifications();
    } catch {
      // ignore start notification failure for a given sensor
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

  return samples;
}
