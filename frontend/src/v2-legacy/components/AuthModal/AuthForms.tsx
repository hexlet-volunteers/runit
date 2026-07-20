import { useEffect, useState } from 'react';
import {
  Alert,
  Anchor,
  Button,
  CloseButton,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Link } from 'react-router-dom';
import { useAuthModal, type AuthMode } from './context';
import { useSession } from '../../session';
import { RunitLogo } from '../AppHeader';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

const validateEmail = (value: string) =>
  EMAIL_RE.test(value.trim()) ? null : 'Введите корректный email';

// TODO(#621): проверка сложности пароля + визуальный индикатор надёжности.
const validatePassword = (value: string) =>
  value.length >= 8 ? null : 'Пароль должен быть не короче 8 символов';

const validateUsername = (value: string) =>
  value.trim().length >= 3 ? null : 'Имя должно быть не короче 3 символов';

const titles: Record<AuthMode, string> = {
  login: 'Вход в Runit',
  register: 'Регистрация',
  reset: 'Сброс пароля',
};

function FormHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Group gap="sm" wrap="nowrap">
        <RunitLogo size={32} />
        <Title order={3}>{title}</Title>
      </Group>
      <CloseButton aria-label="Закрыть" onClick={onClose} />
    </Group>
  );
}

function LoginForm() {
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

function RegisterForm() {
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

function ResetForm() {
  const { setMode, close } = useAuthModal();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: { email: '' },
    validate: { email: validateEmail },
  });

  // TODO(#640/#620): реальная отправка письма для сброса пароля на бэкенде.
  const handleSubmit = form.onSubmit(async () => {
    setLoading(true);
    // Имитация запроса, чтобы кнопка показала loading-состояние.
    await new Promise((resolve) => setTimeout(resolve, 400));
    setLoading(false);
    close();
    notifications.show({
      title: 'Сброс пароля',
      message: 'Письмо отправлено (заглушка)',
      color: 'blue',
    });
  });

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <FormHeader title={titles.reset} onClose={close} />
        <Text size="sm" c="dimmed">
          Укажите почту, привязанную к аккаунту, — пришлём ссылку для сброса пароля.
        </Text>
        <TextInput
          label="Электронная почта"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          {...form.getInputProps('email')}
        />
        <Button type="submit" size="md" radius="md" fullWidth loading={loading}>
          Отправить ссылку
        </Button>
        <Anchor
          component="button"
          type="button"
          size="sm"
          ta="center"
          onClick={() => setMode('login')}
        >
          ← Назад ко входу
        </Anchor>
      </Stack>
    </form>
  );
}

export default function AuthForms() {
  const { mode, opened } = useAuthModal();
  // Пересоздаём формы при каждом открытии модалки, чтобы сбрасывать значения и ошибки.
  const [instance, setInstance] = useState(0);
  useEffect(() => {
    if (opened) setInstance((n) => n + 1);
  }, [opened]);

  if (mode === 'register') return <RegisterForm key={`register-${instance}`} />;
  if (mode === 'reset') return <ResetForm key={`reset-${instance}`} />;
  return <LoginForm key={`login-${instance}`} />;
}
