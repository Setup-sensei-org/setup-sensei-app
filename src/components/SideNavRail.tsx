import { useState } from 'react';
import { Target, TrendingUp, User } from 'lucide-react';

type Screen = 'roadmap' | 'analytics' | 'account';

interface SideNavRailProps {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function SideNavRail({ activeScreen, onNavigate }: SideNavRailProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = [
    { id: 'roadmap' as Screen, icon: Target, label: 'ROADMAP' },
    { id: 'analytics' as Screen, icon: TrendingUp, label: 'ANALYTICS' },
    { id: 'account' as Screen, icon: User, label: 'ACCOUNT' },
  ];

  return (
    <div
      className="fixed left-0 top-0 h-full z-50 transition-all duration-300 ease-out"
      style={{
        width: isExpanded ? '240px' : '80px',
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Glassmorphism background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(10, 10, 10, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 0, 60, 0.2)',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)',
        }}
      />

      {/* Navigation items */}
      <div className="relative h-full flex flex-col items-start pt-24 px-4 gap-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full flex items-center gap-4 group transition-all duration-300"
              style={{
                padding: '16px',
              }}
            >
              {/* Icon container */}
              <div
                className="relative flex items-center justify-center transition-all duration-300"
                style={{
                  width: '32px',
                  height: '32px',
                }}
              >
                <Icon
                  size={24}
                  className="transition-all duration-300"
                  style={{
                    color: isActive ? '#ff003c' : '#666666',
                    filter: isActive
                      ? 'drop-shadow(0 0 8px #ff003c)'
                      : 'none',
                  }}
                />
              </div>

              {/* Label */}
              <span
                className="font-mono text-xs tracking-wider whitespace-nowrap transition-all duration-300"
                style={{
                  opacity: isExpanded ? 1 : 0,
                  transform: isExpanded
                    ? 'translateX(0)'
                    : 'translateX(-20px)',
                  color: isActive ? '#ff003c' : '#666666',
                  textShadow: isActive ? '0 0 8px rgba(255, 0, 60, 0.5)' : 'none',
                }}
              >
                {item.label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div
                  className="absolute right-0 w-1 h-8 bg-[#ff003c] circuit-pulse"
                  style={{
                    boxShadow: '0 0 8px #ff003c',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Corner accent */}
      <div
        className="absolute top-0 left-0 w-16 h-16"
        style={{
          background:
            'linear-gradient(135deg, rgba(255, 0, 60, 0.1) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
