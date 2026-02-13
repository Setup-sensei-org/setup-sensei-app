import { useState } from 'react';
import { Clock, Zap, Target } from 'lucide-react';
import { DrillOverview, DrillDetail, DrillDifficulty, Biometrics, LiveFeedback } from '../types';

interface FreestyleDrillLibraryProps {
  onDrillClick?: (drill: DrillDetail) => void;
  drills?: DrillOverview[]; // Optional: will use mock data if not provided
}

export function FreestyleDrillLibrary({ onDrillClick, drills: drillOverviews }: FreestyleDrillLibraryProps) {
  const [selectedDrill, setSelectedDrill] = useState<string | null>(null);

  // Use provided drills or fallback to mock data for UI development
  // Check for both undefined and empty array
  const drills: DrillOverview[] = (drillOverviews && drillOverviews.length > 0) ? drillOverviews : [
    {
      id: '1',
      title: 'SPEED JAB DRILL',
      category: 'SPEED',
      duration: '3 MIN',
      intensity: 'HIGH',
    },
    {
      id: '2',
      title: 'BODY SHOT COMBOS',
      category: 'POWER',
      duration: '5 MIN',
      intensity: 'EXTREME',
    },
    {
      id: '3',
      title: 'FOOTWORK MATRIX',
      category: 'AGILITY',
      duration: '4 MIN',
      intensity: 'MEDIUM',
    },
    {
      id: '4',
      title: 'HEAD MOVEMENT',
      category: 'DEFENSE',
      duration: '6 MIN',
      intensity: 'LOW',
    },
    {
      id: '5',
      title: 'COUNTER PUNCH',
      category: 'TECHNIQUE',
      duration: '3 MIN',
      intensity: 'HIGH',
    },
    {
      id: '6',
      title: 'SLIP & RIP',
      category: 'COMBO',
      duration: '4 MIN',
      intensity: 'EXTREME',
    },
  ];

  const convertToDrillDetail = (overview: DrillOverview): DrillDetail => {
    const difficultyMap: Record<string, DrillDifficulty> = {
      'LOW': 'BEG',
      'MEDIUM': 'INT',
      'HIGH': 'ADV',
      'EXTREME': 'EXP',
    };

    const setsMap: Record<string, string> = {
      'LOW': '3x8',
      'MEDIUM': '3x10',
      'HIGH': '4x12',
      'EXTREME': '5x10',
    };

    return {
      id: overview.id,
      overview,
      sets: setsMap[overview.intensity] || '3x10',
      difficulty: difficultyMap[overview.intensity] || 'INT',
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

  const handleDrillClick = (drill: DrillOverview) => {
    setSelectedDrill(selectedDrill === drill.id ? null : drill.id);
  };

  const handleDrillDoubleClick = (drill: DrillOverview) => {
    if (onDrillClick) {
      onDrillClick(convertToDrillDetail(drill));
    }
  };

  return (
    <section className="w-full px-8 py-24">
      {/* Section header */}
      <div className="max-w-[1200px] mx-auto mb-16">
        <div
          className="inline-block px-4 py-2 mb-6"
          style={{
            border: '1px solid #ff003c',
            background: 'rgba(255, 0, 60, 0.05)',
          }}
        >
          <span className="font-mono text-[10px] tracking-wider text-[#ff003c]">
            EXPLORE_LIBRARY
          </span>
        </div>
        <h2
          className="text-[4rem] leading-[0.9] font-black tracking-tighter uppercase"
          style={{
            fontFamily: 'Impact, Anton, sans-serif',
            color: '#ffffff',
          }}
        >
          FREESTYLE
          <br />
          DRILL LIBRARY
        </h2>
      </div>

      {/* Masonry grid */}
      <div className="max-w-[1200px] mx-auto grid grid-cols-3 gap-6">
        {drills.map((drill) => {
          const isSelected = selectedDrill === drill.id;

          return (
            <div
              key={drill.id}
              onClick={() => handleDrillClick(drill)}
              onDoubleClick={() => handleDrillDoubleClick(drill)}
              className="group cursor-pointer transition-all duration-500 glitch-hover"
              style={{
                background: isSelected ? '#ff003c' : '#0a0a0a',
                border: `1px solid ${isSelected ? '#ff003c' : '#1a1a1a'}`,
                padding: '32px',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                boxShadow: isSelected
                  ? '0 0 32px rgba(255, 0, 60, 0.3)'
                  : 'none',
              }}
            >
              {/* Category badge */}
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: isSelected ? '#000000' : '#ff003c',
                  }}
                />
                <span
                  className="font-mono text-[9px] tracking-wider"
                  style={{
                    color: isSelected ? '#000000' : '#666666',
                  }}
                >
                  {drill.category}
                </span>
              </div>

              {/* Title */}
              <h3
                className="text-2xl font-black tracking-tighter uppercase mb-6"
                style={{
                  fontFamily: 'Impact, Anton, sans-serif',
                  color: isSelected ? '#000000' : '#ffffff',
                }}
              >
                {drill.title}
              </h3>

              {/* Metadata */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Clock
                    size={16}
                    style={{
                      color: isSelected ? '#000000' : '#ff003c',
                    }}
                  />
                  <div>
                    <div
                      className="font-mono text-[8px] tracking-wider mb-0.5"
                      style={{
                        color: isSelected
                          ? 'rgba(0, 0, 0, 0.5)'
                          : '#666666',
                      }}
                    >
                      DURATION
                    </div>
                    <div
                      className="font-mono text-[11px]"
                      style={{
                        color: isSelected ? '#000000' : '#ffffff',
                      }}
                    >
                      {drill.duration}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Zap
                    size={16}
                    style={{
                      color: isSelected ? '#000000' : '#ff003c',
                    }}
                  />
                  <div>
                    <div
                      className="font-mono text-[8px] tracking-wider mb-0.5"
                      style={{
                        color: isSelected
                          ? 'rgba(0, 0, 0, 0.5)'
                          : '#666666',
                      }}
                    >
                      INTENSITY
                    </div>
                    <div
                      className="font-mono text-[11px]"
                      style={{
                        color: isSelected ? '#000000' : '#ffffff',
                      }}
                    >
                      {drill.intensity}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hover indicator */}
              {!isSelected && (
                <div
                  className="mt-6 pt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    borderTop: '1px solid #1a1a1a',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Target size={12} color="#ff003c" />
                    <span className="font-mono text-[9px] tracking-wider text-[#ff003c]">
                      CLICK_TO_SELECT
                    </span>
                  </div>
                </div>
              )}

              {/* Selected state - double click hint */}
              {isSelected && (
                <div
                  className="mt-6 pt-4 transition-opacity duration-300"
                  style={{
                    borderTop: '1px solid rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Target size={12} color="#000000" />
                    <span className="font-mono text-[9px] tracking-wider text-[#000000]">
                      DOUBLE_CLICK_TO_START
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}