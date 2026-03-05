import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import {
  collectMultiImuSamplesForDuration,
  FFE5_SERVICE_UUID,
  FFE4_CHAR_UUID,
} from '../../services/bleImu';
import { uploadTrainingRecording, fetchTrainingRecordings } from '../../services/trainingService';

// ──── DEV MOCK: set to true to test without real BLE hardware ────
const DEV_MOCK_BLE = false;
// When true:
//   - Tapping a sensor card fakes a connection instantly
//   - Run `window.__simulateDisconnect('left_wrist')` in the console to fire a disconnect
//   - Recording returns fake samples (with one sensor missing data if it's disconnected)
// ──────────────────────────────────────────────────────────────────

interface TrainDrillScreenProps {
  onBack: () => void;
}

type SensorRole = 'left_wrist' | 'right_wrist' | 'left_ankle' | 'right_ankle';

type SensorInfo = {
  connected: boolean;
  disconnectedAfterPairing: boolean;
  label: string;
  deviceId?: string;
  device?: BluetoothDevice;
  server?: BluetoothRemoteGATTServer;
  characteristic?: BluetoothRemoteGATTCharacteristic;
};

const DURATION_OPTIONS = [
  { label: '1.5s', ms: 1500 },
  { label: '4s', ms: 4000 },
  { label: '8s', ms: 8000 },
] as const;

export function TrainDrillScreen({ onBack }: TrainDrillScreenProps) {
  const [drillName, setDrillName] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedDurationMs, setSelectedDurationMs] = useState(4000);

  const [sensorStatus, setSensorStatus] = useState<Record<SensorRole, SensorInfo>>({
    left_wrist: { connected: false, disconnectedAfterPairing: false, label: 'LEFT WRIST' },
    right_wrist: { connected: false, disconnectedAfterPairing: false, label: 'RIGHT WRIST' },
    left_ankle: { connected: false, disconnectedAfterPairing: false, label: 'LEFT ANKLE' },
    right_ankle: { connected: false, disconnectedAfterPairing: false, label: 'RIGHT ANKLE' },
  });

  const [assignedDevices, setAssignedDevices] = useState<Record<string, SensorRole>>({});

  const disconnectCleanupRef = useRef<Record<string, () => void>>({});

  const handleDisconnect = useCallback((role: SensorRole) => {
    setSensorStatus((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        connected: false,
        disconnectedAfterPairing: true,
        device: undefined,
        server: undefined,
        characteristic: undefined,
      },
    }));
  }, []);

  useEffect(() => {
    return () => {
      Object.values(disconnectCleanupRef.current).forEach((cleanup) => cleanup());
      disconnectCleanupRef.current = {};
    };
  }, []);

  // Expose disconnect simulator to the browser console when mocking
  useEffect(() => {
    if (!DEV_MOCK_BLE) return;
    (window as any).__simulateDisconnect = (role: SensorRole) => {
      console.log(`[DEV] simulating disconnect for ${role}`);
      handleDisconnect(role);
    };
    return () => { delete (window as any).__simulateDisconnect; };
  }, [handleDisconnect]);

  const handleConnectSensor = async (role: SensorRole) => {
    // ── DEV MOCK path ──
    if (DEV_MOCK_BLE) {
      const fakeId = `MOCK_${role.toUpperCase()}`;
      setSensorStatus((prev) => ({
        ...prev,
        [role]: {
          connected: true,
          disconnectedAfterPairing: false,
          label: fakeId,
          deviceId: fakeId,
          characteristic: {
            addEventListener: () => {},
            removeEventListener: () => {},
            startNotifications: () => Promise.resolve(),
            stopNotifications: () => Promise.resolve(),
          } as unknown as BluetoothRemoteGATTCharacteristic,
        },
      }));
      setAssignedDevices((prev) => ({ ...prev, [fakeId]: role }));
      setStatusMessage(null);
      setErrorMessage(null);
      return;
    }

    // ── Real BLE path ──
    try {
      if (typeof navigator === 'undefined' || !navigator.bluetooth) {
        setErrorMessage('Web Bluetooth is not available in this browser.');
        return;
      }

      setStatusMessage(`Connect ${sensorStatus[role].label} IMU in the browser prompt...`);

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

      const id = device.id || 'UNKNOWN_ID';
      const name = id;

      // Remove previous disconnect listener for this role if any
      if (disconnectCleanupRef.current[role]) {
        disconnectCleanupRef.current[role]();
        delete disconnectCleanupRef.current[role];
      }

      // Register disconnect listener
      const onDisconnected = () => handleDisconnect(role);
      device.addEventListener('gattserverdisconnected', onDisconnected);
      disconnectCleanupRef.current[role] = () => {
        device.removeEventListener('gattserverdisconnected', onDisconnected);
      };

      setAssignedDevices((prev) => {
        const existingRole = prev[id];
        if (existingRole && existingRole !== role) {
          setErrorMessage(`This sensor is already assigned to ${existingRole.replace('_', ' ')}.`);
          setStatusMessage(null);
          return prev;
        }

        const next = { ...prev, [id]: role };

        setSensorStatus((prevStatus) => ({
          ...prevStatus,
          [role]: {
            connected: true,
            disconnectedAfterPairing: false,
            label: name,
            deviceId: id,
            device,
            server,
            characteristic,
          },
        }));

        setStatusMessage(null);
        setErrorMessage(null);

        return next;
      });
    } catch (error) {
      console.error('Sensor connect failed', error);
      setErrorMessage('Failed to connect sensor. Try again.');
      setStatusMessage(null);
    }
  };

  const handleRecord = async () => {
    if (isRecording) return;

    if (!drillName.trim()) {
      setErrorMessage('Please enter a drill name.');
      return;
    }

    setIsRecording(true);
    setErrorMessage(null);
    setUploadSuccess(false);
    setStatusMessage('recording raw data');

    try {
      const activeSensors = (Object.entries(sensorStatus) as [SensorRole, SensorInfo][])
        .filter(([, info]) => info.connected && info.characteristic)
        .map(([role, info]) => ({
          role,
          characteristic: info.characteristic as BluetoothRemoteGATTCharacteristic,
        }));

      if (activeSensors.length < 4) {
        throw new Error('All 4 sensors must be connected before recording.');
      }

      const { samples, sampleCountByRole } = await collectMultiImuSamplesForDuration(activeSensors, selectedDurationMs);

      if (!samples.length) {
        throw new Error('No IMU samples collected from BLE devices');
      }

      // Post-recording validation: ensure every sensor produced data
      const missingSensors = activeSensors
        .filter(({ role }) => !sampleCountByRole[role] || sampleCountByRole[role] === 0)
        .map(({ role }) => role);

      if (missingSensors.length > 0) {
        throw new Error(
          `No data received from sensor(s): ${missingSensors.join(', ')}. They may have disconnected during recording.`
        );
      }

      console.log('[TrainDrill] collected samples:', samples.length, 'duration:', selectedDurationMs, 'by role:', sampleCountByRole);
      console.log('[TrainDrill] first 3 samples:', samples.slice(0, 3));

      setStatusMessage('uploading to database...');

      const sensorRoles = activeSensors.map((s) => s.role);

      const result = await uploadTrainingRecording({
        drill_name: drillName.trim(),
        imu_data: samples,
        recording_duration_ms: selectedDurationMs,
        sensor_roles: sensorRoles,
      });

      console.log('[TrainDrill] upload complete. Row id:', result.id, 'created_at:', result.created_at);
      console.log('[TrainDrill] reading back all recordings...');
      await fetchTrainingRecordings();

      setUploadSuccess(true);
      setStatusMessage(null);
    } catch (error) {
      console.error('Training recording failed:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to record training data.'
      );
      setStatusMessage(null);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto pb-16 animate-slide-in">
      <header className="px-16 pt-12 pb-8 border-b border-[#ff003c]/20">
        <button
          onClick={onBack}
          className="flex items-center gap-3 mb-8 text-[#ff003c] hover:text-white transition-all duration-300 group"
        >
          <ChevronLeft
            size={24}
            className="transition-transform duration-300 group-hover:-translate-x-1"
          />
          <span className="font-mono text-sm tracking-wider">BACK_TO_TRAINING</span>
        </button>
        <h1
          className="text-[6rem] leading-[0.85] font-black tracking-tighter uppercase"
          style={{
            fontFamily: 'Impact, "Anton", "Teko", sans-serif',
            color: '#ff003c',
            textShadow: '0 0 30px rgba(255, 0, 60, 0.4)',
          }}
        >
          TRAIN DRILL
        </h1>
      </header>

      <div className="max-w-2xl mx-auto px-16 pt-14 pb-24">
        {/* Drill Name Input */}
        <div className="mb-12">
          <label className="font-mono text-[10px] text-gray-500 tracking-wider block mb-3">
            DRILL_NAME
          </label>
          <input
            type="text"
            value={drillName}
            onChange={(e) => setDrillName(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isRecording}
            className="w-full px-5 py-4 font-mono text-sm text-white outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#111111',
              border: 'none',
              borderBottom: isFocused ? '2px solid #FF003C' : '2px solid transparent',
            }}
            placeholder="ENTER_DRILL_NAME"
          />
        </div>

        {/* Sensor Connect Buttons (2x2 grid) */}
        <div
          className="mb-12 pt-10"
          style={{ borderTop: '1px solid rgba(255, 0, 60, 0.1)' }}
        >
          <span className="font-mono text-[10px] text-gray-500 tracking-wider block mb-4">
            SENSOR_CONNECTIONS
          </span>
          <div className="grid grid-cols-2 gap-4">
            {(
              ['left_wrist', 'right_wrist', 'left_ankle', 'right_ankle'] as SensorRole[]
            ).map((role) => {
              const sensor = sensorStatus[role];
              const isConnected = sensor.connected;
              const wasLost = !isConnected && sensor.disconnectedAfterPairing;

              const borderColor = isConnected ? '#22c55e' : wasLost ? '#f59e0b' : '#4b5563';
              const bgColor = isConnected
                ? 'rgba(34, 197, 94, 0.05)'
                : wasLost
                  ? 'rgba(245, 158, 11, 0.06)'
                  : 'rgba(10, 10, 10, 0.6)';
              const textColor = isConnected ? '#22c55e' : wasLost ? '#f59e0b' : '#9ca3af';
              const labelColor = isConnected ? '#22c55e' : wasLost ? '#f59e0b' : '#666';

              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleConnectSensor(role)}
                  disabled={isRecording}
                  className="border text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                  style={{
                    borderColor,
                    background: bgColor,
                    padding: '20px',
                    minHeight: '88px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  onMouseEnter={(e) => {
                    if (!isConnected && !wasLost) {
                      e.currentTarget.style.borderColor = '#ff003c';
                      e.currentTarget.style.background = 'rgba(255, 0, 60, 0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isConnected && !wasLost) {
                      e.currentTarget.style.borderColor = '#4b5563';
                      e.currentTarget.style.background = 'rgba(10, 10, 10, 0.6)';
                    } else if (wasLost) {
                      e.currentTarget.style.borderColor = '#f59e0b';
                      e.currentTarget.style.background = 'rgba(245, 158, 11, 0.06)';
                    }
                  }}
                >
                  <span
                    className="font-mono text-[9px] tracking-widest block"
                    style={{ color: labelColor }}
                  >
                    {role.replace('_', ' ').toUpperCase()}
                  </span>
                  <span
                    className="font-mono text-xs tracking-wider block mt-2"
                    style={{ color: textColor }}
                  >
                    {isConnected
                      ? `${sensor.deviceId || sensor.label} ✓`
                      : wasLost
                        ? 'CONNECTION_LOST — TAP_TO_RECONNECT'
                        : 'TAP TO CONNECT'}
                  </span>
                  {isConnected && (
                    <div
                      className="mt-3 h-[2px] w-full"
                      style={{ background: 'linear-gradient(90deg, #22c55e, transparent)' }}
                    />
                  )}
                  {wasLost && (
                    <div
                      className="mt-3 h-[2px] w-full circuit-pulse-amber"
                      style={{ background: 'linear-gradient(90deg, #f59e0b, transparent)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recording Duration Selector */}
        <div
          className="mb-14 pt-10"
          style={{ borderTop: '1px solid rgba(255, 0, 60, 0.1)' }}
        >
          <span className="font-mono text-[10px] text-gray-500 tracking-wider block mb-4">
            RECORDING_DURATION
          </span>
          <div className="grid grid-cols-3 gap-4">
            {DURATION_OPTIONS.map((opt) => {
              const isSelected = selectedDurationMs === opt.ms;
              return (
                <button
                  key={opt.ms}
                  type="button"
                  onClick={() => setSelectedDurationMs(opt.ms)}
                  disabled={isRecording}
                  className="border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center"
                  style={{
                    borderColor: isSelected ? '#ff003c' : '#4b5563',
                    background: isSelected ? 'rgba(255, 0, 60, 0.08)' : 'rgba(10, 10, 10, 0.6)',
                    boxShadow: isSelected ? '0 0 16px rgba(255, 0, 60, 0.2)' : 'none',
                    padding: '20px 16px',
                    minHeight: '88px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#ff003c';
                      e.currentTarget.style.background = 'rgba(255, 0, 60, 0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = '#4b5563';
                      e.currentTarget.style.background = 'rgba(10, 10, 10, 0.6)';
                    }
                  }}
                >
                  <span
                    className="font-mono text-xl font-bold tracking-tight block"
                    style={{ color: isSelected ? '#ff003c' : '#9ca3af' }}
                  >
                    {opt.label}
                  </span>
                  <span
                    className="font-mono text-[8px] tracking-widest mt-1.5 block uppercase"
                    style={{ color: isSelected ? 'rgba(255, 0, 60, 0.6)' : '#555' }}
                  >
                    {opt.ms >= 8000 ? 'EXTENDED' : opt.ms >= 4000 ? 'STANDARD' : 'QUICK'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Record Button */}
        <div className="pt-10" style={{ borderTop: '1px solid rgba(255, 0, 60, 0.1)' }}>
          <button
            onClick={handleRecord}
            disabled={!drillName.trim() || isRecording}
            className="w-full border-2 py-5 font-mono text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: '#ff003c',
              color: '#ff003c',
              background: 'transparent',
              boxShadow: '0 0 20px rgba(255, 0, 60, 0.4)',
            }}
            onMouseEnter={(e) => {
              if (drillName.trim() && !isRecording) {
                e.currentTarget.style.background = '#ff003c';
                e.currentTarget.style.color = '#000000';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#ff003c';
            }}
          >
            {isRecording ? 'RECORDING_RAW_DATA' : 'RECORD'}
          </button>
        </div>

        {/* Feedback Messages */}
        <div className="mt-8 space-y-4">
          {errorMessage && (
            <div
              className="font-mono text-[10px] text-[#ff003c] tracking-wider py-3 px-4"
              style={{ background: 'rgba(255, 0, 60, 0.08)' }}
            >
              {errorMessage}
            </div>
          )}

          {statusMessage && (
            <div className="font-mono text-[10px] text-gray-400 tracking-wider py-3">
              {statusMessage}
            </div>
          )}

          {uploadSuccess && (
            <div
              className="font-mono text-[10px] tracking-wider py-3 px-4"
              style={{
                border: '1px solid #22c55e',
                color: '#22c55e',
                background: 'rgba(34, 197, 94, 0.08)',
              }}
            >
              uploaded data to database!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
