import { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { GraphView } from './pages/GraphView';
import { SentenceAnalyzer } from './components/SentenceAnalyzer';
import { api } from './services/api';

type ViewMode = 'landing' | 'dashboard' | 'graph';

function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function App() {
  const [view, setView] = useState<ViewMode>('landing');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [seedCount, setSeedCount] = useState<number>(0);

  // Guest Session States
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem('synonym_link_username'));
  const [currentUuid, setCurrentUuid] = useState<string | null>(() => localStorage.getItem('synonym_link_uuid'));

  // Sync theme class with HTML document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Fetch word count for the current session to show in the UI
  useEffect(() => {
    if (!currentUser || !currentUuid) {
      return;
    }

    let active = true;
    api.getGraph()
      .then(graph => {
        if (active) {
          setSeedCount(graph.nodes.length);
        }
      })
      .catch(err => {
        console.warn('Backend API not reachable on initial mount.', err);
      });

    return () => {
      active = false;
    };
  }, [currentUser, currentUuid]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleOpenGraph = () => setView('graph');
  const handleOpenDashboard = () => setView('dashboard');
  const handleOpenLanding = () => setView('landing');

  // Callback to establish guest session
  const handleStartSession = (username: string, isNewSession: boolean) => {
    let uuid = localStorage.getItem('synonym_link_uuid');
    if (isNewSession || !uuid) {
      uuid = generateUUID();
      localStorage.setItem('synonym_link_uuid', uuid);
      // Reset the frontend's cache marker of seeding status for new sessions
      localStorage.removeItem('synonyms_seeded');
    }
    localStorage.setItem('synonym_link_username', username);
    
    setCurrentUser(username);
    setCurrentUuid(uuid);
    
    // Switch to dashboard first, then fetch stats once the headers are bound
    setView('dashboard');
  };

  // Callback to clear/logout of the current session
  const handleResetSession = () => {
    localStorage.removeItem('synonym_link_username');
    localStorage.removeItem('synonym_link_uuid');
    localStorage.removeItem('synonyms_seeded');
    setCurrentUser(null);
    setCurrentUuid(null);
    setSeedCount(0);
    setView('landing');
  };

  // If no guest session is established, user is locked to the landing page
  const activeView = (currentUser && currentUuid) ? view : 'landing';

  // Render view dynamically
  switch (activeView) {
    case 'graph':
      return <GraphView onBackToDashboard={handleOpenDashboard} />;
    case 'dashboard':
      return (
        <Dashboard
          onOpenGraph={handleOpenGraph}
          onBackToLanding={handleOpenLanding}
          theme={theme}
          toggleTheme={toggleTheme}
          renderAnalyzer={() => <SentenceAnalyzer />}
          seedCount={seedCount}
          setSeedCount={setSeedCount}
          currentUser={currentUser}
          onResetSession={handleResetSession}
        />
      );
    case 'landing':
    default:
      return (
        <LandingPage
          onStartSession={handleStartSession}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      );
  }
}
