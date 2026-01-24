export function BiometricVisual() {
  return (
    <div className="grid grid-cols-2 gap-16">
      {/* Wireframe Body Scan */}
      <div className="border border-[#ff0033]/20 p-12 bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute top-4 left-4 font-mono text-[10px] text-[#ff0033] tracking-wider">
          FULL_BODY_SCAN
        </div>
        <div className="absolute top-4 right-4 font-mono text-[10px] text-gray-500 tracking-wider">
          STATUS: ACTIVE
        </div>
        
        {/* Body Wireframe */}
        <svg viewBox="0 0 400 600" className="w-full h-auto">
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
          <circle cx="100" cy="200" r="8" fill="none" stroke="#ff0033" strokeWidth="2" />
          
          {/* Right Arm */}
          <line x1="240" y1="140" x2="300" y2="200" stroke="#ff0033" strokeWidth="2" />
          <line x1="300" y1="200" x2="320" y2="280" stroke="#ff0033" strokeWidth="2" />
          <circle cx="300" cy="200" r="8" fill="none" stroke="#ff0033" strokeWidth="2" />
          
          {/* Pelvis */}
          <line x1="160" y1="260" x2="180" y2="320" stroke="#ff0033" strokeWidth="2" />
          <line x1="240" y1="260" x2="220" y2="320" stroke="#ff0033" strokeWidth="2" />
          
          {/* Left Leg */}
          <line x1="180" y1="320" x2="170" y2="450" stroke="#ff0033" strokeWidth="2" />
          <line x1="170" y1="450" x2="160" y2="560" stroke="#ff0033" strokeWidth="2" />
          <circle cx="170" cy="450" r="8" fill="none" stroke="#ff0033" strokeWidth="2" />
          
          {/* Right Leg */}
          <line x1="220" y1="320" x2="230" y2="450" stroke="#ff0033" strokeWidth="2" />
          <line x1="230" y1="450" x2="240" y2="560" stroke="#ff0033" strokeWidth="2" />
          <circle cx="230" cy="450" r="8" fill="none" stroke="#ff0033" strokeWidth="2" />
          
          {/* Targeting Reticles */}
          <g opacity="0.6">
            <circle cx="200" cy="60" r="50" fill="none" stroke="#ff0033" strokeWidth="0.5" strokeDasharray="2,2" />
            <circle cx="100" cy="200" r="30" fill="none" stroke="#ff0033" strokeWidth="0.5" strokeDasharray="2,2" />
            <circle cx="300" cy="200" r="30" fill="none" stroke="#ff0033" strokeWidth="0.5" strokeDasharray="2,2" />
            <circle cx="170" cy="450" r="30" fill="none" stroke="#ff0033" strokeWidth="0.5" strokeDasharray="2,2" />
            <circle cx="230" cy="450" r="30" fill="none" stroke="#ff0033" strokeWidth="0.5" strokeDasharray="2,2" />
          </g>
          
          {/* Scan Lines */}
          <line x1="0" y1="180" x2="400" y2="180" stroke="#ff0033" strokeWidth="0.5" opacity="0.3" strokeDasharray="4,4">
            <animate attributeName="y1" values="0;600;0" dur="3s" repeatCount="indefinite" />
            <animate attributeName="y2" values="0;600;0" dur="3s" repeatCount="indefinite" />
          </line>
        </svg>
        
        <div className="mt-6 space-y-2">
          <div className="font-mono text-xs text-white flex justify-between">
            <span>POSTURE_ALIGN:</span>
            <span className="text-[#ff0033]">98.3%</span>
          </div>
          <div className="font-mono text-xs text-white flex justify-between">
            <span>BALANCE_INDEX:</span>
            <span className="text-[#ff0033]">OPTIMAL</span>
          </div>
        </div>
      </div>

      {/* Limb Analysis */}
      <div className="border border-[#ff0033]/20 p-12 bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute top-4 left-4 font-mono text-[10px] text-[#ff0033] tracking-wider">
          LIMB_ANALYSIS
        </div>
        <div className="absolute top-4 right-4 font-mono text-[10px] text-gray-500 tracking-wider">
          FOCUS: RIGHT_ARM
        </div>

        {/* Arm Detail Wireframe */}
        <svg viewBox="0 0 400 600" className="w-full h-auto">
          {/* Shoulder Joint */}
          <circle cx="100" cy="100" r="40" fill="none" stroke="#ff0033" strokeWidth="2" />
          <circle cx="100" cy="100" r="30" fill="none" stroke="#ff0033" strokeWidth="1" opacity="0.4" />
          <circle cx="100" cy="100" r="20" fill="none" stroke="#ff0033" strokeWidth="1" opacity="0.3" />
          
          {/* Upper Arm */}
          <line x1="100" y1="140" x2="200" y2="280" stroke="#ff0033" strokeWidth="3" />
          <line x1="95" y1="140" x2="195" y2="280" stroke="#ff0033" strokeWidth="1" opacity="0.3" />
          <line x1="105" y1="140" x2="205" y2="280" stroke="#ff0033" strokeWidth="1" opacity="0.3" />
          
          {/* Elbow Joint */}
          <circle cx="200" cy="280" r="35" fill="none" stroke="#ff0033" strokeWidth="2" />
          <circle cx="200" cy="280" r="25" fill="none" stroke="#ff0033" strokeWidth="1" opacity="0.4" />
          
          {/* Forearm */}
          <line x1="200" y1="315" x2="250" y2="480" stroke="#ff0033" strokeWidth="3" />
          <line x1="195" y1="315" x2="245" y2="480" stroke="#ff0033" strokeWidth="1" opacity="0.3" />
          <line x1="205" y1="315" x2="255" y2="480" stroke="#ff0033" strokeWidth="1" opacity="0.3" />
          
          {/* Wrist */}
          <circle cx="250" cy="480" r="25" fill="none" stroke="#ff0033" strokeWidth="2" />
          
          {/* Fist */}
          <rect x="230" y="500" width="40" height="60" fill="none" stroke="#ff0033" strokeWidth="2" />
          
          {/* Measurement Lines */}
          <line x1="320" y1="100" x2="320" y2="280" stroke="#ff0033" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.6" />
          <line x1="315" y1="100" x2="325" y2="100" stroke="#ff0033" strokeWidth="0.5" />
          <line x1="315" y1="280" x2="325" y2="280" stroke="#ff0033" strokeWidth="0.5" />
          <text x="335" y="195" fill="#ff0033" fontSize="12" fontFamily="monospace">180°</text>
          
          {/* Angle Arc */}
          <path d="M 200 250 Q 180 265 200 280" fill="none" stroke="#ff0033" strokeWidth="1" opacity="0.6" />
          
          {/* Force Vector */}
          <line x1="250" y1="540" x2="350" y2="540" stroke="#ff0033" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#ff0033" />
            </marker>
          </defs>
          <text x="280" y="530" fill="#ff0033" fontSize="10" fontFamily="monospace">FORCE</text>
        </svg>

        <div className="mt-6 space-y-2">
          <div className="font-mono text-xs text-white flex justify-between">
            <span>VELOCITY:</span>
            <span className="text-[#ff0033]">12.4 m/s</span>
          </div>
          <div className="font-mono text-xs text-white flex justify-between">
            <span>IMPACT_FORCE:</span>
            <span className="text-[#ff0033]">847 N</span>
          </div>
          <div className="font-mono text-xs text-white flex justify-between">
            <span>TECHNIQUE:</span>
            <span className="text-[#ff0033]">CROSS_PUNCH</span>
          </div>
        </div>
      </div>
    </div>
  );
}
