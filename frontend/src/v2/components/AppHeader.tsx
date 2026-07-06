import { Link, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Container,
  Group,
  Menu,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useSession } from '../session';
import { useAuthModal } from './AuthModal/context';

export function RunitLogo({ size = 28 }: { size?: number }) {
  return (
    <Group gap={8} wrap="nowrap">
      <Box
        w={size}
        h={size}
        style={{
          borderRadius: 8,
          background: 'var(--mantine-color-blue-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="white">
          <path d="M8 5v14l11-7z" />
        </svg>
      </Box>
      <Text fw={800} fz={size * 0.7} c="dark.9">
        Runit
      </Text>
    </Group>
  );
}

export function initialsOf(name: string): string {
  // TODO(#530, #536): единый компонент аватара-инициалов вместо base64-загрузок.
  return name
    .split(/[\s_.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export default function AppHeader() {
  const { user, isGuest, logout } = useSession();
  const auth = useAuthModal();
  const navigate = useNavigate();

  return (
    <Box component="header" py={14} style={{ borderBottom: '1px solid #e9ecef', background: '#fff' }}>
      <Container size="lg">
        <Group justify="space-between">
          <UnstyledButton component={Link} to="/">
            <RunitLogo />
          </UnstyledButton>

          <Group gap="sm">
            {isGuest ? (
              <>
                <Button variant="subtle" color="gray" onClick={() => auth.open('login')}>
                  Войти
                </Button>
                <Button onClick={() => auth.open('register')}>Регистрация</Button>
              </>
            ) : (
              <>
                <Button variant="subtle" color="gray" component={Link} to="/snippets">
                  Мои сниппеты
                </Button>
                <Button component={Link} to="/editor">
                  Новый сниппет
                </Button>
                <Menu position="bottom-end" width={200} radius="md">
                  <Menu.Target>
                    <UnstyledButton>
                      <Avatar color="blue" radius="xl">
                        {initialsOf(user!.username)}
                      </Avatar>
                    </UnstyledButton>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>
                      {user!.username}
                    </Menu.Label>
                    <Menu.Item component={Link} to="/snippets">
                      Мои сниппеты
                    </Menu.Item>
                    <Menu.Item component={Link} to={`/u/${user!.username}`}>
                      Профиль
                    </Menu.Item>
                    <Menu.Item component={Link} to="/settings">
                      Настройки
                    </Menu.Item>
                    <Menu.Divider />
                    <Menu.Item
                      color="red"
                      onClick={() => {
                        logout();
                        navigate('/');
                      }}
                    >
                      Выйти
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </>
            )}
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
