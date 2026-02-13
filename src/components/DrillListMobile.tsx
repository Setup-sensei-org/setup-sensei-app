import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { DrillOverview, DrillDetail, DrillDifficulty, Biometrics, LiveFeedback } from '../types';

interface DrillListMobileProps {
  onDrillClick: (drill: DrillDetail) => void;
  drills?: DrillOverview[]; // Optional: will use mock data if not provided
}

export function DrillListMobile({ onDrillClick, drills: drillOverviews }: DrillListMobileProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Use provided drills or fallback to mock data for UI development
  const drillOverviewsData: DrillOverview[] = drillOverviews || [
    { id: '1', title: 'MUAY THAI CLINCH', category: 'GRAPPLING', duration: '5 MIN', intensity: 'HIGH' },
    { id: '2', title: 'ROUNDHOUSE KICK', category: 'STRIKING', duration: '4 MIN', intensity: 'MEDIUM' },
    { id: '3', title: 'TEEP DEFENSE', category: 'DEFENSE', duration: '3 MIN', intensity: 'LOW' },
  ];

  // Convert DrillOverview to DrillDetail for click handler
  const convertToDrillDetail = (overview: DrillOverview, difficulty: DrillDifficulty, sets: string): DrillDetail => {
    return {
      id: overview.id,
      overview,
      sets,
      difficulty,
      biometrics: {
        impact_force_kgf: 840.00,
        rotation_x_deg: 12.5,
        rotation_y_deg: 45.2,
        rotation_z_deg: -4.3,
        acceleration_ms2: 1.2,
      },
      liveFeedback: {
        posture_score: 98.3,
        balance_status: 'OPTIMAL',
        neural_sync_status: 'READY',
      },
    };
  };

  // Map intensity to difficulty and sets
  const getDifficultyFromIntensity = (intensity: string): DrillDifficulty => {
    const map: Record<string, DrillDifficulty> = {
      'LOW': 'BEG',
      'MEDIUM': 'INT',
      'HIGH': 'ADV',
      'EXTREME': 'EXP',
    };
    return map[intensity] || 'INT';
  };

  const getSetsFromIntensity = (intensity: string): string => {
    const map: Record<string, string> = {
      'LOW': '3x8',
      'MEDIUM': '3x10',
      'HIGH': '4x12',
      'EXTREME': '5x10',
    };
    return map[intensity] || '3x10';
  };

  const isActive = (index: number) => activeIndex === index || hoveredIndex === index;

  return (
    <div className="space-y-3">
      {drillOverviewsData.map((drill, index) => {
        const difficulty = getDifficultyFromIntensity(drill.intensity);
        const sets = getSetsFromIntensity(drill.intensity);
        return (
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
          onClick={() => onDrillClick(convertToDrillDetail(drill, difficulty, sets))}
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
                {drill.title}
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
                  {difficulty}
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
                  {sets}
                </div>
              </div>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
}