import { Home, Map, BarChart3, User } from 'lucide-react';

interface BottomNavProps {
  activeScreen: 'dojo' | 'roadmap' | 'analytics' | 'account';
  onNavigate: (screen: 'dojo' | 'roadmap' | 'analytics' | 'account') => void;
}

export function BottomNav({ activeScreen, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'dojo' as const, icon: Home, label: 'DOJO' },
    { id: 'roadmap' as const, icon: Map, label: 'ROADMAP' },
    { id: 'analytics' as const, icon: BarChart3, label: 'ANALYTICS' },
    { id: 'account' as const, icon: User, label: 'ACCOUNT' },
  ];

  return (
    <nav className="border-t border-[#ff0033]/20 bg-[#0a0a0a] px-4 py-3">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center gap-1 transition-all duration-150 relative"
            >
              <Icon
                size={24}
                style={{
                  color: isActive ? '#ff0033' : '#666666',
                  filter: isActive ? 'drop-shadow(0 0 8px #ff0033)' : 'none',
                }}
              />
              <span
                className="font-mono text-[9px] tracking-wider"
                style={{
                  color: isActive ? '#ff0033' : '#666666',
                  textShadow: isActive ? '0 0 8px #ff0033' : 'none',
                }}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#ff0033] rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
