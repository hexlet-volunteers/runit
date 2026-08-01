import { useState } from 'react';
import {
  Alert,
  Anchor,
  Button,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useAuthModal, validateEmail, validatePassword, titles } from '..';
import { useSession } from '../../../entities/user';
import FormHeader from './FormHeader';

export default function LoginForm() {
  const { setMode, close } = useAuthModal();
  const { login } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: validateEmail,
      password: validatePassword,
    },
  });

  const handleSubmit = form.onSubmit(async ({ email, password }) => {
    setError(null);
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      close();
      notifications.show({
        title: 'С возвращением!',
        message: `Вы вошли как ${user.username}`,
        color: 'green',
      });
    } catch {
      setError('Пользователь не найден');
    } finally {
      setLoading(false);
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <FormHeader title={titles.login} onClose={close} />
        {error && (
          <Alert color="red" radius="md">
            {error}
          </Alert>
        )}
        <TextInput
          label="Электронная почта"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          {...form.getInputProps('email')}
        />
        <div>
          <Group justify="space-between" mb={5}>
            <Text component="label" htmlFor="login-password" size="sm" fw={500}>
              Пароль
            </Text>
            <Anchor component="button" type="button" size="sm" onClick={() => setMode('reset')}>
              Забыли пароль?
            </Anchor>
          </Group>
          <PasswordInput
            id="login-password"
            placeholder="Ваш пароль"
            autoComplete="current-password"
            {...form.getInputProps('password')}
          />
        </div>
        <Button type="submit" size="md" radius="md" fullWidth loading={loading}>
          Войти
        </Button>
        <Text size="sm" c="dimmed" ta="center">
          Нет аккаунта?{' '}
          <Anchor component="button" type="button" fw={600} onClick={() => setMode('register')}>
            Зарегистрироваться
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}