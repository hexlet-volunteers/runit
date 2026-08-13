import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { createTRPCClient, httpLink } from '@trpc/client';
import type { AppRouter } from '../../types/router/index';
import { TRPCProvider, getCsrfToken } from './v2/shared/api';
import { initMonitoring } from './v2/shared/monitoring/sentry';
import V2App from './v2/app';

// До создания дерева: иначе ошибки самой инициализации приложения не попадут
// в отчёты. Без VITE_SENTRY_DSN вызов ничего не делает.
initMonitoring();

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  });

export default async () => {
  const queryClient = makeQueryClient();
  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: '/trpc',
        /**
         * Сессия живёт в httpOnly-cookie (#861), а fetch по умолчанию их не
         * отправляет — без credentials каждый запрос уходил бы как от гостя.
         */
        fetch: (url, options) =>
          fetch(url, { ...options, credentials: 'include' }),
        headers: () => {
          const csrfToken = getCsrfToken();
          return csrfToken ? { 'csrf-token': csrfToken } : {};
        },
      }),
    ],
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
        <BrowserRouter>
          <V2App />
        </BrowserRouter>
      </TRPCProvider>
    </QueryClientProvider>
  );
};
