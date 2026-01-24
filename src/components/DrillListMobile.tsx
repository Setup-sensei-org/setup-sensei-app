import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface Drill {
  name: string;
  category: string;
  difficulty: string;
  sets: string;
}

interface DrillListMobileProps {
  onDrillClick: (drill: Drill) => void;
}

export function DrillListMobile({ onDrillClick }: DrillListMobileProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const drills: Drill[] = [
    { name: 'MUAY THAI CLINCH', category: 'GRAPPLING', difficulty: 'ADV', sets: '3x12' },
    { name: 'ROUNDHOUSE KICK', category: 'STRIKING', difficulty: 'INT', sets: '5x10' },
    { name: 'TEEP DEFENSE', category: 'DEFENSE', difficulty: 'BEG', sets: '4x8' },
  ];

  const isActive = (index: number) => activeIndex === index || hoveredIndex === index;

  return (
    <div className="space-y-3">
      {drills.map((drill, index) => (
        <div
          key={index}
          className="border transition-all duration-300 cursor-pointer relative overflow-hidden"
          style={{
            backgroundColor: isActive(index) ? '#ff0033' : 'transparent',
            borderColor: isActive(index) ? '#ff0033' : '#ff0033',
            borderWidth: isActive(index) ? '2px' : '1px',
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          onMouseDown={() => setActiveIndex(index)}
          onMouseUp={() => setActiveIndex(null)}
          onTouchStart={() => setActiveIndex(index)}
          onTouchEnd={() => setActiveIndex(null)}
          onClick={() => onDrillClick(drill)}
        >
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <h3 
                className="text-xl font-black tracking-tighter uppercase transition-colors duration-300"
                style={{ 
                  fontFamily: 'Impact, "Anton", "Teko", sans-serif',
                  color: isActive(index) ? '#ffffff' : '#ff0033'
                }}
              >
                {drill.name}
              </h3>
              <ChevronRight 
                size={20} 
                className="transition-all duration-300"
                style={{
                  color: isActive(index) ? '#ffffff' : '#ff0033',
                  transform: isActive(index) ? 'translateX(4px)' : 'translateX(0)'
                }}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="font-mono text-[8px] tracking-wider mb-0.5" style={{ color: isActive(index) ? 'rgba(255,255,255,0.6)' : '#666666' }}>
                  CATEGORY
                </div>
                <div 
                  className="font-mono text-[10px] transition-colors duration-300"
                  style={{
                    color: isActive(index) ? '#ffffff' : '#ffffff'
                  }}
                >
                  {drill.category}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="font-mono text-[8px] tracking-wider mb-0.5" style={{ color: isActive(index) ? 'rgba(255,255,255,0.6)' : '#666666' }}>
                  DIFFICULTY
                </div>
                <div 
                  className="font-mono text-[10px] transition-colors duration-300"
                  style={{
                    color: isActive(index) ? '#ffffff' : '#ff0033'
                  }}
                >
                  {drill.difficulty}
                </div>
              </div>

              <div className="flex-1">
                <div className="font-mono text-[8px] tracking-wider mb-0.5" style={{ color: isActive(index) ? 'rgba(255,255,255,0.6)' : '#666666' }}>
                  SETS
                </div>
                <div 
                  className="font-mono text-[10px] transition-colors duration-300"
                  style={{
                    color: isActive(index) ? '#ffffff' : '#ffffff'
                  }}
                >
                  {drill.sets}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}