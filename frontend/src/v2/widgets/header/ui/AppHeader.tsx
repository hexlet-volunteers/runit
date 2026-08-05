import { Link, useLocation } from 'react-router-dom';
import { Box, Button, Container, Group, UnstyledButton } from '@mantine/core';
import { useSession } from '../../../entities/user';
import { useAuthModal } from '../../../features/auth';
import { RunitLogo } from '../../../shared/ui';
import DropdownMenu from './DropdownMenu';
import CabinetMenu from './CabinetMenu';
import MarketingPagesMenu from './MarketingPagesMenu';

/** Шапка сайта: логотип, навигация и меню пользователя.
 *  Контекстная: на маркетинг-страницах и внутри кабинета показывает разный набор действий. */
export default function AppHeader() {
  const { isGuest } = useSession();
  const auth = useAuthModal();
  const { pathname } = useLocation();
  const isCabinet =
    pathname === '/snippets' ||
    pathname === '/settings' ||
    pathname.startsWith('/u/');

  return (
    <Box
      component="header"
      py={14}
      style={{ borderBottom: '1px solid #e9ecef', background: '#fff' }}
    >
      <Container size="lg">
        <Group justify="space-between">
          {isCabinet ? (
            <Group gap="lg">
              <UnstyledButton component={Link} to="/">
                <RunitLogo />
              </UnstyledButton>
              <Button
                color={pathname === '/snippets' ? undefined : 'gray'}
                component={Link}
                to="/snippets"
                variant={pathname === '/snippets' ? 'light' : 'subtle'}
              >
                Мои Сниппеты
              </Button>
            </Group>
          ) : (
            <UnstyledButton component={Link} to="/">
              <RunitLogo />
            </UnstyledButton>
          )}

          <Group gap="sm">
            {!isCabinet && (
              <Button
                color="gray"
                component={Link}
                to="/embedding"
                variant="subtle"
              >
                Встраивание
              </Button>
            )}
            {isGuest ? (
              <>
                <Button
                  color="gray"
                  onClick={() => auth.open('login')}
                  variant="default"
                >
                  Войти
                </Button>
                <Button onClick={() => auth.open('register')}>
                  Регистрация
                </Button>
              </>
            ) : (
              <>
                {isCabinet ? <CabinetMenu /> : <MarketingPagesMenu />}
                <DropdownMenu />
              </>
            )}
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
