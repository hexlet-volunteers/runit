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

/**
 * Значения по умолчанию, выводимые из NODE_ENV. Вынесены в чистые функции,
 * чтобы их можно было проверить тестом: обе решают, как приложение ведёт себя
 * в проде, а env — модуль-синглтон, и подменить в нём окружение из теста
 * нельзя.
 */
export const resolveLogLevel = (
  nodeEnv: 'development' | 'test' | 'production',
  override?: string,
): string => {
  if (override) return override;
  if (nodeEnv === 'production') return 'info';
  if (nodeEnv === 'test') return 'silent';
  return 'debug';
};

export const resolveCookieSecure = (
  nodeEnv: 'development' | 'test' | 'production',
  override?: boolean,
): boolean => override ?? nodeEnv === 'production';

/** Режим TLS для базы — см. DATABASE_SSL в схеме ниже. */
export const resolveDatabaseSsl = (
  nodeEnv: 'development' | 'test' | 'production',
  override?: 'require' | 'prefer' | 'verify-full' | 'off',
): 'require' | 'prefer' | 'verify-full' | 'off' =>
  override ?? (nodeEnv === 'production' ? 'require' : 'prefer');

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().positive().default(3001),
    /**
     * Строка подключения к PostgreSQL (#895). Значение по умолчанию совпадает с
     * локальным сервисом из docker-compose, поэтому `npm run dev` работает без
     * настройки. В production переменная обязательна — проверка ниже.
     */
    DATABASE_URL: z
      .string()
      .default('postgres://runit:runit@localhost:5432/runit'),
    /**
     * Размер пула соединений. У managed-PostgreSQL есть предел числа
     * соединений, и несколько инстансов приложения обязаны делить его: без
     * этой переменной каждый брал бы по умолчанию 10 и на четвёртом инстансе
     * база начала бы отказывать.
     */
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
    /**
     * Режим TLS при подключении к PostgreSQL (#941).
     *
     * Выделено в переменную, потому что драйвер postgres-js по умолчанию
     * подключается БЕЗ шифрования, а managed-PostgreSQL его требует. На Heroku
     * это выглядело так: приложение падало на первом же запросе миграций с
     * «no pg_hba.conf entry for host …, no encryption», а локально и в CI всё
     * работало — там Postgres поднят без TLS, и разница обнаружилась только на
     * боевом стенде.
     *
     * Значения — как в libpq:
     *   require     — TLS обязателен, сертификат не проверяется;
     *   prefer      — TLS если сервер умеет, иначе открытое соединение;
     *   verify-full — TLS с проверкой цепочки (нужен доверенный CA);
     *   off         — без TLS.
     *
     * По умолчанию в production — require: боевая база всегда managed (в
     * docker-compose.prod.yml сервиса postgres нет вовсе), а молча отправлять
     * персональные данные по открытому каналу хуже, чем не подняться.
     * Сертификат при этом не проверяется: у Heroku он самоподписанный, и
     * verify-full там не проходит.
     *
     * Вне production — prefer: локальный Postgres из docker-compose TLS не
     * умеет, а require к нему не подключился бы вообще.
     */
    DATABASE_SSL: z
      .enum(['require', 'prefer', 'verify-full', 'off'])
      .optional(),
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
    /**
     * Сколько прокси перед приложением можно считать доверенными.
     *
     * От этого зависит, чему верить при определении адреса клиента. Пока
     * лимитер брал X-Forwarded-For напрямую из заголовка, любой клиент обходил
     * все ограничения: меняешь заголовок в каждом запросе — получаешь свою
     * корзину, и перебор пароля идёт без лимита. Заголовок подставляет кто
     * угодно, доверять ему можно только там, где его перезаписывает наш прокси.
     *
     * 0 (по умолчанию) — адрес берётся из сокета, подделать нельзя.
     * 1 — перед приложением ровно один доверенный прокси (наш Caddy в compose).
     */
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
    /**
     * Флаг Secure у cookie сессии. По умолчанию включён в production.
     *
     * Отделён от NODE_ENV, потому что это разные вопросы: NODE_ENV говорит
     * «это боевая сборка», а Secure — «сайт отдаётся по https». Браузер не
     * отправляет Secure-cookie по http, поэтому у прод-сборки, поднятой по
     * http (docker compose на localhost:8080 — документированный способ
     * проверить сборку), вход не работал бы вовсе: cookie ставится и сразу
     * теряется.
     *
     * Выключать можно только там, где нет TLS и нет реальных пользователей.
     */
    COOKIE_SECURE: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  })
  .transform((raw) => ({
    ...raw,
    JWT_ACCESS_SECRET: raw.JWT_ACCESS_SECRET ?? DEV_ACCESS_SECRET,
    JWT_REFRESH_SECRET: raw.JWT_REFRESH_SECRET ?? DEV_REFRESH_SECRET,
    LOG_LEVEL: resolveLogLevel(raw.NODE_ENV, raw.LOG_LEVEL),
    COOKIE_SECURE: resolveCookieSecure(raw.NODE_ENV, raw.COOKIE_SECURE),
    DATABASE_SSL: resolveDatabaseSsl(raw.NODE_ENV, raw.DATABASE_SSL),
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

    /**
     * Строку подключения в проде тоже нельзя брать по умолчанию: значение по
     * умолчанию указывает на localhost, и приложение молча поднялось бы на
     * пустой локальной базе вместо боевой — с виду работая.
     */
    if (!process.env.DATABASE_URL) {
      ctx.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: 'DATABASE_URL обязателен в production',
      });
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
