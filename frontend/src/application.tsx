import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { createTRPCClient, httpLink } from '@trpc/client';
import type { AppRouter } from '../../types/router/index';
import { TRPCProvider } from './v2/shared/api';
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
