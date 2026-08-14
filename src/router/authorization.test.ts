/**
 * Проверки прав доступа к tRPC-процедурам (#792, #793, #346).
 *
 * Тесты идут через appRouter.createCaller, то есть проходят те же middleware,
 * что и настоящий запрос, — но без HTTP и без cookie. Проверяется именно то,
 * что раньше было сломано: чужой аккаунт и чужой приватный сниппет были
 * доступны по перебору числового id, а password уезжал в ответ.
 *
 * Каждая процедура, доступная посторонним, должна быть закреплена тестом:
 * забыть middleware в новой процедуре легко, и снаружи это никак не видно.
 */

import { createTestDatabase, dropTestDatabase } from '../db/testDatabase';

// Своя база под этот файл, и создать её нужно до импорта connection.ts:
// соединение открывается на уровне модуля, и подменить адрес позже нельзя.
const TEST_DATABASE = 'runit_test_authz';
process.env.DATABASE_URL = await createTestDatabase(TEST_DATABASE);

const { db, runMigrations, closeDbConnection } = await import(
  '../db/connection'
);
const { users, snippets, userSettings } = await import('../db/schema/schema');
const { appRouter } = await import('./index');
const { hashPassword, verifyPassword } = await import('../auth/password');
const { eq } = await import('drizzle-orm');

type Caller = ReturnType<typeof appRouter.createCaller>;

/**
 * Контекст в обход createContext: req/res нужны только процедурам, которые
 * работают с cookie (logout, refresh), а здесь проверяются права.
 */
const callerFor = (user: { id: number; isAdmin: boolean } | null): Caller =>
  appRouter.createCaller({
    req: {} as never,
    res: {} as never,
    user,
  });

const KNOWN_PASSWORD = 'Correct-horse-7';

let ownerId: number;
let strangerId: number;
let adminId: number;
let owner: Caller;
let stranger: Caller;
let admin: Caller;
let guest: Caller;

let privateSnippetId: number;
let publicSnippetId: number;
let linkSnippetId: number;
let linkShortCode: string;

beforeAll(async () => {
  await runMigrations();

  const passwordHash = await hashPassword(KNOWN_PASSWORD);

  const inserted = await db
    .insert(users)
    .values([
      { username: 'owner', email: 'owner@example.com', password: passwordHash },
      {
        username: 'stranger',
        email: 'stranger@example.com',
        password: passwordHash,
      },
      {
        username: 'admin',
        email: 'admin@example.com',
        password: passwordHash,
        isAdmin: true,
      },
    ])
    .returning({ id: users.id, username: users.username });

  const idByName = (name: string): number => {
    const row = inserted.find((u) => u.username === name);
    if (!row) throw new Error(`Фикстура не создала пользователя ${name}`);
    return row.id;
  };

  ownerId = idByName('owner');
  strangerId = idByName('stranger');
  adminId = idByName('admin');

  owner = callerFor({ id: ownerId, isAdmin: false });
  stranger = callerFor({ id: strangerId, isAdmin: false });
  admin = callerFor({ id: adminId, isAdmin: true });
  guest = callerFor(null);

  const snippetRows = await db
    .insert(snippets)
    .values([
      {
        name: 'secret',
        code: 'console.log(1)',
        language: 'javascript',
        slug: 'secret',
        visibility: 'private',
        userId: ownerId,
      },
      {
        name: 'shared',
        code: 'console.log(2)',
        language: 'javascript',
        slug: 'shared',
        visibility: 'public',
        userId: ownerId,
      },
      {
        name: 'by-link',
        code: 'console.log(3)',
        language: 'javascript',
        slug: 'by-link',
        visibility: 'link',
        shortCode: 'lnk12345',
        userId: ownerId,
      },
    ])
    .returning({ id: snippets.id, name: snippets.name });

  const snippetIdByName = (name: string): number => {
    const row = snippetRows.find((s) => s.name === name);
    if (!row) throw new Error(`Фикстура не создала сниппет ${name}`);
    return row.id;
  };

  privateSnippetId = snippetIdByName('secret');
  publicSnippetId = snippetIdByName('shared');
  linkSnippetId = snippetIdByName('by-link');
  linkShortCode = 'lnk12345';
});

afterAll(async () => {
  // Без закрытия пула jest висит: соединения с PostgreSQL держат процесс.
  await closeDbConnection();
  await dropTestDatabase(TEST_DATABASE);
});

describe('чтение сниппетов', () => {
  test('владелец открывает свой приватный сниппет', async () => {
    const snippet = await owner.snippets.getSnippetById(privateSnippetId);
    expect(snippet.id).toBe(privateSnippetId);
  });

  test('посторонний не получает чужой приватный сниппет по id', async () => {
    await expect(
      stranger.snippets.getSnippetById(privateSnippetId),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('гость не получает приватный сниппет по id', async () => {
    await expect(
      guest.snippets.getSnippetById(privateSnippetId),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('публичный сниппет доступен гостю', async () => {
    const snippet = await guest.snippets.getSnippetById(publicSnippetId);
    expect(snippet.id).toBe(publicSnippetId);
  });

  test('приватный сниппет не отдаётся по username+slug постороннему', async () => {
    await expect(
      stranger.snippets.getSnippetByUsernameSlug({
        username: 'owner',
        slug: 'secret',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('владелец открывает свой приватный сниппет по username+slug', async () => {
    const snippet = await owner.snippets.getSnippetByUsernameSlug({
      username: 'owner',
      slug: 'secret',
    });
    expect(snippet.id).toBe(privateSnippetId);
  });

  /**
   * «По ссылке» — это ровно то, что обещано: доступ есть у того, кому автор дал
   * ссылку. Профиль и перебор id такой ссылкой не являются, а раньше оба
   * работали: профиль фильтровал `ne(visibility,'private')`, а getSnippetById
   * проверял только 'private'.
   */
  test('публичный профиль показывает только публичные сниппеты', async () => {
    const list = await guest.snippets.getPublicSnippetsByUsername({
      username: 'owner',
    });
    expect(list.map((s) => s.id)).toEqual([publicSnippetId]);
  });

  test('сниппет «по ссылке» не вычитывается перебором id', async () => {
    await expect(
      guest.snippets.getSnippetById(linkSnippetId),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      stranger.snippets.getSnippetById(linkSnippetId),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('сниппет «по ссылке» открывается по короткому коду и владельцу по id', async () => {
    const byCode = await guest.snippets.getSnippetByShortCode(linkShortCode);
    expect(byCode.id).toBe(linkSnippetId);

    const byId = await owner.snippets.getSnippetById(linkSnippetId);
    expect(byId.id).toBe(linkSnippetId);
  });

  test('выборка всех сниппетов закрыта от обычного пользователя и гостя', async () => {
    await expect(stranger.snippets.getAllSnippets()).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(guest.snippets.getAllSnippets()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
    await expect(admin.snippets.getAllSnippets()).resolves.toBeDefined();
  });

  test('getMySnippets отдаёт только свои сниппеты', async () => {
    const mine = await owner.snippets.getMySnippets();
    expect(mine.map((s) => s.id).sort()).toEqual(
      [privateSnippetId, publicSnippetId, linkSnippetId].sort(),
    );
    await expect(stranger.snippets.getMySnippets()).resolves.toEqual([]);
  });
});

describe('изменение сниппетов', () => {
  test('посторонний не может изменить чужой сниппет', async () => {
    await expect(
      stranger.snippets.updateSnippet({
        id: privateSnippetId,
        code: 'pwned',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });

    const [row] = await db
      .select({ code: snippets.code })
      .from(snippets)
      .where(eq(snippets.id, privateSnippetId));
    expect(row.code).toBe('console.log(1)');
  });

  test('посторонний не может опубликовать чужой сниппет', async () => {
    await expect(
      stranger.snippets.setVisibility({
        id: privateSnippetId,
        visibility: 'public',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('посторонний не может удалить чужой сниппет', async () => {
    await expect(
      stranger.snippets.deleteSnippet({ id: privateSnippetId }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('гость не может создать сниппет', async () => {
    await expect(
      guest.snippets.createSnippet({
        name: 'draft',
        code: 'x',
        language: 'javascript',
      }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('владельцем нового сниппета становится автор сессии, а не тело запроса', async () => {
    // userId в схеме больше нет: даже если клиент его пришлёт, поле отбрасывается.
    const created = await stranger.snippets.createSnippet({
      name: 'mine',
      code: 'x',
      language: 'javascript',
      userId: ownerId,
    } as never);

    expect(created.userId).toBe(strangerId);
  });

  /**
   * Пустой сниппет — нормальное состояние: тумблер «Начать с примера кода»
   * выключен, или человек стёр всё в редакторе. Раньше схема требовала min(1),
   * и оба случая заканчивались ошибкой сохранения.
   */
  test('сниппет создаётся с пустым кодом', async () => {
    const created = await stranger.snippets.createSnippet({
      name: 'empty',
      code: '',
      language: 'javascript',
    });
    expect(created.code).toBe('');
  });

  test('слишком большой код отвергается', async () => {
    await expect(
      stranger.snippets.createSnippet({
        name: 'huge',
        code: 'x'.repeat(100_001),
        language: 'javascript',
      }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('видимость из запроса сохраняется, а не подменяется значением по умолчанию', async () => {
    const created = await stranger.snippets.createSnippet({
      name: 'открытый',
      code: 'console.log(1)',
      language: 'javascript',
      visibility: 'public',
    });
    expect(created.visibility).toBe('public');
  });

  test('владелец меняет свой сниппет', async () => {
    const updated = await owner.snippets.updateSnippet({
      id: publicSnippetId,
      code: 'console.log(42)',
    });
    expect(updated.code).toBe('console.log(42)');
  });
});

describe('пользователи', () => {
  test('публичная карточка не содержит email и признака админа', async () => {
    const profile = await guest.users.getUserByUsername('owner');
    expect(profile).toEqual({
      id: ownerId,
      username: 'owner',
      createdAt: expect.any(Date),
    });

    const byId = await guest.users.getUserById(ownerId);
    expect(byId).not.toHaveProperty('email');
  });

  test('поиск по email закрыт от всех, кроме админа', async () => {
    await expect(
      stranger.users.getUserByEmail('owner@example.com'),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      guest.users.getUserByEmail('owner@example.com'),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('ни одна процедура пользователей не возвращает password и recoverHash', async () => {
    const fromAdminList = await admin.users.getAllUsers();
    for (const user of fromAdminList) {
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('recoverHash');
    }

    const me = await owner.auth.me();
    expect(me.user).not.toHaveProperty('password');
    expect(me.user).not.toHaveProperty('recoverHash');

    const data = await owner.users.getData(ownerId);
    expect(data.currentUser).not.toHaveProperty('password');
    for (const snippet of data.snippets) {
      expect(snippet.user).not.toHaveProperty('password');
    }
  });

  test('нельзя изменить чужой профиль', async () => {
    await expect(
      stranger.users.updateUser({ id: ownerId, username: 'hijacked' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('нельзя удалить чужой аккаунт', async () => {
    await expect(
      stranger.users.deleteUser({ id: ownerId }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('нельзя прочитать чужие настройки и данные', async () => {
    await expect(stranger.users.getUserSettings(ownerId)).rejects.toMatchObject(
      { code: 'FORBIDDEN' },
    );
    await expect(stranger.users.getData(ownerId)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
    await expect(
      stranger.users.updateUserSettings({ userId: ownerId, theme: 'dark' }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  /**
   * Раньше сохранение настроек было чистым UPDATE: у пользователя, который не
   * открывал настройки, строки не было, UPDATE менял ноль записей и процедура
   * отвечала ошибкой. То есть первое сохранение настроек падало всегда.
   */
  test('настройки сохраняются с первого раза, без предварительного чтения', async () => {
    const saved = await stranger.users.updateUserSettings({
      userId: strangerId,
      theme: 'dark',
    });

    expect(saved.theme).toBe('dark');
    expect(saved.userId).toBe(strangerId);
  });

  test('частичное сохранение не сбрасывает остальные настройки', async () => {
    await stranger.users.updateUserSettings({
      userId: strangerId,
      language: 'en',
    });

    const settings = await stranger.users.getUserSettings(strangerId);
    expect(settings.language).toBe('en');
    // Тема была задана предыдущим тестом и не должна вернуться к значению
    // по умолчанию.
    expect(settings.theme).toBe('dark');
  });

  test('у пользователя не появляется вторая строка настроек', async () => {
    // Одновременные обращения — две открытые вкладки: раньше оба видели пустой
    // результат и оба вставляли строку.
    await Promise.all([
      owner.users.getUserSettings(ownerId),
      owner.users.getUserSettings(ownerId),
      owner.users.updateUserSettings({ userId: ownerId, theme: 'light' }),
    ]);

    const rows = await db
      .select({ id: userSettings.settingsId })
      .from(userSettings)
      .where(eq(userSettings.userId, ownerId));

    expect(rows).toHaveLength(1);
  });

  test('роль не меняется через обновление профиля', async () => {
    await stranger.users.updateUser({
      id: strangerId,
      isAdmin: true,
    } as never);

    const [row] = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, strangerId));
    expect(row.isAdmin).toBe(false);
  });

  test('смена роли доступна только админу', async () => {
    await expect(
      stranger.users.setUserRole({ id: strangerId, isAdmin: true }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('пароль нельзя записать через обновление профиля', async () => {
    // Раньше updateUser принимал password и писал его в БД как есть — открытым
    // текстом (#791). Поля в схеме больше нет, значение отбрасывается.
    await owner.users.updateUser({
      id: ownerId,
      password: 'plaintext-sneaked-in',
    } as never);

    const [row] = await db
      .select({ password: users.password })
      .from(users)
      .where(eq(users.id, ownerId));

    expect(row.password).not.toBe('plaintext-sneaked-in');
    await expect(verifyPassword(KNOWN_PASSWORD, row.password)).resolves.toBe(
      true,
    );
  });
});

describe('смена пароля', () => {
  test('нужна авторизация', async () => {
    await expect(
      guest.auth.changePassword({
        currentPassword: KNOWN_PASSWORD,
        newPassword: 'Another-horse-9',
      }),
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('неверный текущий пароль не даёт сменить пароль', async () => {
    await expect(
      stranger.auth.changePassword({
        currentPassword: 'not-my-password',
        newPassword: 'Another-horse-9',
      }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('новый пароль проверяется политикой', async () => {
    await expect(
      stranger.auth.changePassword({
        currentPassword: KNOWN_PASSWORD,
        newPassword: 'password',
      }),
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});
