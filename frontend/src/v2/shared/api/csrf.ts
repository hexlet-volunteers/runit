/**
 * CSRF-токен для мутаций (#861).
 *
 * Бэкенд работает по схеме double-submit: вместе с сессией он ставит cookie
 * и возвращает токен из auth.login / auth.register / auth.refresh, а мутации
 * ждут этот же токен в заголовке. Cookie браузер отправит сам, заголовок —
 * только наш код, поэтому чужая страница мутацию выполнить не может.
 *
 * Токен держим в памяти модуля, а не в localStorage: он живёт ровно столько,
 * сколько открытая вкладка, и не должен переживать закрытие браузера.
 */

let csrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}
