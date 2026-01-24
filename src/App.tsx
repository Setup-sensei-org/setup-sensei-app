import { useState } from 'react';
import { RoadmapLanding } from './components/RoadmapLanding';
import { AnalyticsScreen } from './components/screens/AnalyticsScreen';
import { AccountScreen } from './components/screens/AccountScreen';
import { ActiveDrillScreen } from './components/screens/ActiveDrillScreen';
import { SideNavRail } from './components/SideNavRail';

type Screen = 'roadmap' | 'analytics' | 'account';

interface DrillData {
  name: string;
  category: string;
  difficulty: string;
  sets: string;
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('roadmap');
  const [activeDrill, setActiveDrill] = useState<DrillData | null>(null);

  const handleDrillClick = (drill: DrillData) => {
    setActiveDrill(drill);
  };

  const handleBackToRoadmap = () => {
    setActiveDrill(null);
  };

  return (
    <div className="h-screen bg-[#050505] overflow-hidden flex scanline-overlay">
      {/* Side Navigation Rail */}
      <SideNavRail activeScreen={activeScreen} onNavigate={setActiveScreen} />

      {/* Main Content Area */}
      <div 
        className="flex-1 overflow-hidden"
        style={{
          marginLeft: '80px', // Space for the navigation rail
        }}
      >
        {activeDrill ? (
          <ActiveDrillScreen drill={activeDrill} onBack={handleBackToRoadmap} />
        ) : (
          <>
            {activeScreen === 'roadmap' && <RoadmapLanding onDrillClick={handleDrillClick} />}
            {activeScreen === 'analytics' && <AnalyticsScreen />}
            {activeScreen === 'account' && <AccountScreen />}
          </>
        )}
      </div>
    </div>
  );
}