import { createContext, useContext } from 'react';

export type AuthMode = 'login' | 'register' | 'reset';

export type AuthModalContextValue = {
  open: (mode?: AuthMode) => void;
  close: () => void;
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  opened: boolean;
};

export const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider');
  return ctx;
}
