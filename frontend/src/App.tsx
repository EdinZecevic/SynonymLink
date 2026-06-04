import { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { GraphView } from './pages/GraphView';
import { SentenceAnalyzer } from './components/SentenceAnalyzer';
import { api } from './services/api';

type ViewMode = 'landing' | 'dashboard' | 'graph';

export default function App() {
  const [view, setView] = useState<ViewMode>('landing');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [seedCount, setSeedCount] = useState<number>(0);

  // Sync theme class with HTML document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Fetch initial word count on mount (to reflect pre-seeded data)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const graph = await api.getGraph();
        setSeedCount(graph.nodes.length);
      } catch (err) {
        console.warn('Backend API not reachable on initial mount.', err);
      }
    };
    fetchStats();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleOpenGraph = () => setView('graph');
  const handleOpenDashboard = () => setView('dashboard');
  const handleOpenLanding = () => setView('landing');

  // Render view dynamically
  switch (view) {
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
        />
      );
    case 'landing':
    default:
      return (
        <LandingPage
          onGetStarted={handleOpenDashboard}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      );
  }
}
