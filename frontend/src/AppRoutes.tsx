/* eslint-disable react/jsx-sort-props */
import { Suspense, lazy, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useTernaryDarkMode } from 'usehooks-ts';

import type { RootReducerType } from './types/slices';

import { useAuth } from './hooks';
import Layout from './pages/Layout';
import routes from './routes';
import ScrollToTop from './utils/scrollToTop.js';

import DefaultLoader from './components/Loaders/DefaultLoader';
import ProfileEditPage from './pages/ProfileEditFormPage/ProfileEditForm';

const ProfilePageNew = lazy(() => import('./pages/ProfilePage'));

const Landing = lazy(() => import('./pages/landing/home-page'));

const SettingsPage = lazy(() => import('./pages/settings'));
const SnippetPage = lazy(() => import('./pages/snippet'));
const AboutPage = lazy(() => import('./pages/about'));
const SignUpPage = lazy(() => import('./pages/signup'));
const SignInPage = lazy(() => import('./pages/signin'));
const LicenseAgreement = lazy(() => import('./pages/license-agreement'));
const PrivacyPolicy = lazy(() => import('./pages/privacyPolicy'));
const PublicOffer = lazy(() => import('./pages/publicOffer'));
const ConsentToProcesing = lazy(() => import('./pages/consentToProcessing'));
const ForgotPasswordPage = lazy(() => import('./pages/forgot-password'));
const ResetPasswordPage = lazy(() => import('./pages/reset-password'));
const NotFoundPage = lazy(() => import('./pages/404'));
const EmbeddedPage = lazy(() => import('./pages/embed'));

function MyProfileRoute() {
  const username = useSelector(
    (state: RootReducerType) => state.user.userInfo.username,
  );

  return <Navigate to={routes.profilePagePath(username)} replace />;
}

function ProtectedRoute({ redirectTo = routes.homePagePath(), isAllowed }) {
  if (isAllowed) {
    return <Outlet />;
  }

  return <Navigate to={redirectTo} replace />;
}

function AppRoutes() {
  const { isLoggedIn } = useAuth();
  const { isDarkMode } = useTernaryDarkMode();

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-bs-theme',
      isDarkMode ? 'dark' : 'light',
    );
  }, [isDarkMode]);

  return (
    <Suspense fallback={<DefaultLoader />}>
      <ScrollToTop />
      <Routes>
        <Route path={routes.profilePageNew()} element={<ProfilePageNew />} />
        <Route path={routes.editProfilePath()} element={<ProfileEditPage />} />
        <Route
          path={routes.licenseAgreementPath()}
          element={<LicenseAgreement />}
        />
        <Route path={routes.privacyPolicyPath()} element={<PrivacyPolicy />} />
        <Route path={routes.publicOfferPath()} element={<PublicOffer />} />
        <Route
          path={routes.consentToProcessingPath()}
          element={<ConsentToProcesing />}
        />
        <Route
          element={
            <ProtectedRoute
              // FIXME: Всегда isAllowed пока не готова авторизация
              // isAllowed={!isLoggedIn}
              isAllowed
              redirectTo={routes.myProfilePagePath()}
            />
          }
        >
          <Route index element={<Landing />} />
        </Route>
        <Route element={<Layout />}>
          <Route path={routes.homePagePath()} element={<SnippetPage />} />
          <Route path={routes.snippetPagePath()} element={<SnippetPage />} />
          <Route path={routes.aboutPagePath()} element={<AboutPage />} />
          <Route
            element={
              <ProtectedRoute
                isAllowed={isLoggedIn}
                redirectTo={routes.signInPagePath()}
              />
            }
          >
            <Route
              path={routes.settingsPagePath()}
              element={<SettingsPage />}
            />
          </Route>

          <Route
            element={
              <ProtectedRoute
                isAllowed={!isLoggedIn}
                redirectTo={routes.myProfilePagePath()}
              />
            }
          >
            <Route path={routes.signUpPagePath()} element={<SignUpPage />} />
            <Route path={routes.signInPagePath()} element={<SignInPage />} />
          </Route>

          <Route
            path={routes.forgotPassPagePath()}
            element={<ForgotPasswordPage />}
          />
          <Route
            path={routes.resetPassPagePath()}
            element={<ResetPasswordPage />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route
          path={routes.embedSnippetPagePath()}
          element={<EmbeddedPage />}
        />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
