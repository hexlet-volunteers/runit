export type SessionUser = {
  id: number;
  username: string;
  email: string;
};

export type SessionContextValue = {
  user: SessionUser | null;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  register: (username: string, email: string, password: string) => Promise<SessionUser>;
  logout: () => void;
};