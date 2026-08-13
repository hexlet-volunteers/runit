const EMAIL_RE = /^\S+@\S+\.\S+$/;

export const validateEmail = (value: string) =>
  EMAIL_RE.test(value.trim()) ? null : 'Введите корректный email';

export const validateUsername = (value: string) =>
  value.trim().length >= 3 ? null : 'Имя должно быть не короче 3 символов';
