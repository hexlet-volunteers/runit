import bcrypt from 'bcrypt';
import { z } from 'zod/v4';
import { commonPasswords } from './common-passwords';

/**
 * Пароли: хеширование и проверка политики.
 *
 * Сообщения на русском: они доходят до пользователя как есть — форма показывает
 * текст ответа сервера. Английские формулировки в интерфейсе на русском языке
 * читались как сбой, а не как подсказка (#621).
 *
 * Правила намеренно простые и перечислимые: их дублирует подсказка в форме
 * (frontend/src/v2/features/auth/lib/passwordPolicy.ts), чтобы пользователь
 * видел требования до отправки, а не после отказа. Источник истины — этот
 * модуль: сервер проверяет всегда, независимо от того, что показал клиент.
 */

const BCRYPT_COST_FACTOR = 12;
export const MIN_PASSWORD_LENGTH = 8;
export const MIN_CHARACTER_CATEGORIES = 3;
export const PASSWORD_HISTORY_LIMIT = 5;

function countCharacterCategories(password: string): number {
  return [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;
}

export const passwordPolicySchema = z
  .string()
  .min(
    MIN_PASSWORD_LENGTH,
    `Пароль должен быть не короче ${MIN_PASSWORD_LENGTH} символов`,
  )
  .superRefine((password, ctx) => {
    if (countCharacterCategories(password) < MIN_CHARACTER_CATEGORIES) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Пароль должен содержать символы минимум трёх видов из четырёх: строчные буквы, заглавные буквы, цифры, специальные символы',
      });
    }

    if (commonPasswords.has(password.toLowerCase())) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Этот пароль слишком распространён и подбирается за секунды — придумайте другой',
      });
    }
  });

export interface PasswordValidationResult {
  ok: boolean;
  errors: string[];
}

export function validatePasswordPolicy(
  password: string,
): PasswordValidationResult {
  const result = passwordPolicySchema.safeParse(password);

  if (result.success) {
    return { ok: true, errors: [] };
  }

  return {
    ok: false,
    errors: result.error.issues.map((issue) => issue.message),
  };
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST_FACTOR);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function isPasswordReused(
  plain: string,
  previousHashes: string[],
): Promise<boolean> {
  const checks = await Promise.all(
    previousHashes
      .slice(0, PASSWORD_HISTORY_LIMIT)
      .map((hash) => verifyPassword(plain, hash)),
  );

  return checks.some(Boolean);
}
