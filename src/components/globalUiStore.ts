export type BannerTone = 'error' | 'success' | 'info';

export type GlobalTopBannerState = {
  tone: BannerTone;
  message: string;
};

export type SessionExpiredPromptState = {
  fromPath: string;
  requiresAuthRoute: boolean;
};

type GlobalUiState = {
  banner: GlobalTopBannerState | null;
  sessionExpiredPrompt: SessionExpiredPromptState | null;
};

type Listener = () => void;

let globalUiState: GlobalUiState = {
  banner: null,
  sessionExpiredPrompt: null,
};

const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

export function subscribeGlobalUi(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getGlobalUiState(): GlobalUiState {
  return globalUiState;
}

export function showGlobalTopBanner(input: GlobalTopBannerState) {
  globalUiState = {
    ...globalUiState,
    banner: input,
  };
  notifyListeners();
}

export function clearGlobalTopBanner() {
  if (!globalUiState.banner) {
    return;
  }

  globalUiState = {
    ...globalUiState,
    banner: null,
  };
  notifyListeners();
}

export function requestSessionExpiredPrompt(input: SessionExpiredPromptState) {
  if (globalUiState.sessionExpiredPrompt) {
    return;
  }

  globalUiState = {
    ...globalUiState,
    sessionExpiredPrompt: input,
  };
  notifyListeners();
}

export function clearSessionExpiredPrompt() {
  if (!globalUiState.sessionExpiredPrompt) {
    return;
  }

  globalUiState = {
    ...globalUiState,
    sessionExpiredPrompt: null,
  };
  notifyListeners();
}

export function resetGlobalUiState() {
  globalUiState = {
    banner: null,
    sessionExpiredPrompt: null,
  };
  notifyListeners();
}
