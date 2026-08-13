export type SessionUser = {
  id: number;
  username: string;
  email: string;
};

export type SessionContextValue = {
  user: SessionUser | null;
  isGuest: boolean;
  /** true, пока идёт восстановление сессии запросом auth.me при старте. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  register: (username: string, email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
};
