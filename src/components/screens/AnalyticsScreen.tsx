import { Activity } from 'lucide-react';
import { SessionAnalytics } from '../../types';

interface AnalyticsScreenProps {
  analytics?: SessionAnalytics; // Optional: will use mock data if not provided
}

export function AnalyticsScreen({ analytics }: AnalyticsScreenProps) {
  // Use provided analytics or fallback to mock data for UI development
  const sessionData: SessionAnalytics = analytics || {
    total_strikes: 12405,
    avg_power: 840,
    neural_sync: 98.7,
    heart_rate: 145,
    duration: 2852, // 47:32 in seconds
    calories_burned: 342,
  };

  const stats = [
    { 
      label: 'TOTAL_STRIKES', 
      value: sessionData.total_strikes.toLocaleString(), 
      unit: '', 
      isLive: true 
    },
    { 
      label: 'AVG_POWER', 
      value: sessionData.avg_power.toString(), 
      unit: 'PSI', 
      isLive: false 
    },
    { 
      label: 'SPEED', 
      value: (sessionData.duration / sessionData.total_strikes).toFixed(2), 
      unit: 's', 
      isLive: true 
    },
    { 
      label: 'ACCURACY', 
      value: '94', 
      unit: '%', 
      isLive: false 
    },
  ];

  return (
    <div className="h-screen overflow-y-auto px-16 py-16">
      {/* Header */}
      <div className="mb-16 max-w-6xl mx-auto">
        <div
          className="inline-block px-6 py-2 mb-8"
          style={{
            border: '1px solid #ff003c',
            background: 'rgba(255, 0, 60, 0.05)',
          }}
        >
          <span className="font-mono text-[10px] tracking-wider text-[#ff003c]">
            REAL_TIME_COMBAT_METRICS
          </span>
        </div>
        <h1 
          className="text-[8rem] leading-[0.85] font-black tracking-tighter text-white uppercase"
          style={{ fontFamily: 'Impact, "Anton", "Teko", sans-serif' }}
        >
          ANALYTICS
        </h1>
      </div>

      {/* 4-Column Grid for Desktop */}
      <div className="grid grid-cols-4 gap-6 max-w-6xl mx-auto mb-16">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="border p-8 relative transition-all duration-300 hover:scale-105"
            style={{
              backgroundColor: 'rgba(10, 10, 10, 0.8)',
              backdropFilter: 'blur(10px)',
              borderColor: stat.isLive ? '#ff003c' : '#1a1a1a',
              borderWidth: stat.isLive ? '2px' : '1px',
              boxShadow: stat.isLive ? '0 0 24px rgba(255, 0, 60, 0.2)' : 'none',
            }}
          >
            {/* Live Indicator */}
            {stat.isLive && (
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#ff003c] rounded-full animate-pulse" />
                <Activity size={12} className="text-[#ff003c]" />
              </div>
            )}

            {/* Label */}
            <div className="font-mono text-[9px] text-gray-500 tracking-wider mb-4">
              {stat.label}
            </div>

            {/* Value */}
            <div className="flex items-baseline gap-2">
              <span 
                className="font-black"
                style={{ 
                  fontFamily: 'Impact, "Anton", "Teko", sans-serif',
                  fontSize: '3.5rem',
                  lineHeight: '0.9',
                  color: stat.isLive ? '#ff003c' : '#ffffff',
                }}
              >
                {stat.value}
              </span>
              {stat.unit && (
                <span className="font-mono text-sm text-gray-500">
                  {stat.unit}
                </span>
              )}
            </div>

            {/* Bottom accent line */}
            <div 
              className="mt-6 h-[1px] bg-gradient-to-r from-transparent via-current to-transparent"
              style={{
                color: stat.isLive ? '#ff003c' : '#1a1a1a',
              }}
            />
          </div>
        ))}
      </div>

      {/* Session Info Panel */}
      <div 
        className="border p-8 max-w-6xl mx-auto"
        style={{
          background: 'rgba(10, 10, 10, 0.8)',
          backdropFilter: 'blur(10px)',
          borderColor: '#1a1a1a',
        }}
      >
        <div className="font-mono text-[10px] text-gray-500 tracking-wider mb-6">
          SESSION_SUMMARY
        </div>
        <div className="grid grid-cols-3 gap-8">
          <div>
            <div className="font-mono text-[9px] text-gray-500 tracking-wider mb-2">
              SESSION_DURATION
            </div>
            <div 
              className="text-4xl font-black"
              style={{ 
                fontFamily: 'Impact, "Anton", "Teko", sans-serif',
                color: '#ffffff',
              }}
            >
              {Math.floor(sessionData.duration / 60)}:{(sessionData.duration % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div>
            <div className="font-mono text-[9px] text-gray-500 tracking-wider mb-2">
              CALORIES_BURNED
            </div>
            <div 
              className="text-4xl font-black"
              style={{ 
                fontFamily: 'Impact, "Anton", "Teko", sans-serif',
                color: '#ffffff',
              }}
            >
              {sessionData.calories_burned || 0}
            </div>
          </div>
          <div>
            <div className="font-mono text-[9px] text-gray-500 tracking-wider mb-2">
              NEURAL_SYNC
            </div>
            <div 
              className="text-4xl font-black"
              style={{ 
                fontFamily: 'Impact, "Anton", "Teko", sans-serif',
                color: '#ff003c',
              }}
            >
              {sessionData.neural_sync.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}