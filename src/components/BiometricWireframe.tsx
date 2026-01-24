export function BiometricWireframe() {
  return (
    <div className="border border-[#ff0033]/20 p-4 bg-[#0a0a0a] relative overflow-hidden">
      <div className="absolute top-2 left-2 font-mono text-[9px] text-[#ff0033] tracking-wider">
        FULL_BODY_SCAN
      </div>
      <div className="absolute top-2 right-2 font-mono text-[9px] text-gray-500 tracking-wider flex items-center gap-1">
        <div className="w-1.5 h-1.5 bg-[#ff0033] rounded-full animate-pulse" />
        ACTIVE
      </div>
      
      {/* Body Wireframe */}
      <svg viewBox="0 0 400 600" className="w-full h-auto" style={{ maxHeight: '300px' }}>
        {/* Head */}
        <ellipse cx="200" cy="60" rx="40" ry="50" fill="none" stroke="#ff0033" strokeWidth="1" opacity="0.6" />
        <circle cx="200" cy="60" r="35" fill="none" stroke="#ff0033" strokeWidth="1" opacity="0.3" />
        
        {/* Neck */}
        <line x1="200" y1="110" x2="200" y2="140" stroke="#ff0033" strokeWidth="2" />
        
        {/* Torso */}
        <rect x="160" y="140" width="80" height="120" fill="none" stroke="#ff0033" strokeWidth="2" />
        <line x1="160" y1="180" x2="240" y2="180" stroke="#ff0033" strokeWidth="1" opacity="0.4" />
        <line x1="160" y1="220" x2="240" y2="220" stroke="#ff0033" strokeWidth="1" opacity="0.4" />
        
        {/* Left Arm */}
        <line x1="160" y1="140" x2="100" y2="200" stroke="#ff0033" strokeWidth="2" />
        <line x1="100" y1="200" x2="80" y2="280" stroke="#ff0033" strokeWidth="2" />
        <circle cx="100" cy="200" r="8" fill="none" stroke="#ff0033" strokeWidth="2">
          <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
        </circle>
        
        {/* Right Arm */}
        <line x1="240" y1="140" x2="300" y2="200" stroke="#ff0033" strokeWidth="2" />
        <line x1="300" y1="200" x2="320" y2="280" stroke="#ff0033" strokeWidth="2" />
        <circle cx="300" cy="200" r="8" fill="none" stroke="#ff0033" strokeWidth="2">
          <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
        </circle>
        
        {/* Pelvis */}
        <line x1="160" y1="260" x2="180" y2="320" stroke="#ff0033" strokeWidth="2" />
        <line x1="240" y1="260" x2="220" y2="320" stroke="#ff0033" strokeWidth="2" />
        
        {/* Left Leg */}
        <line x1="180" y1="320" x2="170" y2="450" stroke="#ff0033" strokeWidth="2" />
        <line x1="170" y1="450" x2="160" y2="560" stroke="#ff0033" strokeWidth="2" />
        <circle cx="170" cy="450" r="8" fill="none" stroke="#ff0033" strokeWidth="2">
          <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
        </circle>
        
        {/* Right Leg */}
        <line x1="220" y1="320" x2="230" y2="450" stroke="#ff0033" strokeWidth="2" />
        <line x1="230" y1="450" x2="240" y2="560" stroke="#ff0033" strokeWidth="2" />
        <circle cx="230" cy="450" r="8" fill="none" stroke="#ff0033" strokeWidth="2">
          <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
        </circle>
        
        {/* Targeting Reticles */}
        <g opacity="0.6">
          <circle cx="200" cy="60" r="50" fill="none" stroke="#ff0033" strokeWidth="0.5" strokeDasharray="2,2" />
          <circle cx="100" cy="200" r="30" fill="none" stroke="#ff0033" strokeWidth="0.5" strokeDasharray="2,2" />
          <circle cx="300" cy="200" r="30" fill="none" stroke="#ff0033" strokeWidth="0.5" strokeDasharray="2,2" />
          <circle cx="170" cy="450" r="30" fill="none" stroke="#ff0033" strokeWidth="0.5" strokeDasharray="2,2" />
          <circle cx="230" cy="450" r="30" fill="none" stroke="#ff0033" strokeWidth="0.5" strokeDasharray="2,2" />
        </g>
        
        {/* Scan Lines */}
        <line x1="0" y1="0" x2="400" y2="0" stroke="#ff0033" strokeWidth="0.5" opacity="0.3" strokeDasharray="4,4">
          <animate attributeName="y1" values="0;600;0" dur="3s" repeatCount="indefinite" />
          <animate attributeName="y2" values="0;600;0" dur="3s" repeatCount="indefinite" />
        </line>
      </svg>
      
      <div className="mt-3 pt-3 border-t border-[#ff0033]/20 grid grid-cols-2 gap-3">
        <div className="font-mono text-[9px] text-white flex justify-between">
          <span className="text-gray-500">POSTURE:</span>
          <span className="text-[#ff0033]">98.3%</span>
        </div>
        <div className="font-mono text-[9px] text-white flex justify-between">
          <span className="text-gray-500">BALANCE:</span>
          <span className="text-[#ff0033]">OPTIMAL</span>
        </div>
      </div>
    </div>
  );
}