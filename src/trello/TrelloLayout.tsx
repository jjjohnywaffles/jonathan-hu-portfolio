import { useEffect, memo, type ReactNode } from 'react';
import { NotificationProvider } from './components/NotificationContext';
import { NotificationToast } from './components/NotificationToast';
import { TrelloUIProvider } from './components/TrelloUIContext';
import { GlobalCardModal } from './components/GlobalCardModal';
import { TrelloUrlSync } from './components/TrelloUrlSync';
import { IconError } from './components/icons/system/icon-error';
import { initializeTrelloStore, useTrelloStore } from '@trello/_lib';
import { getTrelloBrandName } from '@trello/_lib/utils/brand';

const TrelloLayout: React.FC<{ children: ReactNode }> = memo(function TrelloLayout({ children }) {
  useEffect(() => {
    initializeTrelloStore();
  }, []);

  // Override the portfolio's dark body styles so dark mode extensions
  // treat this page as light-themed (matching the original Trello clone)
  useEffect(() => {
    const body = document.body;
    const prevBg = body.style.background;
    const prevColor = body.style.color;
    body.style.background = '#ffffff';
    body.style.color = '#172b4d';
    return () => {
      body.style.background = prevBg;
      body.style.color = prevColor;
    };
  }, []);

  const status = useTrelloStore((state) => state.status);

  const systemFont =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", Ubuntu, "Droid Sans", "Helvetica Neue", sans-serif';

  if ([`idle`, `loading`].includes(status)) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-white"
        style={{ fontFamily: systemFont }}
      >
        <div className="text-center">
          <div className="mb-4 text-blue-500">Loading...</div>
          <div className="text-gray-600">Please wait while {getTrelloBrandName()} loads</div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-white"
        style={{ fontFamily: systemFont }}
      >
        <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
          <IconError className="h-12 w-12 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-800">Error Loading {getTrelloBrandName()}</h1>
          <p className="max-w-md text-gray-600">
            The session does not exist or failed to load. Please check your session ID and try
            again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: systemFont, colorScheme: 'light' }}>
      <TrelloUIProvider>
        <NotificationProvider>
          <TrelloUrlSync />
          <div id="clone-root" className="h-dvh w-dvw overflow-hidden bg-blue-700">
            {children}
            <NotificationToast />
            <GlobalCardModal />
          </div>
        </NotificationProvider>
      </TrelloUIProvider>
    </div>
  );
});

export default TrelloLayout;
