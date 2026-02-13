import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface Drill {
  name: string;
  category: string;
  difficulty: string;
}

export function DrillList() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const drills: Drill[] = [
    { name: 'MUAY THAI CLINCH', category: 'GRAPPLING', difficulty: 'ADVANCED' },
    { name: 'ROUNDHOUSE KICK', category: 'STRIKING', difficulty: 'INTERMEDIATE' },
    { name: 'JAB CROSS COMBO', category: 'BOXING', difficulty: 'BEGINNER' },
    { name: 'SPINNING BACK FIST', category: 'STRIKING', difficulty: 'EXPERT' },
    { name: 'TRIANGLE CHOKE', category: 'SUBMISSION', difficulty: 'ADVANCED' },
    { name: 'SUPERMAN PUNCH', category: 'STRIKING', difficulty: 'INTERMEDIATE' },
  ];

  return (
    <div className="border border-[#ff0033]/20">
      {drills.map((drill, index) => (
        <div
          key={index}
          className="relative transition-all duration-300 ease-out border-b border-[#ff0033]/20 last:border-b-0 cursor-pointer"
          style={{
            backgroundColor: hoveredIndex === index ? '#ff0033' : 'transparent',
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <div className="px-8 py-6 flex items-center justify-between">
            <div className="flex-1">
              <h3 
                className="text-4xl font-black tracking-tighter uppercase transition-colors duration-300"
                style={{ 
                  fontFamily: 'Impact, "Anton", "Teko", sans-serif',
                  color: hoveredIndex === index ? '#ffffff' : '#ff0033'
                }}
              >
                {drill.name}
              </h3>
            </div>
            
            <div className="flex items-center gap-12">
              <div>
                <div className="font-mono text-[10px] text-gray-500 tracking-wider mb-1">CATEGORY</div>
                <div 
                  className="font-mono text-sm transition-colors duration-300"
                  style={{
                    color: hoveredIndex === index ? '#ffffff' : '#ffffff'
                  }}
                >
                  {drill.category}
                </div>
              </div>
              
              <div>
                <div className="font-mono text-[10px] text-gray-500 tracking-wider mb-1">DIFFICULTY</div>
                <div 
                  className="font-mono text-sm transition-colors duration-300"
                  style={{
                    color: hoveredIndex === index ? '#ffffff' : '#ff0033'
                  }}
                >
                  {drill.difficulty}
                </div>
              </div>

              <ExternalLink 
                className="transition-all duration-300"
                style={{
                  color: hoveredIndex === index ? '#ffffff' : '#ff0033',
                  transform: hoveredIndex === index ? 'scale(1.1)' : 'scale(1)'
                }}
                size={20}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
