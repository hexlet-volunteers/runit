/**
 * Шрифты со своего домена, а не из Google Fonts.
 *
 * Раньше index.html подключал fonts.googleapis.com обычным <link rel="stylesheet">
 * в <head> — то есть отрисовка страницы ждала ответа чужого сервера. Из России
 * этот хост отвечает нестабильно, и пока браузер его ждёт, человек видит пустой
 * экран: в index.html до запуска JS не было ни строчки содержимого. Отсюда и
 * «иногда грузится оооочень долго».
 *
 * Теперь шрифты — часть сборки: отдаются с нашего адреса, с бессрочным кэшем
 * (assets помечены immutable) и без обращений к третьим лицам. Заодно к
 * посетителям не уходит запрос к Google, то есть их IP туда не передаётся —
 * для 152-ФЗ это тоже к месту.
 */
import '@fontsource-variable/golos-text';
import '@fontsource-variable/jetbrains-mono';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

import './global.css';

import { v2Theme } from './theme';
import { SessionProvider } from './providers/';
import { AuthModalProvider } from './providers';

export default function AppProviders({children}) {
  return (
    <MantineProvider theme={v2Theme} withCssVariables withStaticClasses>
      <Notifications position="bottom-center" />
      <SessionProvider>
        <AuthModalProvider>
           {children}
        </AuthModalProvider>
      </SessionProvider>
    </MantineProvider>
  );
}