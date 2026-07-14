import { Link } from 'react-router-dom';
import {
  Button,
  Center,
  Stack,
  Text,
  Title,
} from '@mantine/core';

/** Заглушка «Сниппет не найден» со ссылкой на главную. */
export default function NotFoundState() {
  return (
    <Center py={120}>
      <Stack align="center" gap="md">
        <Title order={2}>Сниппет не найден</Title>
        <Text c="dimmed">Возможно, ссылка устарела или сниппет был удалён.</Text>
        <Button component={Link} to="/">
          На главную
        </Button>
      </Stack>
    </Center>
  );
}