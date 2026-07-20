export type AuthMode = 'login' | 'register' | 'reset';

export type AuthModalContextValue = {
  open: (mode?: AuthMode) => void;
  close: () => void;
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  opened: boolean;
};