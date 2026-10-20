import { describe, expect, test } from 'vitest';
import { emailSchema } from '../../src/auth/email';

describe('emailSchema', () => {
  test('принимает простой валидный email', () => {
    expect(emailSchema.parse('user@example.com')).toBe('user@example.com');
  });

  test('принимает email с алиасом и поддоменом', () => {
    expect(emailSchema.parse('john.doe+alias@sub.domain.co.uk')).toBe(
      'john.doe+alias@sub.domain.co.uk',
    );
  });

  test('нормализует регистр и обрезает пробелы', () => {
    expect(emailSchema.parse('  User@Example.COM  ')).toBe('user@example.com');
  });

  test('отклоняет email без корректного домена', () => {
    expect(() => emailSchema.parse('test222@.t')).toThrow();
  });

  test('отклоняет email без точки в домене', () => {
    expect(() => emailSchema.parse('user@example')).toThrow();
  });

  test('отклоняет локальную часть длиннее 64 символов', () => {
    const tooLongLocal = `${'a'.repeat(65)}@example.com`;

    expect(() => emailSchema.parse(tooLongLocal)).toThrow();
  });

  test('принимает локальную часть ровно 64 символа', () => {
    const local64 = 'a'.repeat(64);

    expect(emailSchema.parse(`${local64}@example.com`)).toBe(
      `${local64}@example.com`,
    );
  });

  test('отклоняет домен длиннее 190 символов', () => {
    const tooLongDomain = `${'a'.repeat(187)}.com`; // 191 символ

    expect(() => emailSchema.parse(`user@${tooLongDomain}`)).toThrow();
  });

  test('отклоняет email длиннее 254 символов суммарно, даже если каждая часть по отдельности в пределах лимита', () => {
    const local = 'a'.repeat(64); // на границе допустимой длины локальной части
    const domain = `${'b'.repeat(186)}.com`; // на границе допустимой длины домена (190)
    const tooLongTotal = `${local}@${domain}`;

    expect(tooLongTotal.length).toBeGreaterThan(254);
    expect(() => emailSchema.parse(tooLongTotal)).toThrow();
  });
});
