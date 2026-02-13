import { useState, useEffect, useRef } from "react";
import { HexagonNode } from "./HexagonNode";
import { CircuitPath } from "./CircuitPath";
import { FreestyleDrillLibrary } from "./FreestyleDrillLibrary";
import { RoadmapNode, DrillDetail, DrillOverview, DrillDifficulty, Biometrics, LiveFeedback } from "../types";

interface RoadmapLandingProps {
  onDrillClick: (drill: DrillDetail) => void;
  roadmapNodes?: RoadmapNode[]; // Optional: will use mock data if not provided
  drills?: DrillOverview[]; // Optional: will use mock data in library if not provided
}

export function RoadmapLanding({ onDrillClick, roadmapNodes, drills }: RoadmapLandingProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          containerRef.current;
        const progress =
          scrollTop / (scrollHeight - clientHeight);
        setScrollProgress(progress);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () =>
        container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Use provided roadmapNodes or fallback to mock data for UI development
  // If Supabase returns an empty array for this user, keep showing the mock roadmap
  const levels: RoadmapNode[] = roadmapNodes && roadmapNodes.length > 0 ? roadmapNodes : [
    {
      id: '1',
      level: 1,
      title: "STANCE",
      subtitle: "FOUNDATION BASICS",
      status: "completed",
      type: "FUNDAMENTALS",
      description: "FOUNDATION BASICS",
      pathDirection: "right",
    },
    {
      id: '2',
      level: 2,
      title: "JAB-CROSS",
      subtitle: "FUNDAMENTAL COMBO",
      status: "completed",
      type: "STRIKING",
      description: "FUNDAMENTAL COMBO",
      pathDirection: "left",
    },
    {
      id: '3',
      level: 3,
      title: "1-2-HOOK",
      subtitle: "POWER SEQUENCE",
      status: "active",
      type: "POWER",
      description: "POWER SEQUENCE",
      pathDirection: "right",
    },
    {
      id: '4',
      level: 4,
      title: "UPPERCUT",
      status: "locked",
      type: "STRIKING",
      pathDirection: "left",
    },
    {
      id: '5',
      level: 5,
      title: "SLIP-ROLL",
      status: "locked",
      type: "DEFENSE",
      pathDirection: "right",
    },
    {
      id: '6',
      level: 6,
      title: "COUNTER",
      status: "locked",
      type: "ADVANCED",
      pathDirection: "straight",
    },
    {
      id: '7',
      level: 7,
      title: "ADVANCED",
      status: "locked",
      type: "MASTERY",
      pathDirection: "left",
    },
  ];

  // Map roadmap node to drill detail
  const getDrillFromLevel = (node: RoadmapNode): DrillDetail => {
    const difficultyMap: Record<number, DrillDifficulty> = {
      1: 'BEG',
      2: 'INT',
      3: 'INT',
      4: 'ADV',
      5: 'ADV',
      6: 'ADV',
      7: 'EXP',
    };

    const setsMap: Record<number, string> = {
      1: '3x10',
      2: '4x12',
      3: '5x10',
      4: '4x8',
      5: '3x12',
      6: '5x8',
      7: '6x10',
    };

    const overview: DrillOverview = {
      id: node.id,
      title: node.title,
      category: node.type,
      duration: '5 MIN',
      intensity: 'MEDIUM',
    };

    const drillDetail: DrillDetail = {
      id: node.id,
      overview,
      sets: setsMap[node.level] || '3x10',
      difficulty: difficultyMap[node.level] || 'INT',
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

    return drillDetail;
  };

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-auto overflow-x-hidden"
      style={{
        scrollBehavior: "smooth",
      }}
    >
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center relative px-8">
        {/* Background grid with parallax */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            transform: `translateY(${scrollProgress * 100}px)`,
            backgroundImage: `
              linear-gradient(rgba(255, 0, 60, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 0, 60, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Main headline */}
        <div className="relative z-10 text-center mb-24">
          <h1
            className="text-[8rem] leading-[0.85] font-black tracking-tighter uppercase mb-6"
            style={{
              fontFamily: "Impact, Anton, sans-serif",
              color: "#ffffff",
              textShadow: "0 0 40px rgba(255, 0, 60, 0.3)",
            }}
          >
            SET-UP
            <br />
            <span className="text-[#ff003c]">SENSEI</span>
          </h1>
          <p
            className="font-mono text-sm tracking-wider"
            style={{ color: "#666666" }}
          >
            PROGRESS THROUGH THE DIGITAL BOXING GYM
          </p>
        </div>
      </section>

      {/* Roadmap Path Section */}
      <section className="min-h-screen py-24 relative">
        {/* Parallax background elements */}
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            transform: `translateY(${scrollProgress * 50}px)`,
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(255, 0, 60, 0.1) 0%, transparent 50%)
            `,
          }}
        />

        <div className="max-w-[800px] mx-auto flex flex-col items-center">
          {levels.map((level, index) => {
            const isLastLevel = index === levels.length - 1;
            const pathHeight = isLastLevel ? 0 : 200;
            const nextLevel = levels[index + 1];
            const isPathActive =
              level.status === "completed" ||
              (level.status === "active" &&
                nextLevel?.status !== "locked");

            return (
              <div
                key={level.level}
                className="flex flex-col items-center"
              >
                <HexagonNode
                  level={level.level}
                  title={level.title}
                  status={level.status}
                  description={level.description || level.subtitle}
                  onClick={() => {
                    if (level.status !== "locked") {
                      onDrillClick(getDrillFromLevel(level));
                    }
                  }}
                />

                {!isLastLevel && (
                  <CircuitPath
                    height={pathHeight}
                    isActive={isPathActive}
                    direction={level.pathDirection}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Side statistics */}
        <div className="absolute right-12 top-1/2 -translate-y-1/2 space-y-6">
          <div
            className="px-6 py-4"
            style={{
              background: "rgba(10, 10, 10, 0.8)",
              backdropFilter: "blur(10px)",
              border: "1px solid #1a1a1a",
            }}
          >
            <div className="font-mono text-[8px] tracking-wider text-[#666666] mb-1">
              PROGRESS
            </div>
            <div
              className="text-3xl font-black"
              style={{
                fontFamily: "Impact, Anton, sans-serif",
                color: "#ff003c",
              }}
            >
              28%
            </div>
          </div>

          <div
            className="px-6 py-4"
            style={{
              background: "rgba(10, 10, 10, 0.8)",
              backdropFilter: "blur(10px)",
              border: "1px solid #1a1a1a",
            }}
          >
            <div className="font-mono text-[8px] tracking-wider text-[#666666] mb-1">
              COMPLETED
            </div>
            <div
              className="text-3xl font-black"
              style={{
                fontFamily: "Impact, Anton, sans-serif",
                color: "#ffffff",
              }}
            >
              2/7
            </div>
          </div>
        </div>
      </section>

      {/* Freestyle Drill Library Section */}
      <FreestyleDrillLibrary
        onDrillClick={(drill) => onDrillClick(drill)}
        drills={drills}
      />

      {/* Footer */}
      <footer className="py-16 text-center border-t border-[#1a1a1a]">
        <div className="font-mono text-[9px] tracking-wider text-[#333333]">
          SETUP_SENSEI_v2.0 / DIGITAL_DOJO_SYSTEM
        </div>
      </footer>
    </div>
  );
}