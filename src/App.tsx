import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useSyncExternalStore } from 'react';
import { clearSession, dismissSessionExpiredPrompt } from './auth/session';
import { GlobalTopBanner } from './components/GlobalTopBanner';
import { SessionExpiredDialog } from './components/SessionExpiredDialog';
import {
  clearGlobalTopBanner,
  clearSessionExpiredPrompt,
  getGlobalUiState,
  subscribeGlobalUi,
} from './components/globalUiStore';

export default function App() {
  const globalUiState = useSyncExternalStore(subscribeGlobalUi, getGlobalUiState, getGlobalUiState);
  const sessionPrompt = globalUiState.sessionExpiredPrompt;

  function handleConfirmSessionRelogin() {
    if (!sessionPrompt) {
      return;
    }

    clearSession();
    dismissSessionExpiredPrompt();
    void router.navigate('/login', {
      replace: true,
      state: { from: sessionPrompt.fromPath },
    });
  }

  function handleCancelSessionRelogin() {
    if (!sessionPrompt) {
      return;
    }

    clearSession();
    clearSessionExpiredPrompt();

    if (!sessionPrompt.requiresAuthRoute) {
      return;
    }

    void router.navigate('/', { replace: true });
  }

  return (
    <>
      <RouterProvider router={router} />
      {globalUiState.banner ? (
        <GlobalTopBanner tone={globalUiState.banner.tone} message={globalUiState.banner.message} onClose={clearGlobalTopBanner} />
      ) : null}
      <SessionExpiredDialog
        open={Boolean(sessionPrompt)}
        onConfirm={handleConfirmSessionRelogin}
        onCancel={handleCancelSessionRelogin}
      />
    </>
  );
}
