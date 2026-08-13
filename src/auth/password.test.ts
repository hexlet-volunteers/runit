import {
  hashPassword,
  isPasswordReused,
  validatePasswordPolicy,
  verifyPassword,
} from './password';

describe('validatePasswordPolicy', () => {
  test('отклоняет пароль короче 8 символов', () => {
    const result = validatePasswordPolicy('Ab1!xy');

    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('не короче 8 символов'))).toBe(
      true,
    );
  });

  test('отклоняет пароль с менее чем 3 категориями символов', () => {
    const result = validatePasswordPolicy('abcdefgh123');

    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes('минимум трёх видов')),
    ).toBe(true);
  });

  test('отклоняет пароль из списка распространённых', () => {
    const result = validatePasswordPolicy('password');

    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes('слишком распространён')),
    ).toBe(true);
  });

  test('собирает все нарушения одновременно', () => {
    const result = validatePasswordPolicy('pass');

    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  test('принимает пароль, удовлетворяющий всем правилам', () => {
    expect(validatePasswordPolicy('Str0ng!Pass')).toEqual({
      ok: true,
      errors: [],
    });
  });

  test('сообщения на русском — они попадают в интерфейс как есть', () => {
    const result = validatePasswordPolicy('pass');

    // Английский текст в форме на русском языке читается как сбой, а не как
    // подсказка, что делать с паролем (#621).
    for (const message of result.errors) {
      expect(message).toMatch(/[а-яё]/i);
    }
  });
});

describe('hashPassword / verifyPassword', () => {
  test('хеш не совпадает с исходным паролем и проверяется только с ним', async () => {
    const hash = await hashPassword('Str0ng!Pass');

    expect(hash).not.toBe('Str0ng!Pass');
    expect(await verifyPassword('Str0ng!Pass', hash)).toBe(true);
    expect(await verifyPassword('WrongPass1!', hash)).toBe(false);
  });
});

describe('isPasswordReused', () => {
  test('находит совпадение среди предыдущих хешей', async () => {
    const oldHash1 = await hashPassword('OldPass1!');
    const oldHash2 = await hashPassword('OldPass2!');

    expect(await isPasswordReused('OldPass1!', [oldHash1, oldHash2])).toBe(
      true,
    );
    expect(await isPasswordReused('NewPass3!', [oldHash1, oldHash2])).toBe(
      false,
    );
  });

  test('без предыдущих паролей всегда false', async () => {
    expect(await isPasswordReused('AnyPass1!', [])).toBe(false);
  });
});
