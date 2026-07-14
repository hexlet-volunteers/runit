import { useState } from 'react';
import {
  Anchor,
  Button,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useAuthModal } from '../context';
import FormHeader from './FormHeader';
import { validateEmail } from '../lib/validate';
import { titles } from '../lib/constants';

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

export default ResetForm;