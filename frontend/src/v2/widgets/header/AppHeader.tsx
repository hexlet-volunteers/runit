import { Link, useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Container,
  Group,
  Menu,
  UnstyledButton,
} from '@mantine/core';
import { useSession } from '../../entities/user';
import { useAuthModal } from '../../features/auth';
import { RunitLogo } from '../../shared/ui'
import { initialsOf } from '../../shared/lib/initialsOf'

// TODO: провести рефакторинг архитектуры (выделить в отдельную таску)
/** Компонент шапки сайта с логотипом, навигацией и меню пользователя. */
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
            <Button variant="subtle" color="gray" component={Link} to="/#embedding">
              Встраивание
            </Button>
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
