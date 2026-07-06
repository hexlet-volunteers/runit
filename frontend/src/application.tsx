import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { createTRPCClient, httpLink } from '@trpc/client';
import type { AppRouter } from '../../types/router/index';
import V2App from './v2/App';
import { TRPCProvider } from './utils/trpc';

// Runit v2 (MVP): новый интерфейс живёт в src/v2/ и является приложением по
// умолчанию. Легаси-страницы (src/pages/, src/components/) отключены от
// роутинга, но оставлены в репозитории как справочный материал — их разбор
// идёт в задачах #814 (JS→TS), #816 (Bootstrap→Mantine), #815 (old-landing).

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
