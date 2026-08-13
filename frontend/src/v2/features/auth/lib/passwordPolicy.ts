/**
 * Требования к паролю для подсказки в форме (#621).
 *
 * Зеркало серверной политики (src/auth/password.ts). Источник истины — сервер:
 * он проверяет всегда и отвечает текстом, который форма показывает как есть.
 * Здесь то же самое повторено, чтобы пользователь видел требования до отправки
 * и по ходу ввода, а не узнавал их из отказа.
 *
 * Список частых паролей на клиент не тащим: это 10 тысяч строк ради подсказки.
 * Такой пароль отклонит сервер с внятным сообщением.
 */

export const MIN_PASSWORD_LENGTH = 8;
export const MIN_CHARACTER_CATEGORIES = 3;

export interface PasswordRule {
  label: string;
  isMet: (password: string) => boolean;
}

const countCategories = (password: string): number =>
  [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;

export const passwordRules: PasswordRule[] = [
  {
    label: `Не короче ${MIN_PASSWORD_LENGTH} символов`,
    isMet: (password) => password.length >= MIN_PASSWORD_LENGTH,
  },
  {
    label:
      'Символы минимум трёх видов: строчные, заглавные, цифры, специальные',
    isMet: (password) => countCategories(password) >= MIN_CHARACTER_CATEGORIES,
  },
];

/**
 * Ошибка для формы. Возвращается одна, а не список: пока пользователь набирает,
 * подсказка рядом с полем и так показывает все правила и их состояние.
 */
export const validatePassword = (value: string): string | null => {
  const failed = passwordRules.find((rule) => !rule.isMet(value));
  return failed ? failed.label : null;
};
