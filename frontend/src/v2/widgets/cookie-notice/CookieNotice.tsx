import { Anchor, Button, Group, Paper, Text } from '@mantine/core';
import { useState } from 'react';
import { Link, useLocation } from 'react-router';

/**
 * Уведомление об использовании cookie.
 *
 * Это именно уведомление, а не запрос согласия — и вот почему. 152-ФЗ не
 * содержит требования показывать баннер; согласие нужно на cookie, по которым
 * человека можно идентифицировать в целях аналитики и рекламы. Строго
 * необходимые cookie (сессия авторизации, CSRF-токен) устанавливаются без
 * отдельного согласия, и у Runit только такие: accessToken, refreshToken,
 * _csrf. Аналитики и рекламных пикселей на сайте нет.
 *
 * Поэтому здесь нет кнопки «отклонить»: отказаться от cookie, без которых
 * невозможен вход, нельзя — предлагать такой выбор было бы обманом. Кнопка
 * «Понятно» закрывает уведомление, ссылка ведёт в Политику, где перечислен
 * каждый cookie.
 *
 * Если появятся Яндекс.Метрика или иные сторонние трекеры, этого уведомления
 * станет недостаточно: понадобится согласие до установки таких cookie и
 * возможность отказа.
 */

const STORAGE_KEY = 'runit.cookieNoticeSeen';

/**
 * Отметка о закрытии — в localStorage, а не в cookie. Ставить cookie ради
 * уведомления о cookie можно, но объяснять это в Политике пришлось бы отдельной
 * строкой; localStorage той же цели служит без нового пункта.
 */
const wasSeen = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    // Приватный режим может запрещать доступ к хранилищу — тогда просто
    // показываем уведомление каждый раз, это лучше падения.
    return false;
  }
};

export default function CookieNotice() {
  const [hidden, setHidden] = useState(wasSeen);
  const { pathname } = useLocation();

  /**
   * Во встроенном виджете уведомление не показываем: он живёт в iframe на чужой
   * странице, и полоса про cookie Runit там выглядела бы как элемент того сайта.
   */
  const isEmbed = pathname.startsWith('/embed');

  if (hidden || isEmbed) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Не смогли запомнить — уведомление появится снова, ничего не ломается.
    }
    setHidden(true);
  };

  return (
    <Paper
      withBorder
      shadow="md"
      radius="md"
      p="md"
      role="status"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        maxWidth: 720,
        margin: '0 auto',
        zIndex: 300,
      }}
    >
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Text size="sm" style={{ flex: 1, minWidth: 240 }}>
          Сайт использует только cookie, необходимые для работы: они хранят вход
          в аккаунт и защищают от подделки запросов. Аналитических и рекламных
          cookie нет — подробности в{' '}
          <Anchor component={Link} to="/legal?tab=privacy" size="sm">
            Политике обработки персональных данных
          </Anchor>
          .
        </Text>
        <Button size="sm" variant="light" onClick={dismiss}>
          Понятно
        </Button>
      </Group>
    </Paper>
  );
}
