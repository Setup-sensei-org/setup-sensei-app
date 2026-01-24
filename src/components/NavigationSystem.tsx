import { useState } from 'react';

export function NavigationSystem() {
  const [hoveredNav, setHoveredNav] = useState<number | null>(null);

  const navItems = [
    'TRAIN',
    'ANALYZE', 
    'HISTORY',
    'SETTINGS'
  ];

  return (
    <section>
      <h2 className="text-7xl font-black tracking-tighter text-[#ff0033] uppercase mb-16" style={{ fontFamily: 'Impact, "Anton", "Teko", sans-serif' }}>
        NAVIGATION
      </h2>
      
      <div className="grid grid-cols-2 gap-16">
        {/* Horizontal Nav */}
        <div>
          <div className="text-gray-500 font-mono text-xs mb-4 tracking-wider">PRIMARY / HORIZONTAL</div>
          <div className="border border-[#ff0033]/20 p-8">
            <nav className="flex gap-8">
              {navItems.map((item, index) => (
                <button
                  key={index}
                  className="font-mono text-sm transition-all duration-300 relative"
                  style={{
                    color: hoveredNav === index ? '#ff0033' : '#666666'
                  }}
                  onMouseEnter={() => setHoveredNav(index)}
                  onMouseLeave={() => setHoveredNav(null)}
                >
                  {item}
                  {hoveredNav === index && (
                    <div className="absolute -bottom-2 left-0 right-0 h-[2px] bg-[#ff0033]" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Vertical Nav */}
        <div>
          <div className="text-gray-500 font-mono text-xs mb-4 tracking-wider">SECONDARY / VERTICAL</div>
          <div className="border border-[#ff0033]/20 p-8">
            <nav className="space-y-4">
              {navItems.map((item, index) => (
                <button
                  key={index}
                  className="w-full text-left font-mono text-sm transition-all duration-300 px-4 py-3 border-l-2"
                  style={{
                    color: hoveredNav === index + 10 ? '#ffffff' : '#666666',
                    backgroundColor: hoveredNav === index + 10 ? '#ff0033' : 'transparent',
                    borderColor: hoveredNav === index + 10 ? '#ff0033' : 'transparent'
                  }}
                  onMouseEnter={() => setHoveredNav(index + 10)}
                  onMouseLeave={() => setHoveredNav(null)}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
