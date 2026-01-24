import { ChevronLeft } from 'lucide-react';
import { DrillDetail } from '../../types';

interface ActiveDrillScreenProps {
  drill: DrillDetail;
  onBack: () => void;
}

export function ActiveDrillScreen({ drill, onBack }: ActiveDrillScreenProps) {
  return (
    <div className="h-screen overflow-y-auto pb-16 animate-slide-in">
      {/* Header with Back Button */}
      <header className="px-16 pt-12 pb-8 border-b border-[#ff003c]/20">
        <button 
          onClick={onBack}
          className="flex items-center gap-3 mb-8 text-[#ff003c] hover:text-white transition-all duration-300 group"
        >
          <ChevronLeft 
            size={24} 
            className="transition-transform duration-300 group-hover:-translate-x-1"
          />
          <span className="font-mono text-sm tracking-wider">BACK_TO_ROADMAP</span>
        </button>
        <h1 
          className="text-[6rem] leading-[0.85] font-black tracking-tighter uppercase mb-6"
          style={{ 
            fontFamily: 'Impact, "Anton", "Teko", sans-serif',
            color: '#ff003c',
            textShadow: '0 0 30px rgba(255, 0, 60, 0.4)',
          }}
        >
          {drill.overview.title}
        </h1>
        <div className="flex items-center gap-6">
          <div>
            <span className="font-mono text-[9px] text-gray-500 tracking-wider block mb-1">CATEGORY</span>
            <span className="font-mono text-sm text-white">{drill.overview.category}</span>
          </div>
          <div className="w-[1px] h-8 bg-[#1a1a1a]" />
          <div>
            <span className="font-mono text-[9px] text-gray-500 tracking-wider block mb-1">DIFFICULTY</span>
            <span className="font-mono text-sm text-[#ff003c]">{drill.difficulty}</span>
          </div>
          <div className="w-[1px] h-8 bg-[#1a1a1a]" />
          <div>
            <span className="font-mono text-[9px] text-gray-500 tracking-wider block mb-1">SETS</span>
            <span className="font-mono text-sm text-white">{drill.sets}</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-16 py-12">
        <div className="grid grid-cols-2 gap-12">
          {/* Left Column: Biometric Wireframe */}
          <div>
            <div className="mb-6">
              <span className="font-mono text-[10px] text-gray-500 tracking-wider">
                FULL_BODY_SCAN
              </span>
            </div>
            <div 
              className="border p-8 relative"
              style={{
                background: 'rgba(10, 10, 10, 0.8)',
                backdropFilter: 'blur(10px)',
                borderColor: '#ff003c',
                borderWidth: '1px',
                boxShadow: '0 0 30px rgba(255, 0, 60, 0.15)',
              }}
            >
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#ff003c] rounded-full animate-pulse" />
                <span className="font-mono text-[9px] text-[#ff003c] tracking-wider">
                  ACTIVE
                </span>
              </div>
              
              {/* Body Wireframe */}
              <svg viewBox="0 0 400 600" className="w-full h-auto">
                {/* Head */}
                <ellipse cx="200" cy="60" rx="40" ry="50" fill="none" stroke="#ff003c" strokeWidth="1" opacity="0.6" />
                <circle cx="200" cy="60" r="35" fill="none" stroke="#ff003c" strokeWidth="1" opacity="0.3" />
                
                {/* Neck */}
                <line x1="200" y1="110" x2="200" y2="140" stroke="#ff003c" strokeWidth="2" />
                
                {/* Torso */}
                <rect x="160" y="140" width="80" height="120" fill="none" stroke="#ff003c" strokeWidth="2" />
                <line x1="160" y1="180" x2="240" y2="180" stroke="#ff003c" strokeWidth="1" opacity="0.4" />
                <line x1="160" y1="220" x2="240" y2="220" stroke="#ff003c" strokeWidth="1" opacity="0.4" />
                
                {/* Left Arm */}
                <line x1="160" y1="140" x2="100" y2="200" stroke="#ff003c" strokeWidth="2" />
                <line x1="100" y1="200" x2="80" y2="280" stroke="#ff003c" strokeWidth="2" />
                <circle cx="100" cy="200" r="8" fill="none" stroke="#ff003c" strokeWidth="2">
                  <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
                </circle>
                
                {/* Right Arm */}
                <line x1="240" y1="140" x2="300" y2="200" stroke="#ff003c" strokeWidth="2" />
                <line x1="300" y1="200" x2="320" y2="280" stroke="#ff003c" strokeWidth="2" />
                <circle cx="300" cy="200" r="8" fill="none" stroke="#ff003c" strokeWidth="2">
                  <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
                </circle>
                
                {/* Pelvis */}
                <line x1="160" y1="260" x2="180" y2="320" stroke="#ff003c" strokeWidth="2" />
                <line x1="240" y1="260" x2="220" y2="320" stroke="#ff003c" strokeWidth="2" />
                
                {/* Left Leg */}
                <line x1="180" y1="320" x2="170" y2="450" stroke="#ff003c" strokeWidth="2" />
                <line x1="170" y1="450" x2="160" y2="560" stroke="#ff003c" strokeWidth="2" />
                <circle cx="170" cy="450" r="8" fill="none" stroke="#ff003c" strokeWidth="2">
                  <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
                </circle>
                
                {/* Right Leg */}
                <line x1="220" y1="320" x2="230" y2="450" stroke="#ff003c" strokeWidth="2" />
                <line x1="230" y1="450" x2="240" y2="560" stroke="#ff003c" strokeWidth="2" />
                <circle cx="230" cy="450" r="8" fill="none" stroke="#ff003c" strokeWidth="2">
                  <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
                </circle>
                
                {/* Targeting Reticles */}
                <g opacity="0.6">
                  <circle cx="200" cy="60" r="50" fill="none" stroke="#ff003c" strokeWidth="0.5" strokeDasharray="2,2" />
                  <circle cx="100" cy="200" r="30" fill="none" stroke="#ff003c" strokeWidth="0.5" strokeDasharray="2,2" />
                  <circle cx="300" cy="200" r="30" fill="none" stroke="#ff003c" strokeWidth="0.5" strokeDasharray="2,2" />
                  <circle cx="170" cy="450" r="30" fill="none" stroke="#ff003c" strokeWidth="0.5" strokeDasharray="2,2" />
                  <circle cx="230" cy="450" r="30" fill="none" stroke="#ff003c" strokeWidth="0.5" strokeDasharray="2,2" />
                </g>
                
                {/* Scan Lines */}
                <line x1="0" y1="0" x2="400" y2="0" stroke="#ff003c" strokeWidth="0.5" opacity="0.3" strokeDasharray="4,4">
                  <animate attributeName="y1" values="0;600;0" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="y2" values="0;600;0" dur="3s" repeatCount="indefinite" />
                </line>
              </svg>
              
              <div 
                className="mt-6 pt-6 grid grid-cols-2 gap-4"
                style={{ borderTop: '1px solid rgba(255, 0, 60, 0.2)' }}
              >
                <div className="font-mono text-[10px] flex justify-between">
                  <span className="text-gray-500">POSTURE:</span>
                  <span className="text-[#ff003c]">{drill.liveFeedback.posture_score.toFixed(1)}%</span>
                </div>
                <div className="font-mono text-[10px] flex justify-between">
                  <span className="text-gray-500">BALANCE:</span>
                  <span className="text-[#ff003c]">{drill.liveFeedback.balance_status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Metrics Data Grid */}
          <div>
            <div className="mb-6">
              <span className="font-mono text-[10px] text-gray-500 tracking-wider">
                BIOMECHANICAL_DATA
              </span>
            </div>

            <div className="space-y-4">
              {/* Row 1: Hero Card - Impact Force */}
              <div 
                className="border p-8 text-center"
                style={{
                  background: 'rgba(10, 10, 10, 0.8)',
                  backdropFilter: 'blur(10px)',
                  borderColor: '#ff003c',
                  borderWidth: '2px',
                  boxShadow: '0 0 20px rgba(255, 0, 60, 0.2)',
                }}
              >
                <div className="font-mono text-xs text-[#ff003c] tracking-wider mb-4">
                  IMPACT_FORCE
                </div>
                <div 
                  className="font-mono text-6xl text-white mb-2"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {drill.biometrics.impact_force_kgf.toFixed(2)}
                </div>
                <div className="font-mono text-sm text-gray-500">
                  kgf
                </div>
              </div>

              {/* Row 2: Rotation X & Y */}
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className="border p-6"
                  style={{
                    background: 'rgba(10, 10, 10, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderColor: '#1a1a1a',
                  }}
                >
                  <div className="font-mono text-[9px] text-gray-500 tracking-wider mb-3">
                    ROTATION_X
                  </div>
                  <div className="font-mono text-3xl text-white mb-1">
                    {drill.biometrics.rotation_x_deg.toFixed(1)}
                  </div>
                  <div className="font-mono text-[10px] text-gray-500">
                    degrees
                  </div>
                </div>
                <div 
                  className="border p-6"
                  style={{
                    background: 'rgba(10, 10, 10, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderColor: '#1a1a1a',
                  }}
                >
                  <div className="font-mono text-[9px] text-gray-500 tracking-wider mb-3">
                    ROTATION_Y
                  </div>
                  <div className="font-mono text-3xl text-white mb-1">
                    {drill.biometrics.rotation_y_deg.toFixed(1)}
                  </div>
                  <div className="font-mono text-[10px] text-gray-500">
                    degrees
                  </div>
                </div>
              </div>

              {/* Row 3: Rotation Z & Acceleration */}
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className="border p-6"
                  style={{
                    background: 'rgba(10, 10, 10, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderColor: '#1a1a1a',
                  }}
                >
                  <div className="font-mono text-[9px] text-gray-500 tracking-wider mb-3">
                    ROTATION_Z
                  </div>
                  <div className="font-mono text-3xl text-white mb-1">
                    {drill.biometrics.rotation_z_deg.toFixed(1)}
                  </div>
                  <div className="font-mono text-[10px] text-gray-500">
                    degrees
                  </div>
                </div>
                <div 
                  className="border p-6"
                  style={{
                    background: 'rgba(10, 10, 10, 0.8)',
                    backdropFilter: 'blur(10px)',
                    borderColor: '#1a1a1a',
                  }}
                >
                  <div className="font-mono text-[9px] text-gray-500 tracking-wider mb-3">
                    ACCELERATION
                  </div>
                  <div className="font-mono text-3xl text-white mb-1">
                    {drill.biometrics.acceleration_ms2.toFixed(2)}
                  </div>
                  <div className="font-mono text-[10px] text-gray-500">
                    m/s²
                  </div>
                </div>
              </div>

              {/* Neural Sync & Start Button */}
              <div 
                className="mt-8 pt-6"
                style={{ borderTop: '1px solid rgba(255, 0, 60, 0.2)' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-[10px] text-gray-500 tracking-wider">
                    NEURAL_SYNC
                  </span>
                  <span className="font-mono text-sm text-[#ff003c]">
                    {drill.liveFeedback.neural_sync_status}
                  </span>
                </div>
                <button 
                  className="w-full border-2 py-5 font-mono text-sm transition-all duration-300 hover:scale-[1.02] active:scale-95"
                  style={{
                    borderColor: '#ff003c',
                    color: '#ff003c',
                    background: 'transparent',
                    boxShadow: '0 0 20px rgba(255, 0, 60, 0.4)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ff003c';
                    e.currentTarget.style.color = '#000000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#ff003c';
                  }}
                >
                  START TRAINING
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}