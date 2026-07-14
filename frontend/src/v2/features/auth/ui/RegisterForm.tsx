import { useState } from 'react';
import {
  Alert,
  Anchor,
  Button,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Link } from 'react-router-dom';
import { useAuthModal } from '../context';
import { useSession } from '../../../entities/user';
import FormHeader from './FormHeader';
import { validateEmail, validatePassword, validateUsername } from '../lib/validate';
import { titles } from '../lib/constants';


export default function RegisterForm() {
  const { setMode, close } = useAuthModal();
  const { register } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { username: '', email: '', password: '' },
    validate: {
      username: validateUsername,
      email: validateEmail,
      password: validatePassword,
    },
  });

  const handleSubmit = form.onSubmit(async ({ username, email, password }) => {
    setError(null);
    setLoading(true);
    try {
      const user = await register(username.trim(), email.trim(), password);
      close();
      notifications.show({
        title: 'Аккаунт создан',
        message: `Добро пожаловать, ${user.username}!`,
        color: 'green',
      });
    } catch {
      setError('Не удалось создать аккаунт. Возможно, email уже занят.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <FormHeader title={titles.register} onClose={close} />
        {error && (
          <Alert color="red" radius="md">
            {error}
          </Alert>
        )}
        <TextInput
          label="Имя"
          placeholder="Как к вам обращаться"
          autoComplete="username"
          {...form.getInputProps('username')}
        />
        <TextInput
          label="Электронная почта"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          {...form.getInputProps('email')}
        />
        <PasswordInput
          label="Пароль"
          placeholder="Минимум 8 символов"
          autoComplete="new-password"
          {...form.getInputProps('password')}
        />
        <Button type="submit" size="md" radius="md" fullWidth loading={loading}>
          Создать аккаунт
        </Button>
        <Text size="xs" c="dimmed" ta="center">
          Регистрируясь, вы принимаете{' '}
          <Anchor component={Link} to="/legal" size="xs" onClick={close}>
            условия использования
          </Anchor>
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          Уже есть аккаунт?{' '}
          <Anchor component="button" type="button" fw={600} onClick={() => setMode('login')}>
            Войти
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}