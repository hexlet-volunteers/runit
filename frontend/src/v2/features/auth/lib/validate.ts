const EMAIL_RE = /^\S+@\S+\.\S+$/;

export const validateEmail = (value: string) =>
  EMAIL_RE.test(value.trim()) ? null : 'Введите корректный email';

// TODO(#621): проверка сложности пароля + визуальный индикатор надёжности.
export const validatePassword = (value: string) =>
  value.length >= 8 ? null : 'Пароль должен быть не короче 8 символов';

export const validateUsername = (value: string) =>
  value.trim().length >= 3 ? null : 'Имя должно быть не короче 3 символов';
