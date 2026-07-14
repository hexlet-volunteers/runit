import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Group,
  Modal,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { useTRPCClient } from '../../../shared/api';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { useSession } from '../../../entities/user';

/** Вкладка «Аккаунт»: email, пароль, активные сессии, удаление аккаунта. */
export default function AccountTab() {
  const { user, logout } = useSession();
  const trpc = useTRPCClient();
  const navigate = useNavigate();
  const [confirmOpened, setConfirmOpened] = useState(false);

  /** Мутация удаления аккаунта и всех сниппетов. TODO(#834): каскадная очистка. */
  const deleteMutation = useMutation({
    mutationFn: () => trpc.users.deleteUser.mutate({ id: user!.id }),
    onSuccess: () => {
      notifications.show({ message: 'Аккаунт удалён', color: 'gray' });
      logout();
      navigate('/');
    },
    onError: () => {
      notifications.show({
        message: 'Не удалось удалить аккаунт. Попробуйте позже.',
        color: 'red',
      });
    },
  });

  return (
    <Stack gap="lg" mt="lg">
      <Card withBorder radius="lg" p="xl">
        <Text fw={600} mb="md">
          Электронная почта
        </Text>
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm">
            <Text>{user?.email}</Text>
            {/* TODO(#416, #472): реальное подтверждение почты письмом */}
            <Badge variant="light" color="gray">
              Подтверждена
            </Badge>
          </Group>
          <Tooltip label="В разработке (#416/#472)">
            <Button variant="default" data-disabled onClick={(e) => e.preventDefault()}>
              Сменить
            </Button>
          </Tooltip>
        </Group>
      </Card>

      <Card withBorder radius="lg" p="xl">
        <Text fw={600} mb="md">
          Пароль
        </Text>
        <Group justify="space-between" wrap="nowrap">
          <Text c="dimmed" fz="sm">
            Регулярная смена пароля повышает безопасность аккаунта.
          </Text>
          {/* TODO(#770, #640): смена пароля через бэкенд */}
          <Tooltip label="В разработке (#770/#640)">
            <Button variant="default" data-disabled onClick={(e) => e.preventDefault()}>
              Сменить пароль
            </Button>
          </Tooltip>
        </Group>
      </Card>

      <Card withBorder radius="lg" p="xl">
        <Text fw={600} mb="md">
          Активные сессии
        </Text>
        <Group justify="space-between">
          <Text>Этот браузер</Text>
          <Badge variant="light" color="green">
            Текущая
          </Badge>
        </Group>
        {/* TODO(#833): список активных сессий с бэкенда */}
        <Text c="dimmed" fz="sm" mt="sm">
          Список сессий появится позже (#833)
        </Text>
      </Card>

      <Card
        withBorder
        radius="lg"
        p="xl"
        style={{ borderColor: 'var(--mantine-color-red-3)' }}
      >
        <Text fw={600} c="red.7" mb="md">
          Удаление аккаунта
        </Text>
        <Group justify="space-between" wrap="nowrap" align="center">
          <Text c="dimmed" fz="sm">
            Аккаунт и все сниппеты будут удалены безвозвратно. Это действие нельзя
            отменить.
          </Text>
          <Button color="red" variant="outline" onClick={() => setConfirmOpened(true)}>
            Удалить аккаунт
          </Button>
        </Group>
      </Card>

      <Modal
        opened={confirmOpened}
        onClose={() => setConfirmOpened(false)}
        title="Удалить аккаунт?"
        centered
        radius="lg"
      >
        <Text fz="sm" mb="lg">
          Аккаунт <b>@{user?.username}</b> и все его сниппеты будут удалены
          безвозвратно. Это действие нельзя отменить.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setConfirmOpened(false)}>
            Отмена
          </Button>
          <Button
            color="red"
            loading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            Удалить навсегда
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}