import { useMemo, useState, type ReactNode } from 'react';
import { Modal } from '@mantine/core';
import { AuthModalContext, type AuthMode } from './context';
import AuthForms from './AuthForms';

export { useAuthModal } from './context';

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [opened, setOpened] = useState(false);
  const [mode, setMode] = useState<AuthMode>('login');

  const value = useMemo(
    () => ({
      opened,
      mode,
      setMode,
      open: (m: AuthMode = 'login') => {
        setMode(m);
        setOpened(true);
      },
      close: () => setOpened(false),
    }),
    [opened, mode],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        centered
        radius="lg"
        padding="xl"
        size={420}
        withCloseButton={false}
      >
        <AuthForms />
      </Modal>
    </AuthModalContext.Provider>
  );
}
