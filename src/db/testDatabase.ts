import postgres from 'postgres';

/**
 * Отдельная база под каждый тестовый файл (#895).
 *
 * Раньше тесты работали с временным файлом SQLite — достаточно было положить
 * путь в DB_PATH. У PostgreSQL так нельзя, а гонять все файлы по одной базе
 * тоже: jest запускает их параллельно в разных процессах, и тесты начали бы
 * видеть чужие строки. Проверки вида «getMySnippets отдаёт только свои» ловили
 * бы чужого пользователя и падали бы через раз.
 *
 * Поэтому каждый файл получает свою базу: она создаётся до импорта
 * connection.ts (соединение открывается на уровне модуля) и удаляется после.
 *
 * Имя базы приходит из вызывающего файла — по нему в случае падения видно, чей
 * это остаток.
 */

/** Адрес сервера без имени базы: к нему подключаемся, чтобы создать свою. */
const maintenanceUrl = (): string =>
  process.env.DATABASE_URL_TEST ??
  process.env.DATABASE_URL ??
  'postgres://runit:runit@localhost:5432/runit';

const withDatabase = (url: string, database: string): string => {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
};

/**
 * Создаёт чистую базу и возвращает строку подключения к ней.
 * Вызывать ДО импорта модулей, которые открывают соединение.
 */
export async function createTestDatabase(name: string): Promise<string> {
  const base = maintenanceUrl();
  // Подключаемся к служебной базе postgres: свою ещё нельзя — её нет.
  const admin = postgres(withDatabase(base, 'postgres'), {
    max: 1,
    onnotice: () => {},
  });

  try {
    // Остаток от прерванного прогона: тест должен начинаться с чистой базы,
    // иначе последовательности id продолжатся с прошлых значений.
    await admin.unsafe(`drop database if exists "${name}" with (force)`);
    await admin.unsafe(`create database "${name}"`);
  } finally {
    await admin.end({ timeout: 5 });
  }

  return withDatabase(base, name);
}

export async function dropTestDatabase(name: string): Promise<void> {
  const admin = postgres(withDatabase(maintenanceUrl(), 'postgres'), {
    max: 1,
    onnotice: () => {},
  });

  try {
    await admin.unsafe(`drop database if exists "${name}" with (force)`);
  } finally {
    await admin.end({ timeout: 5 });
  }
}
