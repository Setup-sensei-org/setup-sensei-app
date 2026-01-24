import { useState, useEffect, useRef } from "react";
import { HexagonNode } from "./HexagonNode";
import { CircuitPath } from "./CircuitPath";
import { FreestyleDrillLibrary } from "./FreestyleDrillLibrary";

interface RoadmapLevel {
  level: number;
  title: string;
  status: "completed" | "active" | "locked";
  description?: string;
  pathDirection?: "left" | "right" | "straight";
}

interface DrillData {
  name: string;
  category: string;
  difficulty: string;
  sets: string;
}

interface RoadmapLandingProps {
  onDrillClick: (drill: DrillData) => void;
}

export function RoadmapLanding({ onDrillClick }: RoadmapLandingProps) {
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

  const levels: RoadmapLevel[] = [
    {
      level: 1,
      title: "STANCE",
      status: "completed",
      description: "FOUNDATION BASICS",
      pathDirection: "right",
    },
    {
      level: 2,
      title: "JAB-CROSS",
      status: "completed",
      description: "FUNDAMENTAL COMBO",
      pathDirection: "left",
    },
    {
      level: 3,
      title: "1-2-HOOK",
      status: "active",
      description: "POWER SEQUENCE",
      pathDirection: "right",
    },
    {
      level: 4,
      title: "UPPERCUT",
      status: "locked",
      pathDirection: "left",
    },
    {
      level: 5,
      title: "SLIP-ROLL",
      status: "locked",
      pathDirection: "right",
    },
    {
      level: 6,
      title: "COUNTER",
      status: "locked",
      pathDirection: "straight",
    },
    {
      level: 7,
      title: "ADVANCED",
      status: "locked",
      pathDirection: "left",
    },
  ];

  // Map levels to drill data
  const getDrillFromLevel = (level: RoadmapLevel): DrillData => {
    const categoryMap: Record<number, string> = {
      1: 'FUNDAMENTALS',
      2: 'STRIKING',
      3: 'POWER',
      4: 'STRIKING',
      5: 'DEFENSE',
      6: 'ADVANCED',
      7: 'MASTERY',
    };

    const difficultyMap: Record<number, string> = {
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

    return {
      name: level.title,
      category: categoryMap[level.level] || 'TRAINING',
      difficulty: difficultyMap[level.level] || 'INT',
      sets: setsMap[level.level] || '3x10',
    };
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
          <div
            className="inline-block px-6 py-2 mb-8"
            style={{
              border: "1px solid #ff003c",
              background: "rgba(255, 0, 60, 0.05)",
            }}
          >
            <span className="font-mono text-[10px] tracking-wider text-[#ff003c]">
              NEURAL_TRAINING_PROTOCOL
            </span>
          </div>
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

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 circuit-pulse">
          <span className="font-mono text-[9px] tracking-wider text-[#ff003c]">
            SCROLL_TO_BEGIN
          </span>
          <div
            className="w-[1px] h-16 bg-gradient-to-b from-[#ff003c] to-transparent"
            style={{
              boxShadow: "0 0 8px #ff003c",
            }}
          />
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
              radial-gradient(circle at 20% 30%, rgba(255, 0, 60, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(255, 0, 60, 0.1) 0%, transparent 50%)
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
                  description={level.description}
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
      <FreestyleDrillLibrary onDrillClick={onDrillClick} />

      {/* Footer */}
      <footer className="py-16 text-center border-t border-[#1a1a1a]">
        <div className="font-mono text-[9px] tracking-wider text-[#333333]">
          SETUP_SENSEI_v2.0 / DIGITAL_DOJO_SYSTEM
        </div>
      </footer>
    </div>
  );
}