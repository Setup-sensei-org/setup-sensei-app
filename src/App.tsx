import { useState } from 'react';
import { RoadmapLanding } from './components/RoadmapLanding';
import { AnalyticsScreen } from './components/screens/AnalyticsScreen';
import { AccountScreen } from './components/screens/AccountScreen';
import { ActiveDrillScreen } from './components/screens/ActiveDrillScreen';
import { SideNavRail } from './components/SideNavRail';
import { BackgroundTexture } from './components/BackgroundTexture';
import { MatteTexture } from './components/MatteTexture';
import { DojoMatBackground } from './components/DojoMatBackground';
import { DrillDetail } from './types';
import { login, signup, setAuthToken } from './services/api';
import { AuthPayload } from './types';

type Screen = 'roadmap' | 'analytics' | 'account';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('roadmap');
  const [activeDrill, setActiveDrill] = useState<DrillDetail | null>(null);

  const handleDrillClick = (drill: DrillDetail) => {
    setActiveDrill(drill);
  };

  const handleBackToRoadmap = () => {
    setActiveDrill(null);
  };

  const handleAuthSubmit = async (payload: AuthPayload) => {
    try {
      // Determine if this is a signup (has email) or login (no email)
      const isSignup = !!payload.email;
      
      // Call the appropriate API endpoint
      const response = isSignup 
        ? await signup(payload)
        : await login(payload);

      // Store the authentication token
      setAuthToken(response.access_token);

      // TODO: Handle successful authentication (e.g., redirect, update UI state)
      console.log('Authentication successful:', response.user);
    } catch (error) {
      // TODO: Handle authentication errors (e.g., show error message to user)
      console.error('Authentication failed:', error);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex relative">
      {/* Background Texture Layer */}
      <DojoMatBackground />
      <BackgroundTexture />
      <MatteTexture />
      
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
            {activeScreen === 'account' && <AccountScreen onSubmit={handleAuthSubmit} />}
          </>
        )}
      </div>
    </div>
  );
}