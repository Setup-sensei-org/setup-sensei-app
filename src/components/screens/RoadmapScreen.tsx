export function RoadmapScreen() {
  return (
    <div className="min-h-full flex items-center justify-center px-6 relative overflow-hidden">
      {/* Tactical Grid Background */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ff0033" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Diagonal scan lines */}
        <line x1="0" y1="0" x2="100%" y2="100%" stroke="#ff0033" strokeWidth="0.5" opacity="0.2" />
        <line x1="100%" y1="0" x2="0" y2="100%" stroke="#ff0033" strokeWidth="0.5" opacity="0.2" />
      </svg>

      {/* Center Content */}
      <div className="relative z-10 text-center border border-[#ff0033]/20 p-8 max-w-sm">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto border-2 border-[#ff0033] flex items-center justify-center mb-4">
            <div className="w-8 h-8 border border-[#ff0033] animate-pulse" />
          </div>
        </div>
        
        <p className="font-mono text-sm text-[#ff0033] tracking-wider leading-relaxed">
          SYSTEM UPGRADE PENDING<br />
          <span className="text-gray-500">//</span><br />
          ACCESS RESTRICTED
        </p>
        
        <div className="mt-6 pt-6 border-t border-[#ff0033]/20">
          <div className="font-mono text-[10px] text-gray-500 tracking-wider">
            ESTIMATED_DEPLOYMENT
          </div>
          <div className="font-mono text-xs text-[#ff0033] mt-1">
            Q2_2026
          </div>
        </div>
      </div>

      {/* Corner brackets */}
      <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#ff0033]/30" />
      <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#ff0033]/30" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#ff0033]/30" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#ff0033]/30" />
    </div>
  );
}
