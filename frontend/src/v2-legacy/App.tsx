import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { Center, Loader, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

import { v2Theme } from './theme';
import { SessionProvider } from './session';
import { AuthModalProvider } from './components/AuthModal';

const Landing = lazy(() => import('./pages/Landing'));
const Editor = lazy(() => import('./pages/Editor'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Share = lazy(() => import('./pages/Share'));
const Embed = lazy(() => import('./pages/Embed'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Legal = lazy(() => import('./pages/Legal'));
const NotFound = lazy(() => import('./pages/NotFound'));

function Fallback() {
  return (
    <Center h="60vh">
      <Loader />
    </Center>
  );
}

export default function V2App() {
  return (
    <MantineProvider theme={v2Theme} withCssVariables withStaticClasses>
      <Notifications position="bottom-center" />
      <SessionProvider>
        <AuthModalProvider>
          <Suspense fallback={<Fallback />}>
            <Routes>
              <Route index element={<Landing />} />
              <Route path="/editor" element={<Editor />} />
              <Route path="/editor/:id" element={<Editor />} />
              <Route path="/snippets" element={<Dashboard />} />
              <Route path="/s/:username/:slug" element={<Share />} />
              <Route path="/embed/:username/:slug" element={<Embed />} />
              <Route path="/u/:username" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/legal" element={<Legal />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthModalProvider>
      </SessionProvider>
    </MantineProvider>
  );
}
