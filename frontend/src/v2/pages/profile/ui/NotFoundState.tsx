import { Link } from 'react-router-dom';
import {
  Button,
  Center,
  Stack,
  Text,
  Title,
} from '@mantine/core';

/**
 * Состояние «Пользователь не найден».
 * Показывается при ошибке загрузки профиля или отсутствии пользователя.
 * Содержит кнопку возврата на главную.
 */
export default function NotFoundState({ username }: { username: string }) {
  return (
    <Center py={80}>
      <Stack align="center" gap="sm">
        <Title order={2}>Пользователь не найден</Title>
        <Text c="dimmed" ta="center">
          Профиля @{username} не существует или он был удалён.
        </Text>
        <Button component={Link} to="/" mt="sm">
          На главную
        </Button>
      </Stack>
    </Center>
  );
}