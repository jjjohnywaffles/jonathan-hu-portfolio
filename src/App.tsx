import { useState, useEffect, lazy, Suspense } from 'react';
import { Desktop } from './components/Desktop';

const TrelloApp = lazy(() => import('./trello/TrelloApp').then((m) => ({ default: m.TrelloApp })));

function App() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (path.startsWith('/trello')) {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-white">
            <div className="text-blue-500">Loading Trello...</div>
          </div>
        }
      >
        <TrelloApp />
      </Suspense>
    );
  }

  return <Desktop />;
}

export default App;
