import { notifications } from '@mantine/notifications';

/** Копирует текст в буфер обмена и показывает уведомление об успехе или ошибке. */
export async function copyToClipboard(value: string, message: string) {
  try {
    await navigator.clipboard.writeText(value);
    notifications.show({ message, color: 'teal' });
  } catch {
    notifications.show({ message: 'Не удалось скопировать', color: 'red' });
  }
}
