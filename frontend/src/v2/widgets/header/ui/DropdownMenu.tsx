import { Link, useNavigate } from 'react-router';
import { Avatar, Menu, UnstyledButton } from '@mantine/core';
import { useSession } from '../../../entities/user';
import { initialsOf } from '../../../shared/lib';

/** Выпадающее меню пользователя: сниппеты, профиль, настройки и выход. */
export default function DropdownMenu() {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  return (
    <Menu position="bottom-end" radius="md" width={200}>
      <Menu.Target>
        <UnstyledButton>
          <Avatar color="blue" radius="xl" variant="filled">
            {initialsOf(user!.username)}
          </Avatar>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{user?.username}</Menu.Label>
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
  );
}
