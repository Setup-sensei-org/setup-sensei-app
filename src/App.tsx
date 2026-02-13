import { useEffect, useState } from 'react';
import { RoadmapLanding } from './components/RoadmapLanding';
import { AnalyticsScreen } from './components/screens/AnalyticsScreen';
import { AccountScreen } from './components/screens/AccountScreen';
import { ActiveDrillScreen } from './components/screens/ActiveDrillScreen';
import { TrainingScreen } from './components/screens/TrainingScreen';
import { TrainDrillScreen } from './components/screens/TrainDrillScreen';
import { SideNavRail } from './components/SideNavRail';
import { BackgroundTexture } from './components/BackgroundTexture';
import { MatteTexture } from './components/MatteTexture';
import { DojoMatBackground } from './components/DojoMatBackground';
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
  loginWithGoogle,
  initAuthFromSupabaseSession,
  getRoadmapNodes,
  getSessionAnalytics,
  getDrills,
} from './services/api';

type Screen = 'roadmap' | 'analytics' | 'training' | 'account';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('roadmap');
  const [activeDrill, setActiveDrill] = useState<DrillDetail | null>(null);
  const [showTrainDrill, setShowTrainDrill] = useState(false);
  const [roadmapNodes, setRoadmapNodes] = useState<RoadmapNode[] | undefined>();
  const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalytics | undefined>();
  const [drills, setDrills] = useState<DrillOverview[] | undefined>();
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

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
    const initAuth = async () => {
      // 1) If we already have a stored access token, trust it
      if (isAuthenticated()) {
        setAuthenticated(true);
        await loadData();
        return;
      }

      // 2) Otherwise, check if Supabase already has an active session
      //    (e.g. after a Google OAuth redirect) and sync it
      const hasSession = await initAuthFromSupabaseSession();
      if (hasSession) {
        setAuthenticated(true);
        await loadData();
      }
    };

    void initAuth();
  }, []);

  const handleAuthSubmit = async (payload: AuthPayload, mode: 'login' | 'signup') => {
    setAuthError(null);
    try {
      const response = mode === 'signup'
        ? await signup(payload)
        : await login(payload);

      setAuthToken(response.access_token);
      setAuthenticated(true);
      loadData();

      setActiveDrill(null);
      setActiveScreen('roadmap');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      setAuthError(message);
      console.error('Authentication failed:', error);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      await loginWithGoogle();
      // On success, Supabase will redirect; when the app reloads,
      // initAuthFromSupabaseSession will pick up the session.
    } catch (error) {
      console.error('Google authentication failed:', error);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex relative">
      {/* Background Texture Layer */}
      <DojoMatBackground />
      <BackgroundTexture />
      <MatteTexture />
      
      {/* Side Navigation Rail */}
      <SideNavRail activeScreen={activeScreen} onNavigate={(screen) => {
        setActiveScreen(screen);
        setActiveDrill(null);
        setShowTrainDrill(false);
      }} />

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
            {activeScreen === 'training' && (
              showTrainDrill ? (
                <TrainDrillScreen onBack={() => setShowTrainDrill(false)} />
              ) : (
                <TrainingScreen onStartTrainDrill={() => setShowTrainDrill(true)} />
              )
            )}
            {activeScreen === 'account' && (
              <AccountScreen
                onSubmit={handleAuthSubmit}
                onGoogleAuth={handleGoogleAuth}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}