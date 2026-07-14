import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useTRPCClient } from '../utils/trpc';

// TODO(#639, #792): мок-сессия до появления настоящей авторизации на бэкенде.
// login не проверяет пароль (bcrypt-контур появится в #791/#639), сессия живёт
// в localStorage. Контракт хука сохранится при переходе на реальный auth.

export type SessionUser = {
  id: number;
  username: string;
  email: string;
};

type SessionContextValue = {
  user: SessionUser | null;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  register: (username: string, email: string, password: string) => Promise<SessionUser>;
  logout: () => void;
};

const STORAGE_KEY = 'runit.v2.session';

const SessionContext = createContext<SessionContextValue | null>(null);

const readStored = (): SessionUser | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const trpc = useTRPCClient();
  const [user, setUser] = useState<SessionUser | null>(readStored);

  const persist = useCallback((u: SessionUser | null) => {
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
    setUser(u);
  }, []);

  const login = useCallback(
    async (email: string, _password: string) => {
      // TODO(#639): реальная проверка пароля на сервере.
      const found = await trpc.users.getUserByEmail.query(email);
      const u: SessionUser = {
        id: found.id,
        username: found.username,
        email: found.email,
      };
      persist(u);
      return u;
    },
    [trpc, persist],
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const created = await trpc.users.createUser.mutate({
        username,
        email,
        password,
      });
      const u: SessionUser = {
        id: created.id,
        username: created.username,
        email: created.email,
      };
      persist(u);
      return u;
    },
    [trpc, persist],
  );

  const logout = useCallback(() => persist(null), [persist]);

  const value = useMemo(
    () => ({ user, isGuest: !user, login, register, logout }),
    [user, login, register, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
