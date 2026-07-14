import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

// Runit v2: лёгкие глобальные стили вместо легаси bootstrap-сборки
// (application.scss остаётся для справки — см. #816).
import './global.css';

import { v2Theme } from './theme';
import { SessionProvider } from '../entities/user';
import { AuthModalProvider } from '../features/auth';

export default function AppProviders({children}) {
  return (
    <MantineProvider theme={v2Theme} withCssVariables withStaticClasses>
      <Notifications position="bottom-center" />
      <SessionProvider>
        <AuthModalProvider>
           {children}
        </AuthModalProvider>
      </SessionProvider>
    </MantineProvider>
  );
}