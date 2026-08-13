import { useState } from 'react';
import {
  Alert,
  Anchor,
  Button,
  Checkbox,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { Link } from 'react-router';
import { useAuthModal, validateEmail, validatePassword, validateUsername, titles } from '..';
import { useSession } from '../../../entities/user';
import FormHeader from './FormHeader';


export default function RegisterForm() {
  const { setMode, close } = useAuthModal();
  const { register } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    initialValues: { username: '', email: '', password: '', consent: false },
    validate: {
      username: validateUsername,
      email: validateEmail,
      password: validatePassword,
      /**
       * Согласие — обязательная отметка, а не пассивная строчка «регистрируясь,
       * вы принимаете». Согласие должно быть конкретным, информированным и
       * однозначным (152-ФЗ, ст. 9 ч. 1), то есть выраженным действием.
       */
      consent: (value: boolean) =>
        value ? null : 'Без согласия на обработку персональных данных регистрация невозможна',
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
    } catch (err: unknown) {
      // Сервер отвечает конкретно: занятый email, занятое имя, слабый пароль.
      // Общая фраза «возможно, email уже занят» заставляла бы угадывать причину.
      setError(
        err instanceof Error
          ? err.message
          : 'Не удалось создать аккаунт. Попробуйте позже.',
      );
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
        {/*
          Отдельная отметка именно на согласие: закон требует, чтобы согласие
          было оформлено отдельно от иных документов, которые подписывает
          субъект (152-ФЗ, ст. 9 ч. 1). Поэтому здесь не «принимаю условия и
          согласие» одной галочкой, а согласие само по себе — со ссылками на
          текст согласия и на Политику.
        */}
        <Checkbox
          {...form.getInputProps('consent', { type: 'checkbox' })}
          label={
            <Text size="sm">
              Даю{' '}
              <Anchor component={Link} to="/legal?tab=consent" size="sm" onClick={close}>
                согласие на обработку персональных данных
              </Anchor>{' '}
              и ознакомлен с{' '}
              <Anchor component={Link} to="/legal?tab=privacy" size="sm" onClick={close}>
                Политикой обработки персональных данных
              </Anchor>
            </Text>
          }
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