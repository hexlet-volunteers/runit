-- Перевод боевой базы Runit со схемы TypeORM (старый NestJS-стек) на схему
-- Drizzle. Применяется РОВНО ОДИН РАЗ, до первого запуска новой версии.
--
-- Зачем он вообще нужен. Новая версия прогоняет миграции сама при старте
-- (runMigrations в src/index.ts), и первая из них, 0000_clever_blizzard.sql,
-- начинается с `CREATE TABLE "users"`. В боевой базе эта таблица существует с
-- 2019 года — миграция падает, ошибка перебрасывается наружу, процесс не
-- поднимается. Фазы release, которая отменила бы выпуск, в Procfile нет
-- намеренно, поэтому деплой не откатится сам: приложение уйдёт в crashed, и
-- сайт ляжет. Значит схему нужно привести к целевой заранее, а журнал Drizzle
-- проштамповать, чтобы первые три миграции считались применёнными.
--
-- Почему штамповка журнала работает. Мигратор Drizzle сравнивает только
-- created_at последней записи с полем `when` из drizzle/meta/_journal.json
-- (см. pg-core/dialect.js, метод migrate) — хеш он не перепроверяет. Поэтому
-- достаточно вставить записи с настоящими `when`; хеши тоже настоящие, чтобы
-- журнал не расходился с файлами при работе drizzle-kit. Миграции 0003 и
-- дальше применятся штатно.
--
-- Всё в одной транзакции: DDL в PostgreSQL транзакционный, поэтому при любой
-- непройденной проверке база остаётся ровно в исходном состоянии.
--
-- Порядок запуска. Сначала бэкап, потом сухой прогон, потом настоящий:
--
--   heroku pg:backups:capture -a hexlet-editor
--   URL=$(heroku config:get DATABASE_URL -a hexlet-editor)
--   psql "$URL" -v ON_ERROR_STOP=1 -v dry_run=1 -f bin/typeorm-to-drizzle.sql   # проверка
--   psql "$URL" -v ON_ERROR_STOP=1 -f bin/typeorm-to-drizzle.sql                # перевод
--
-- Сухой прогон делает всю работу и откатывает: он отвечает на вопрос «готовы ли
-- данные», не меняя их. Настоящий прогон печатает итог сам — сверяйтесь с
-- последней строкой вывода.
--
-- Через `heroku pg:psql` тоже можно, но там не передать -v: используйте psql с
-- DATABASE_URL, как выше.

BEGIN;

-- Часовой пояс задан явно, потому что ниже timestamp без зоны превращается в
-- timestamptz. Без этого результат зависел бы от настройки сессии: та же
-- команда на другой машине сдвинула бы все даты на разницу поясов.
SET LOCAL timezone = 'UTC';

-- ============================================================
-- 0. Проверки. Каждая — про то, из-за чего перевод молча испортил бы данные
-- ============================================================
--
-- Проблемы собираются в список и докладываются все сразу. Ранняя версия падала
-- на первой же — и оператор, разобрав дубли настроек, узнавал про дубли слагов
-- только со второго прогона по боевой базе. Один проход должен давать полный
-- список работ.

DO $$
DECLARE
  applied bigint;
  bad bigint;
  problems text[] := ARRAY[]::text[];
BEGIN
  -- Повторный запуск. Скрипт неидемпотентен по смыслу: он переименовывает
  -- колонки, и второй проход не нашёл бы исходных имён уже на полпути.
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'
  ) THEN
    EXECUTE 'SELECT count(*) FROM drizzle.__drizzle_migrations' INTO applied;
    IF applied > 0 THEN
      RAISE EXCEPTION 'База уже переведена: в drizzle.__drizzle_migrations % записей. Скрипт применяют один раз.', applied;
    END IF;
  END IF;

  -- Ожидаемое исходное состояние. Если этих признаков нет, база не та, за
  -- которую скрипт её принимает, и дальше идти нельзя — тут выходим сразу,
  -- потому что все остальные проверки обращаются к этим самым колонкам.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'isAdmin'
  ) THEN
    RAISE EXCEPTION 'Не найдена users."isAdmin" — схема не похожа на TypeORM-схему Runit.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'userId'
  ) THEN
    RAISE EXCEPTION 'Не найдена snippets."userId" — схема не похожа на TypeORM-схему Runit.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'settings_id'
  ) THEN
    RAISE EXCEPTION 'Не найдена user_settings.settings_id — схема не похожа на TypeORM-схему Runit.';
  END IF;

  -- Новая схема требует UNIQUE(user_id) у настроек. Если у кого-то две строки
  -- настроек, ограничение не создастся.
  SELECT count(*) INTO bad FROM (
    SELECT "userId" FROM public.user_settings GROUP BY "userId" HAVING count(*) > 1
  ) d;
  IF bad > 0 THEN
    problems := problems || format('у %s пользователей больше одной строки в user_settings (нужен UNIQUE(user_id))', bad);
  END IF;

  -- То же про UNIQUE(user_id, slug) из миграции 0002. NULL-слаги не мешают:
  -- в уникальном индексе PostgreSQL считает NULL различными.
  SELECT count(*) INTO bad FROM (
    SELECT "userId", slug FROM public.snippets
    WHERE slug IS NOT NULL
    GROUP BY "userId", slug HAVING count(*) > 1
  ) d;
  IF bad > 0 THEN
    problems := problems || format('%s пар (userId, slug) с дублями (нужен UNIQUE(user_id, slug))', bad);
  END IF;

  -- Сужения типов. Старые колонки настроек были varchar(50), новые — 10 и 20.
  SELECT count(*) INTO bad FROM public.user_settings WHERE length(language) > 10;
  IF bad > 0 THEN
    problems := problems || format('%s значений user_settings.language длиннее 10 символов', bad);
  END IF;

  SELECT count(*) INTO bad FROM public.user_settings WHERE length(theme) > 20;
  IF bad > 0 THEN
    problems := problems || format('%s значений user_settings.theme длиннее 20 символов', bad);
  END IF;

  -- Остальные колонки в новой схеме не уже старых, но сущности TypeORM
  -- объявляли часть из них как text — то есть фактический тип в базе мог
  -- разойтись с миграцией. Проверяем по данным, а не по типу.
  SELECT count(*) INTO bad FROM public.users WHERE length(username) > 20;
  IF bad > 0 THEN
    problems := problems || format('%s значений users.username длиннее 20 символов', bad);
  END IF;

  SELECT count(*) INTO bad FROM public.users WHERE length(email) > 254;
  IF bad > 0 THEN
    problems := problems || format('%s значений users.email длиннее 254 символов', bad);
  END IF;

  SELECT count(*) INTO bad FROM public.users WHERE length(password) > 60;
  IF bad > 0 THEN
    problems := problems || format('%s значений users.password длиннее 60 символов', bad);
  END IF;

  SELECT count(*) INTO bad FROM public.users WHERE recover_hash IS NOT NULL AND length(recover_hash) > 64;
  IF bad > 0 THEN
    problems := problems || format('%s значений users.recover_hash длиннее 64 символов', bad);
  END IF;

  SELECT count(*) INTO bad FROM public.snippets WHERE length(name) > 30;
  IF bad > 0 THEN
    problems := problems || format('%s значений snippets.name длиннее 30 символов', bad);
  END IF;

  SELECT count(*) INTO bad FROM public.snippets WHERE slug IS NOT NULL AND length(slug) > 30;
  IF bad > 0 THEN
    problems := problems || format('%s значений snippets.slug длиннее 30 символов', bad);
  END IF;

  SELECT count(*) INTO bad FROM public.snippets WHERE language IS NOT NULL AND length(language) > 50;
  IF bad > 0 THEN
    problems := problems || format('%s значений snippets.language длиннее 50 символов', bad);
  END IF;

  IF array_length(problems, 1) > 0 THEN
    RAISE EXCEPTION E'Данные не готовы к переводу. Разберите всё перечисленное и запустите заново:\n  - %',
      array_to_string(problems, E'\n  - ');
  END IF;

  RAISE NOTICE 'Проверки пройдены.';
END $$;

-- ============================================================
-- 1. Тип visibility
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'visibility' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "public"."visibility" AS ENUM ('private', 'link', 'public');
  END IF;
END $$;

-- ============================================================
-- 2. users
-- ============================================================

ALTER TABLE public.users RENAME COLUMN "isAdmin" TO is_admin;

-- addColumn в TypeORM создал колонку допускающей NULL, а новая схема требует
-- NOT NULL с default false.
UPDATE public.users SET is_admin = false WHERE is_admin IS NULL;
ALTER TABLE public.users ALTER COLUMN is_admin SET DEFAULT false;
ALTER TABLE public.users ALTER COLUMN is_admin SET NOT NULL;

ALTER TABLE public.users ALTER COLUMN username TYPE varchar(20);
ALTER TABLE public.users ALTER COLUMN username SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN email TYPE varchar(254);
ALTER TABLE public.users ALTER COLUMN email SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN password TYPE varchar(60);
ALTER TABLE public.users ALTER COLUMN password SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN recover_hash TYPE varchar(64);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS consent_version varchar(20),
  ADD COLUMN IF NOT EXISTS consent_given_at timestamp with time zone;

-- Даты. Старые значения писались через CURRENT_TIMESTAMP в поясе базы (UTC),
-- поэтому истолковываем их как UTC явно — см. SET LOCAL timezone выше.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
      AND column_name = 'created_at' AND data_type = 'timestamp without time zone'
  ) THEN
    ALTER TABLE public.users
      ALTER COLUMN created_at TYPE timestamp with time zone USING created_at AT TIME ZONE 'UTC',
      ALTER COLUMN updated_at TYPE timestamp with time zone USING updated_at AT TIME ZONE 'UTC';
  END IF;
END $$;

ALTER TABLE public.users ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.users ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.users ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.users ALTER COLUMN updated_at SET NOT NULL;

-- Уникальность username и email была, но под именами, которые придумал
-- TypeORM (UQ_<хеш>). Новая схема ждёт конкретные имена, и drizzle-kit сверяет
-- схему по ним: с чужими именами следующая же сгенерированная миграция
-- попыталась бы создать ограничения заново.
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT con.conname, con.conrelid::regclass::text AS tbl,
           -- attname имеет тип name, а не text: без приведения сравнение с
           -- ARRAY['username'] падает на «operator does not exist: name[] = text[]».
           (SELECT array_agg(att.attname::text ORDER BY att.attname::text)
              FROM unnest(con.conkey) k
              JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = k
           ) AS cols
    FROM pg_constraint con
    WHERE con.conrelid = 'public.users'::regclass AND con.contype = 'u'
  LOOP
    IF c.cols = ARRAY['username'] OR c.cols = ARRAY['email'] THEN
      EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', c.conname);
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.users ADD CONSTRAINT users_username_unique UNIQUE (username);
ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- ============================================================
-- 3. snippets
-- ============================================================

ALTER TABLE public.snippets RENAME COLUMN "userId" TO user_id;

-- В новой схеме user_id допускает NULL: сниппет переживает удаление автора
-- только формально (FK стоит ON DELETE cascade), но само определение колонки
-- отличается от старого NOT NULL, и расхождение видел бы drizzle-kit.
ALTER TABLE public.snippets ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.snippets ALTER COLUMN name TYPE varchar(30);
ALTER TABLE public.snippets ALTER COLUMN name SET NOT NULL;
ALTER TABLE public.snippets ALTER COLUMN slug TYPE varchar(30);
ALTER TABLE public.snippets ALTER COLUMN language TYPE varchar(50);

ALTER TABLE public.snippets ADD COLUMN IF NOT EXISTS short_code varchar(16);

-- Видимость. Значение по умолчанию в схеме — 'private', но старым сниппетам
-- оно не подходит: в прежней версии понятия видимости не было вовсе, а
-- GET /snippets/:username/:slug шёл без гварда — то есть по ссылке сниппет
-- открывался любому. Оставить 'private' означало бы сломать все уже
-- разосланные ссылки (getSnippetByUsernameSlug отдаёт undefined для
-- приватного постороннему), то есть тихо испортить встроенные сниппеты в
-- уроках и статьях.
--
-- Поставлено 'link', а не 'public', именно потому, что это перенос прежнего
-- поведения, а не расширение: 'public' дополнительно выводит сниппет в новый
-- публичный профиль /u/:username, которого в старой версии не было — там
-- профиль показывал только свои сниппеты через users/profile. Публикация кода
-- в браузящийся список — то, на что пользователи не соглашались.
ALTER TABLE public.snippets
  ADD COLUMN IF NOT EXISTS visibility "public"."visibility" DEFAULT 'private' NOT NULL;

UPDATE public.snippets SET visibility = 'link';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'snippets'
      AND column_name = 'created_at' AND data_type = 'timestamp without time zone'
  ) THEN
    ALTER TABLE public.snippets
      ALTER COLUMN created_at TYPE timestamp with time zone USING created_at AT TIME ZONE 'UTC',
      ALTER COLUMN updated_at TYPE timestamp with time zone USING updated_at AT TIME ZONE 'UTC';
  END IF;
END $$;

ALTER TABLE public.snippets ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.snippets ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.snippets ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.snippets ALTER COLUMN updated_at SET NOT NULL;

-- ============================================================
-- 4. user_settings
-- ============================================================

ALTER TABLE public.user_settings RENAME COLUMN settings_id TO id;
ALTER TABLE public.user_settings RENAME COLUMN "userId" TO user_id;

ALTER TABLE public.user_settings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.user_settings ALTER COLUMN theme TYPE varchar(20);
ALTER TABLE public.user_settings ALTER COLUMN theme SET DEFAULT 'system';
ALTER TABLE public.user_settings ALTER COLUMN theme SET NOT NULL;
ALTER TABLE public.user_settings ALTER COLUMN language TYPE varchar(10);
ALTER TABLE public.user_settings ALTER COLUMN language SET DEFAULT 'ru';
ALTER TABLE public.user_settings ALTER COLUMN language SET NOT NULL;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS avatar_base64 text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings'
      AND column_name = 'created_at' AND data_type = 'timestamp without time zone'
  ) THEN
    ALTER TABLE public.user_settings
      ALTER COLUMN created_at TYPE timestamp with time zone USING created_at AT TIME ZONE 'UTC',
      ALTER COLUMN updated_at TYPE timestamp with time zone USING updated_at AT TIME ZONE 'UTC';
  END IF;
END $$;

ALTER TABLE public.user_settings ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.user_settings ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.user_settings ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE public.user_settings ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_user_id_unique UNIQUE (user_id);

-- ============================================================
-- 5. Внешние ключи под именами новой схемы
-- ============================================================

DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT con.conname, con.conrelid::regclass::text AS tbl
    FROM pg_constraint con
    WHERE con.contype = 'f'
      AND con.confrelid = 'public.users'::regclass
      AND con.conrelid IN ('public.snippets'::regclass, 'public.user_settings'::regclass)
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', c.tbl, c.conname);
  END LOOP;
END $$;

ALTER TABLE public.snippets
  ADD CONSTRAINT snippets_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE cascade ON UPDATE no action;

ALTER TABLE public.user_settings
  ADD CONSTRAINT user_settings_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE cascade ON UPDATE no action;

-- ============================================================
-- 6. Новые таблицы — как их создаёт 0000
--
-- sections здесь нет намеренно: 0000 её создаёт, а 0001 сразу удаляет, то есть
-- в целевом состоянии её не существует.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.password_history (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "password_hash" varchar(60) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "token_hash" varchar(64) NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);

ALTER TABLE public.password_history
  ADD CONSTRAINT password_history_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE cascade ON UPDATE no action;

ALTER TABLE public.refresh_tokens
  ADD CONSTRAINT refresh_tokens_user_id_users_id_fk
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE cascade ON UPDATE no action;

-- ============================================================
-- 7. Первичные ключи: IDENTITY → serial
--
-- TypeORM создал id как GENERATED ALWAYS AS IDENTITY, Drizzle объявляет serial
-- (integer + default nextval). Вставки новой версии работали бы и с IDENTITY —
-- она никогда не передаёт id явно, — но drizzle-kit сравнивает схему с
-- объявленной, и на первой же сгенерированной миграции увидел бы расхождение.
-- ============================================================

DO $$
DECLARE
  t text;
  seq text;
  max_id bigint;
BEGIN
  FOR t IN SELECT unnest(ARRAY['users', 'snippets', 'user_settings']) LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t
        AND column_name = 'id' AND is_identity = 'YES'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id DROP IDENTITY', t);
    END IF;

    seq := format('public.%I', t || '_id_seq');

    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind = 'S' AND n.nspname = 'public' AND c.relname = t || '_id_seq'
    ) THEN
      EXECUTE format('CREATE SEQUENCE %s AS integer OWNED BY public.%I.id', seq, t);
    END IF;

    EXECUTE format('SELECT max(id) FROM public.%I', t) INTO max_id;

    -- is_called = false при пустой таблице, иначе следующий id стал бы 2.
    IF max_id IS NULL THEN
      EXECUTE format('SELECT setval(%L, 1, false)', seq);
    ELSE
      EXECUTE format('SELECT setval(%L, %s, true)', seq, max_id);
    END IF;

    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET DEFAULT nextval(%L)', t, seq);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET NOT NULL', t);
  END LOOP;
END $$;

-- Имена первичных ключей. TypeORM назвал их PK_<хеш>, а таблица, созданная
-- миграцией 0000, получила бы имя по умолчанию — <таблица>_pkey. Само по себе
-- имя ни на что не влияет, но drizzle-kit сравнивает схему с объявленной, и
-- расхождение всплыло бы лишним переименованием в первой же сгенерированной
-- миграции — то есть в diff, который никто не заказывал.
DO $$
DECLARE
  t text;
  pk text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['users', 'snippets', 'user_settings']) LOOP
    SELECT con.conname INTO pk
    FROM pg_constraint con
    WHERE con.conrelid = format('public.%I', t)::regclass AND con.contype = 'p';

    IF pk IS NOT NULL AND pk <> t || '_pkey' THEN
      EXECUTE format('ALTER TABLE public.%I RENAME CONSTRAINT %I TO %I', t, pk, t || '_pkey');
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 8. Индексы из 0002
-- ============================================================

CREATE INDEX IF NOT EXISTS password_history_user_id_idx ON public.password_history USING btree (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON public.refresh_tokens USING btree (user_id);
CREATE INDEX IF NOT EXISTS snippets_user_id_idx ON public.snippets USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS snippets_user_id_slug_idx ON public.snippets USING btree (user_id, slug);

-- ============================================================
-- 9. Бэкфилл short_code
--
-- Старые ссылки вида /s/:username/:slug продолжают работать и без него — этот
-- путь в новой версии сохранён. Но модальное окно «Поделиться» строит короткую
-- ссылку и рассчитывает, что short_code есть; без бэкфилла у всех старых
-- сниппетов оно молча отдавало бы ссылку на NULL.
--
-- Алфавит и длина совпадают с generateShortCode (src/db/snippets.ts): без l, I,
-- O, 0 и 1 — их путают, когда код диктуют или переписывают руками.
-- ============================================================

DO $$
DECLARE
  alphabet text := 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  r record;
  -- Переменная НЕ должна называться code: у snippets есть столбец code, и
  -- plpgsql отказывается разбирать `WHERE short_code = code` как
  -- «column reference is ambiguous».
  candidate text;
  placed boolean;
  filled bigint := 0;
BEGIN
  FOR r IN SELECT id FROM public.snippets WHERE short_code IS NULL LOOP
    placed := false;

    FOR attempt IN 1..50 LOOP
      candidate := '';
      FOR i IN 1..6 LOOP
        candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
      END LOOP;

      IF NOT EXISTS (SELECT 1 FROM public.snippets WHERE short_code = candidate) THEN
        UPDATE public.snippets SET short_code = candidate WHERE id = r.id;
        placed := true;
        filled := filled + 1;
        EXIT;
      END IF;
    END LOOP;

    IF NOT placed THEN
      RAISE EXCEPTION 'Не удалось подобрать short_code для сниппета % за 50 попыток.', r.id;
    END IF;
  END LOOP;

  RAISE NOTICE 'short_code проставлен для % сниппетов.', filled;
END $$;

ALTER TABLE public.snippets ADD CONSTRAINT snippets_short_code_unique UNIQUE (short_code);

-- ============================================================
-- 10. Штамповка журнала Drizzle
--
-- created_at — поле `when` из drizzle/meta/_journal.json, hash — sha256 файла
-- миграции. Мигратор сравнивает только created_at, но хеш держим настоящий,
-- чтобы журнал не расходился с файлами.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS drizzle;

CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);

INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES
  ('8c026576c72ccc3bbfc7ad3a41f9e88531596eef4e1f9d414fbb203f9d3d7963', 1786654666572),
  ('d889dcfcb497bc33f9996777c6a9510ecbba70c112101cd4da54f9f0c2c42f34', 1786688438362),
  ('57be4d9c0cce0f03dd7a0dae8422eb9331b7aa6c176f052db5a0774c27d9b736', 1786697927652);

-- ============================================================
-- 11. Итог
-- ============================================================

DO $$
DECLARE
  users_n bigint;
  snippets_n bigint;
  settings_n bigint;
BEGIN
  SELECT count(*) INTO users_n FROM public.users;
  SELECT count(*) INTO snippets_n FROM public.snippets;
  SELECT count(*) INTO settings_n FROM public.user_settings;
  RAISE NOTICE 'Готово. users: %, snippets: % (все visibility=link), user_settings: %.',
    users_n, snippets_n, settings_n;
END $$;

-- Сухой прогон: с `-v dry_run=1` psql откатывает всё, проделав ровно ту же
-- работу. Нужен, чтобы проверить боевую базу до того, как её менять: проверки
-- выше видят настоящие данные, а состояние остаётся прежним. Без такого режима
-- единственный способ узнать, готовы ли данные, — начать их менять.
\if :{?dry_run}
  \echo '*** СУХОЙ ПРОГОН: откатываю, база не изменена ***'
  ROLLBACK;
\else
  COMMIT;
\endif
