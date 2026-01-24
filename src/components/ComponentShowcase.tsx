import { useState } from 'react';
import { Play, AlertTriangle, CheckCircle } from 'lucide-react';

export function ComponentShowcase() {
  const [hoveredButton, setHoveredButton] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-3 gap-12">
      {/* Buttons */}
      <div>
        <div className="text-gray-500 font-mono text-xs mb-4 tracking-wider">BUTTONS</div>
        <div className="border border-[#ff0033]/20 p-8 space-y-4">
          {/* Primary Button */}
          <button
            className="w-full px-6 py-4 font-mono text-sm transition-all duration-300 border-2"
            style={{
              backgroundColor: hoveredButton === 0 ? '#ff0033' : 'transparent',
              borderColor: '#ff0033',
              color: hoveredButton === 0 ? '#ffffff' : '#ff0033'
            }}
            onMouseEnter={() => setHoveredButton(0)}
            onMouseLeave={() => setHoveredButton(null)}
          >
            PRIMARY_ACTION
          </button>

          {/* Secondary Button */}
          <button
            className="w-full px-6 py-4 font-mono text-sm transition-all duration-300 border"
            style={{
              backgroundColor: hoveredButton === 1 ? '#1a1a1a' : 'transparent',
              borderColor: '#666666',
              color: hoveredButton === 1 ? '#ffffff' : '#666666'
            }}
            onMouseEnter={() => setHoveredButton(1)}
            onMouseLeave={() => setHoveredButton(null)}
          >
            SECONDARY_ACTION
          </button>

          {/* Icon Button */}
          <button
            className="w-full px-6 py-4 font-mono text-sm transition-all duration-300 border-2 flex items-center justify-center gap-2"
            style={{
              backgroundColor: hoveredButton === 2 ? '#ff0033' : 'transparent',
              borderColor: '#ff0033',
              color: hoveredButton === 2 ? '#ffffff' : '#ff0033'
            }}
            onMouseEnter={() => setHoveredButton(2)}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <Play size={16} />
            START_SESSION
          </button>
        </div>
      </div>

      {/* Status Indicators */}
      <div>
        <div className="text-gray-500 font-mono text-xs mb-4 tracking-wider">STATUS</div>
        <div className="border border-[#ff0033]/20 p-8 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-[#ff0033]" />
            <div>
              <div className="font-mono text-xs text-white">SYSTEM_READY</div>
              <div className="font-mono text-[10px] text-gray-500">ALL_SENSORS_ACTIVE</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-[#ff0033]" />
            <div>
              <div className="font-mono text-xs text-white">ALERT_ACTIVE</div>
              <div className="font-mono text-[10px] text-gray-500">FORM_DEVIATION_DETECTED</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#ff0033] rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-[#ff0033] rounded-full animate-pulse" />
            </div>
            <div>
              <div className="font-mono text-xs text-white">RECORDING</div>
              <div className="font-mono text-[10px] text-gray-500">SESSION_IN_PROGRESS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Cards */}
      <div>
        <div className="text-gray-500 font-mono text-xs mb-4 tracking-wider">DATA CARDS</div>
        <div className="border border-[#ff0033]/20 p-8 space-y-4">
          <div className="border-l-2 border-[#ff0033] pl-4">
            <div className="font-mono text-[10px] text-gray-500 tracking-wider mb-1">TOTAL_STRIKES</div>
            <div className="text-3xl font-black text-[#ff0033]" style={{ fontFamily: 'Impact, "Anton", "Teko", sans-serif' }}>
              1,247
            </div>
          </div>

          <div className="border-l-2 border-[#666666] pl-4">
            <div className="font-mono text-[10px] text-gray-500 tracking-wider mb-1">AVG_POWER</div>
            <div className="text-3xl font-black text-white" style={{ fontFamily: 'Impact, "Anton", "Teko", sans-serif' }}>
              823 N
            </div>
          </div>

          <div className="border-l-2 border-[#ff0033] pl-4">
            <div className="font-mono text-[10px] text-gray-500 tracking-wider mb-1">SESSION_TIME</div>
            <div className="text-3xl font-black text-[#ff0033]" style={{ fontFamily: 'Impact, "Anton", "Teko", sans-serif' }}>
              47:32
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
