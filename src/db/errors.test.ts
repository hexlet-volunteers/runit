import { isUniqueViolationOn, uniqueViolationConstraint } from './errors';

/**
 * Разбор ошибок уникальности. Проверяется отдельно, потому что ошибка здесь не
 * видна: если распознавание перестанет работать, конфликт «имя занято»
 * превратится в 500, а тесты уровня процедур этого могут не заметить.
 */

/** Как ошибка приходит на самом деле: drizzle оборачивает ошибку драйвера. */
const wrapped = (constraint: string) => {
  const driverError = Object.assign(
    new Error(`duplicate key value violates unique constraint "${constraint}"`),
    { code: '23505', constraint_name: constraint },
  );
  return Object.assign(new Error('Failed query'), { cause: driverError });
};

describe('uniqueViolationConstraint', () => {
  test('находит ограничение в завёрнутой ошибке', () => {
    expect(uniqueViolationConstraint(wrapped('users_email_unique'))).toBe(
      'users_email_unique',
    );
  });

  test('находит ограничение и без обёртки', () => {
    const flat = Object.assign(new Error('duplicate'), {
      code: '23505',
      constraint_name: 'users_username_unique',
    });
    expect(uniqueViolationConstraint(flat)).toBe('users_username_unique');
  });

  test('прочие ошибки не считаются нарушением уникальности', () => {
    expect(
      uniqueViolationConstraint(new Error('connection refused')),
    ).toBeNull();
    expect(
      uniqueViolationConstraint(
        Object.assign(new Error('not null'), { code: '23502' }),
      ),
    ).toBeNull();
    expect(uniqueViolationConstraint(null)).toBeNull();
    expect(uniqueViolationConstraint('строка')).toBeNull();
  });

  test('циклическая ссылка в cause не вешает разбор', () => {
    const loop: { cause?: unknown } = {};
    loop.cause = loop;
    expect(uniqueViolationConstraint(loop)).toBeNull();
  });
});

describe('isUniqueViolationOn', () => {
  test('различает колонки', () => {
    const error = wrapped('users_email_unique');
    expect(isUniqueViolationOn(error, 'email')).toBe(true);
    expect(isUniqueViolationOn(error, 'username')).toBe(false);
  });
});
