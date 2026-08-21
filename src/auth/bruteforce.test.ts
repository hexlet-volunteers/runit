import type { LoginAttempt } from '../db/schema/schema';
import {
  isLockedOut,
  LOCKOUT_DURATION_MS,
  LOCKOUT_THRESHOLD,
  secondsUntilUnlock,
} from './bruteforce';

function makeAttempt(overrides: Partial<LoginAttempt> = {}): LoginAttempt {
  return {
    email: 'user@example.com',
    failedCount: LOCKOUT_THRESHOLD,
    lastFailedAt: new Date(),
    ...overrides,
  };
}

describe('isLockedOut', () => {
  test('не блокирует, если записи ещё нет', () => {
    expect(isLockedOut(undefined)).toBe(false);
  });

  test('не блокирует, пока попыток меньше порога', () => {
    const attempt = makeAttempt({ failedCount: LOCKOUT_THRESHOLD - 1 });

    expect(isLockedOut(attempt)).toBe(false);
  });

  test('блокирует по достижении порога', () => {
    const attempt = makeAttempt({ failedCount: LOCKOUT_THRESHOLD });

    expect(isLockedOut(attempt)).toBe(true);
  });

  test('снимает блокировку по истечении LOCKOUT_DURATION_MS', () => {
    const attempt = makeAttempt({
      lastFailedAt: new Date(Date.now() - LOCKOUT_DURATION_MS - 1000),
    });

    expect(isLockedOut(attempt)).toBe(false);
  });
});

describe('secondsUntilUnlock', () => {
  test('возвращает примерно полную длительность сразу после блокировки', () => {
    const attempt = makeAttempt({ lastFailedAt: new Date() });

    expect(secondsUntilUnlock(attempt)).toBeLessThanOrEqual(
      LOCKOUT_DURATION_MS / 1000,
    );
    expect(secondsUntilUnlock(attempt)).toBeGreaterThan(0);
  });

  test('не уходит в отрицательные значения после истечения блокировки', () => {
    const attempt = makeAttempt({
      lastFailedAt: new Date(Date.now() - LOCKOUT_DURATION_MS - 1000),
    });

    expect(secondsUntilUnlock(attempt)).toBe(0);
  });
});
