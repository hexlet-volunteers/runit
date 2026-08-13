/**
 * Разбор ошибок PostgreSQL (#895).
 *
 * Нарушение уникальности определяется кодом ошибки и именем ограничения, а не
 * текстом сообщения. Так и должно быть: при переезде со SQLite проверки вида
 * `message.includes('UNIQUE constraint')` перестали срабатывать молча — регистрация
 * на занятое имя стала отвечать 500 вместо «имя занято». Код 23505 у PostgreSQL
 * стабилен, текст сообщения зависит от версии и локали сервера.
 */

/** unique_violation — https://www.postgresql.org/docs/current/errcodes-appendix.html */
const UNIQUE_VIOLATION = '23505';

interface PostgresErrorLike {
  code?: string;
  constraint_name?: string;
  cause?: unknown;
}

const asPostgresError = (error: unknown): PostgresErrorLike | null =>
  typeof error === 'object' && error !== null
    ? (error as PostgresErrorLike)
    : null;

/**
 * Имя ограничения, которое нарушено, или null — если ошибка не про
 * уникальность. Имена задаёт drizzle: `users_username_unique`,
 * `snippets_short_code_unique` и т. п.
 *
 * Цепочку `cause` приходится разворачивать: drizzle оборачивает ошибку
 * драйвера в свою, и код 23505 лежит не на верхнем объекте. Проверка только
 * верхнего уровня выглядела бы работающей и молча пропускала все конфликты.
 */
export function uniqueViolationConstraint(error: unknown): string | null {
  // Ограничение на глубину — защита от циклической ссылки в cause.
  let current = asPostgresError(error);
  for (let depth = 0; current && depth < 5; depth += 1) {
    if (current.code === UNIQUE_VIOLATION) {
      return current.constraint_name ?? '';
    }
    current = asPostgresError(current.cause);
  }

  return null;
}

/** Нарушена ли уникальность по колонке с указанным именем. */
export function isUniqueViolationOn(error: unknown, column: string): boolean {
  const constraint = uniqueViolationConstraint(error);
  return constraint !== null && constraint.includes(column);
}
