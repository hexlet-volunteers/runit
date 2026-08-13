import { useState } from 'react';
import {
  Box,
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { setCsrfToken, useTRPCClient } from '../../../shared/api';
import { changePassword } from '../../../entities/user';
import { PasswordRequirements } from '../../../features/auth';

/**
 * Смена пароля (#770).
 *
 * Текущий пароль запрашивается всегда — так требует бэкенд, и не зря: без него
 * доступ к открытой вкладке означал бы возможность отобрать аккаунт.
 *
 * Сообщение об ошибке берём с сервера: там формулируются причины отказа
 * (неверный текущий пароль, слабый пароль, пароль уже использовался), и
 * дублировать эти правила на клиенте значит рано или поздно разойтись с ними.
 */
export default function ChangePasswordModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const trpc = useTRPCClient();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setCurrentPassword('');
    setNewPassword('');
    setRepeat('');
    setError(null);
    onClose();
  };

  const mutation = useMutation({
    mutationFn: () => changePassword(trpc, { currentPassword, newPassword }),
    onSuccess: (result) => {
      // Смена пароля гасит прежние сессии и выдаёт новую — вместе с новым
      // CSRF-токеном, иначе следующая мутация из этой вкладки получила бы 403.
      setCsrfToken(result.csrfToken);
      notifications.show({ message: 'Пароль изменён', color: 'green' });
      close();
    },
    onError: (err: unknown) => {
      setError(
        err instanceof Error ? err.message : 'Не удалось сменить пароль',
      );
    },
  });

  const submit = () => {
    setError(null);
    if (newPassword !== repeat) {
      setError('Новый пароль и подтверждение не совпадают');
      return;
    }
    mutation.mutate();
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Смена пароля"
      centered
      radius="lg"
    >
      <Stack gap="md">
        <PasswordInput
          label="Текущий пароль"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.currentTarget.value)}
          autoComplete="current-password"
        />
        <Box>
          <PasswordInput
            label="Новый пароль"
            value={newPassword}
            onChange={(e) => setNewPassword(e.currentTarget.value)}
            autoComplete="new-password"
          />
          {/* Тот же список требований, что и при регистрации: правила должны
              выглядеть одинаково в обоих местах, где задаётся пароль. */}
          <PasswordRequirements value={newPassword} />
        </Box>
        <PasswordInput
          label="Повторите новый пароль"
          value={repeat}
          onChange={(e) => setRepeat(e.currentTarget.value)}
          autoComplete="new-password"
        />

        {error && (
          <Text c="red.7" fz="sm">
            {error}
          </Text>
        )}

        <Text c="dimmed" fz="xs">
          После смены пароля вход на других устройствах потребуется повторить.
        </Text>

        <Group justify="flex-end">
          <Button variant="default" onClick={close}>
            Отмена
          </Button>
          <Button
            loading={mutation.isPending}
            disabled={!currentPassword || !newPassword || !repeat}
            onClick={submit}
          >
            Сменить пароль
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
