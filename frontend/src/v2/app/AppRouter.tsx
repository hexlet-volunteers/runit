import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';

const Landing = lazy(() => import('../pages/landing/index'));
const Editor = lazy(() => import('../pages/editor/index'));
const Dashboard = lazy(() => import('../pages/dashboard/index'));
const Share = lazy(() => import('../pages/share/index'));
const Embed = lazy(() => import('../pages/embed/index'));
const Profile = lazy(() => import('../pages/profile/index'));
const Settings = lazy(() => import('../pages/settings/index'));
const Legal = lazy(() => import('../pages/legal/index'));
const NotFound = lazy(() => import('../pages/not-found/index'));

function Fallback() {
  return (
    <Center h="60vh">
      <Loader />
    </Center>
  );
}

export default function AppRouter() {
  return (
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
  );
}
