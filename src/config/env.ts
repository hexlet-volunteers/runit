import { z } from 'zod/v4';

/**
 * Единая точка чтения окружения (#864, #894).
 *
 * Два требования, которые здесь сведены вместе:
 *  1. в проде нет секретов по умолчанию — приложение обязано падать на старте,
 *     а не подписывать токены предсказуемым ключом;
 *  2. локальная разработка, CI и тесты поднимаются без ручной настройки —
 *     иначе каждый прогон typecheck/smoke требует секретов, их начинают
 *     хардкодить в workflow, и разница между дев- и прод-ключом стирается.
 *
 * Отсюда схема: в development/test секреты подставляются дев-значением, в
 * production они обязательны и проверяются на совпадение с этим значением.
 */

const MIN_SECRET_LENGTH = 32;

/**
 * Дев-значения совпадают с .env.example намеренно: это не «почти секрет», а
 * заведомо публичная строка, и проверка ниже не даёт увезти её в прод.
 */
export const DEV_ACCESS_SECRET = 'dev-only-access-secret-not-for-production';
export const DEV_REFRESH_SECRET = 'dev-only-refresh-secret-not-for-production';

/**
 * Длина, а не «сложность». Требовать от секрета набор символов, как от пароля,
 * — ошибка: `openssl rand -hex 32` даёт 64 символа из [0-9a-f], то есть два
 * класса символов, и правило «минимум три класса» отвергло бы качественный
 * случайный ключ, подталкивая к рукописному «Passw0rd!...».
 */
const secretSchema = z
  .string()
  .min(
    MIN_SECRET_LENGTH,
    `секрет должен быть не короче ${MIN_SECRET_LENGTH} символов`,
  );

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().positive().default(3001),
    DB_PATH: z.string().default('database.sqlite'),
    JWT_ACCESS_SECRET: secretSchema.optional(),
    JWT_REFRESH_SECRET: secretSchema.optional(),
    // Через запятую для нескольких фронтенд-origin (например, dev + staging).
    CORS_ORIGIN: z.string().default('http://localhost:3000'),
    /**
     * Уровень логов pino. По умолчанию выводится из NODE_ENV: в проде info,
     * в разработке debug, в тестах silent — иначе логи запросов заливают отчёт
     * jest и падение теста приходится искать глазами.
     */
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .optional(),
  })
  .transform((raw) => ({
    ...raw,
    JWT_ACCESS_SECRET: raw.JWT_ACCESS_SECRET ?? DEV_ACCESS_SECRET,
    JWT_REFRESH_SECRET: raw.JWT_REFRESH_SECRET ?? DEV_REFRESH_SECRET,
    LOG_LEVEL:
      raw.LOG_LEVEL ??
      (raw.NODE_ENV === 'production'
        ? 'info'
        : raw.NODE_ENV === 'test'
          ? 'silent'
          : 'debug'),
  }))
  .superRefine((value, ctx) => {
    /**
     * Один ключ на оба вида токенов означает, что refresh-токен принимается
     * там, где ждут access: подписи совпадают, а различаются полезные нагрузки,
     * которые проверяются уже после верификации подписи.
     */
    if (value.JWT_ACCESS_SECRET === value.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: 'custom',
        path: ['JWT_REFRESH_SECRET'],
        message: 'JWT_ACCESS_SECRET и JWT_REFRESH_SECRET должны различаться',
      });
    }

    if (value.NODE_ENV !== 'production') {
      return;
    }

    const required = [
      ['JWT_ACCESS_SECRET', DEV_ACCESS_SECRET],
      ['JWT_REFRESH_SECRET', DEV_REFRESH_SECRET],
    ] as const;

    for (const [name, devValue] of required) {
      if (!process.env[name]) {
        ctx.addIssue({
          code: 'custom',
          path: [name],
          message: `${name} обязателен в production`,
        });
        continue;
      }

      if (value[name] === devValue) {
        ctx.addIssue({
          code: 'custom',
          path: [name],
          message: `${name} содержит дев-значение из .env.example — сгенерируйте свой: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  /**
   * Своё сообщение вместо дампа ZodError: в логе PaaS видна одна строка, и по
   * `invalid_type: expected string, received undefined` не понять, что нужно
   * просто задать переменную.
   */
  const details = parsed.error.issues
    .map(
      (issue) => `  - ${issue.path.join('.') || '(корень)'}: ${issue.message}`,
    )
    .join('\n');

  console.error(
    `Некорректное окружение, приложение не запущено:\n${details}\n\nСм. .env.example.`,
  );
  process.exit(1);
}

export const env: Env = parsed.data;
