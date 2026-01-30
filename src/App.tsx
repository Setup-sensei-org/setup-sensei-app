import { useEffect, useState } from 'react';
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
import {
  DrillDetail,
  RoadmapNode,
  SessionAnalytics,
  DrillOverview,
  AuthPayload,
} from './types';
import {
  login,
  signup,
  setAuthToken,
  isAuthenticated,
  getRoadmapNodes,
  getSessionAnalytics,
  getDrills,
} from './services/api';

type Screen = 'roadmap' | 'analytics' | 'account';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('roadmap');
  const [activeDrill, setActiveDrill] = useState<DrillDetail | null>(null);
  const [roadmapNodes, setRoadmapNodes] = useState<RoadmapNode[] | undefined>();
  const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalytics | undefined>();
  const [drills, setDrills] = useState<DrillOverview[] | undefined>();
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  const handleDrillClick = (drill: DrillDetail) => {
    setActiveDrill(drill);
  };

  const handleBackToRoadmap = () => {
    setActiveDrill(null);
  };

  const loadData = async () => {
    try {
      const [nodesResult, analyticsResult, drillsResult] = await Promise.all([
        getRoadmapNodes().catch((error) => {
          console.error('Failed to load roadmap nodes', error);
          return undefined;
        }),
        getSessionAnalytics().catch((error) => {
          console.error('Failed to load session analytics', error);
          return undefined;
        }),
        getDrills().catch((error) => {
          console.error('Failed to load drills', error);
          return undefined;
        }),
      ]);

      if (nodesResult) setRoadmapNodes(nodesResult);
      if (analyticsResult) setSessionAnalytics(analyticsResult);
      if (drillsResult) setDrills(drillsResult);
    } catch (error) {
      console.error('Failed to load data from Supabase', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      setAuthenticated(true);
      loadData();
    }
  }, []);

  const handleAuthSubmit = async (payload: AuthPayload, mode: 'login' | 'signup') => {
    try {
      const response = mode === 'signup'
        ? await signup(payload)
        : await login(payload);

      // Store the authentication token
      setAuthToken(response.access_token);

      setAuthenticated(true);
      loadData();

      // After successful auth, send user to the roadmap
      setActiveDrill(null);
      setActiveScreen('roadmap');

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
            {activeScreen === 'roadmap' && (
              <RoadmapLanding
                onDrillClick={handleDrillClick}
                roadmapNodes={roadmapNodes}
                drills={drills}
              />
            )}
            {activeScreen === 'analytics' && (
              <AnalyticsScreen analytics={sessionAnalytics} />
            )}
            {activeScreen === 'account' && <AccountScreen onSubmit={handleAuthSubmit} />}
          </>
        )}
      </div>
    </div>
  );
}