import { Center, Loader } from '@mantine/core';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useSession } from '../entities/user';

/**
 * Маршруты только для вошедших (#898).
 *
 * Гейт стоит на уровне роутера, а не внутри страниц, по двум причинам.
 *
 * Первая: страница кабинета вызывает useManageSnippets(user!.id) прямо в теле
 * компонента, и у гостя это падало с TypeError ещё до того, как срабатывал
 * useEffect с редиректом — то есть «редирект гостей» не работал вовсе.
 *
 * Вторая: сессия восстанавливается асинхронно (auth.me по cookie), поэтому в
 * первом кадре вошедший пользователь неотличим от гостя. Проверять это внутри
 * страницы значит либо мигать лендингом при каждой перезагрузке /snippets,
 * либо ставить ранний return перед хуками и ломать их порядок.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const { isGuest, isLoading } = useSession();

  if (isLoading) {
    return (
      <Center h="60vh">
        <Loader />
      </Center>
    );
  }

  if (isGuest) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
