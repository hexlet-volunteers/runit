import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { createTRPCClient, httpLink } from '@trpc/client';
import type { AppRouter } from '../../types/router/index';
import { TRPCProvider } from './v2/shared/api';
import V2App from './v2/app';

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
