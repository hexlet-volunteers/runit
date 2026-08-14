import { Alert, Anchor, Stack, Text } from '@mantine/core';
import { useAuthModal, titles } from '..';
import FormHeader from './FormHeader';

/**
 * Восстановление доступа.
 *
 * Формы отправки письма здесь нет намеренно, пока сброс не реализован на
 * сервере (#620). До этого экран изображал работающую функцию: поле для почты,
 * кнопка «Отправить ссылку», задержка 400 мс вместо запроса и тост «Письмо
 * отправлено (заглушка)» — слово «заглушка» видел конечный пользователь.
 *
 * Так хуже, чем ничего: человек, забывший пароль, уходил ждать письмо, которого
 * никто не отправлял, и терял аккаунт молча. Пока процедуры нет, честнее сказать
 * прямо и дать адрес, по которому доступ восстановят руками.
 */
const SUPPORT_EMAIL = 'support@hexlet.io';

function ResetForm() {
  const { setMode, close } = useAuthModal();

  return (
    <Stack gap="md">
      <FormHeader title={titles.reset} onClose={close} />

      <Alert color="yellow" radius="md">
        <Text size="sm">
          Автоматическое восстановление пароля пока не работает — письма со
          ссылкой сервис не отправляет.
        </Text>
      </Alert>

      <Text size="sm" c="dimmed">
        Напишите на{' '}
        <Anchor href={`mailto:${SUPPORT_EMAIL}`} size="sm">
          {SUPPORT_EMAIL}
        </Anchor>{' '}
        с адреса, на который зарегистрирован аккаунт, — доступ восстановят
        вручную.
      </Text>

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
  );
}

export default ResetForm;
