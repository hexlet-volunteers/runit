import * as Sentry from '@sentry/react';

/**
 * Мониторинг ошибок фронтенда (#896).
 *
 * Пакет @sentry/react стоял в зависимостях, но не инициализировался — то есть
 * ошибки у пользователей просто терялись, и о поломке мы узнавали от них.
 *
 * Включается только при заданном VITE_SENTRY_DSN: без ключа функция ничего не
 * делает, чтобы разработка и тесты не пытались никуда отправлять события и не
 * шумели в консоли.
 */
export function initMonitoring(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: (import.meta.env.MODE as string) || 'production',
    // Доля трассируемых запросов: полная трассировка на публичном сервисе
    // быстро съедает квоту, а для поиска регрессий хватает выборки.
    tracesSampleRate: 0.1,
    // Код пользователя может кидать что угодно; шум от расширений браузера
    // и отменённых запросов в отчёты не нужен.
    ignoreErrors: [
      'AbortError',
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
  });
}
