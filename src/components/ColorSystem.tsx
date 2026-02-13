export function ColorSystem() {
  const colors = [
    { name: 'VOID_BLACK', hex: '#0a0a0a', usage: 'BACKGROUND', rgb: '10, 10, 10' },
    { name: 'DEEP_SURFACE', hex: '#1a1a1a', usage: 'SURFACES', rgb: '26, 26, 26' },
    { name: 'ELECTRIC_RED', hex: '#ff0033', usage: 'PRIMARY / ACTIVE', rgb: '255, 0, 51' },
    { name: 'RED_DARK', hex: '#990020', usage: 'HOVER / SHADOWS', rgb: '153, 0, 32' },
    { name: 'GHOST_GRAY', hex: '#666666', usage: 'SECONDARY', rgb: '102, 102, 102' },
    { name: 'CYBER_WHITE', hex: '#ffffff', usage: 'TEXT / CONTRAST', rgb: '255, 255, 255' },
  ];

  return (
    <section>
      <div className="text-gray-500 font-mono text-xs mb-4 tracking-wider">COLOR SYSTEM</div>
      <div className="border-t border-[#ff0033]/20 pt-6">
        <div className="space-y-4">
          {colors.map((color, index) => (
            <div key={index} className="flex items-center gap-6">
              <div 
                className="w-24 h-24 border border-[#ff0033]/20" 
                style={{ backgroundColor: color.hex }}
              />
              <div className="flex-1">
                <div className="font-mono text-sm text-white mb-1">{color.name}</div>
                <div className="font-mono text-xs text-gray-500">{color.hex}</div>
                <div className="font-mono text-xs text-gray-500">RGB({color.rgb})</div>
                <div className="font-mono text-[10px] text-[#ff0033] mt-2 tracking-wider">{color.usage}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
