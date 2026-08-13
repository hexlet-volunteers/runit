import { faker } from '@faker-js/faker';
import { and, desc, eq, ne } from 'drizzle-orm';
import { z } from 'zod/v4';
import { generateUniqSlug } from '../utils/generate-uniq-slug';
import { db } from './connection';
import {
  type NewSnippet,
  type Snippet,
  snippets,
  users,
} from './schema/schema';

export const snippetSchema = z.object({
  id: z.number(),
  name: z.string().min(1).max(30),
  slug: z.string().max(30).nullable(),
  code: z.string().min(1),
  language: z.enum([
    'javascript',
    'typescript',
    'python',
    'php',
    'ruby',
    'java',
    'go',
    'cpp',
    'sql',
    'bash',
    'html',
    'css',
  ]),
  userId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/** Уровни доступа к сниппету. */
export const VISIBILITIES = ['private', 'link', 'public'] as const;
export const visibilitySchema = z.enum(VISIBILITIES);
export type Visibility = (typeof VISIBILITIES)[number];

export const getSnippetByShortCodeSchema = z.string().min(4).max(16);

export const setVisibilitySchema = z.object({
  id: z.number(),
  visibility: visibilitySchema,
});

export const createSnippetSchema = z.object({
  name: z.string().min(1).max(30),
  code: z.string().min(1),
  slug: z.string().max(30).optional(),
  language: z.enum([
    'javascript',
    'typescript',
    'python',
    'php',
    'ruby',
    'java',
    'go',
    'cpp',
    'sql',
    'bash',
    'html',
    'css',
  ]),
  visibility: visibilitySchema.optional(),
});

export const updateSnippetSchema = createSnippetSchema.partial().extend({
  id: z.number(),
});

export const getSnippetByIdSchema = z.coerce.number().positive();

export const deleteSnippetSchema = z.object({
  id: z.coerce.number().positive(),
});

export const getSnippetByUsernameSlugSchema = z.object({
  username: z.string(),
  slug: z.string(),
});

export const getPublicSnippetsByUsernameSchema = z.object({
  username: z.string().min(1).max(50),
});

export type CreateSnippetInput = z.infer<typeof createSnippetSchema>;
export type UpdateSnippetInput = z.infer<typeof updateSnippetSchema>;

/**
 * userId нет в createSnippetSchema намеренно: владелец берётся из сессии
 * (ctx.user.id), а не из тела запроса. Пока поле принималось от клиента, любой
 * мог создать сниппет от имени чужого аккаунта (#792).
 */
export type CreateSnippetData = CreateSnippetInput & { userId: number };

async function verifyUserExists(userId: number): Promise<void> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error(`User with id ${userId} not found`);
  }
}

async function generateSlug(userId: number): Promise<string> {
  try {
    const userSnippets = await db
      .select({ slug: snippets.slug })
      .from(snippets)
      .where(eq(snippets.userId, userId));

    const validSnippets = userSnippets.filter(
      (snippet): snippet is { slug: string } => snippet.slug !== null,
    );
    return generateUniqSlug(validSnippets);
  } catch (error) {
    console.error('Error in generateSlug:', error);
    // Fallback to random slug if generation fails
    return Math.random().toString(36).substring(2, 10);
  }
}
/**
 * Сниппет по id — путь редактора, поэтому приватные здесь НЕ отсекаются:
 * владелец обязан открывать свой приватный сниппет.
 *
 * Владельца от постороннего отличает вызывающий: снаружи это
 * snippets.getSnippetById, где приватный сниппет отдаётся только владельцу или
 * админу (#792, #346). Внутри БД-слоя фильтра нет намеренно — иначе владелец
 * не сможет открыть свой черновик.
 */
export async function getSnippetById(id: number): Promise<Snippet | undefined> {
  try {
    const [snippet] = await db
      .select()
      .from(snippets)
      .where(eq(snippets.id, id))
      .limit(1);

    return snippet;
  } catch (error) {
    console.error('Error in getSnippetById:', error);
    throw new Error('Failed to get snippet by ID');
  }
}

/**
 * Сниппет по паре username+slug — старый путь просмотра (/s/:username/:slug).
 *
 * Приватные не отдаём. Без этой проверки отмена публичности не работала:
 * сниппет закрывали тумблером, а по ранее разосланной ссылке он продолжал
 * открываться, потому что видимость проверялась только в
 * getSnippetByShortCode.
 */
export async function getSnippetByUsernameSlug(
  username: string,
  slug: string,
  viewerId?: number,
): Promise<Snippet | undefined> {
  try {
    const [result] = await db
      .select()
      .from(snippets)
      .innerJoin(users, eq(snippets.userId, users.id))
      .where(and(eq(users.username, username), eq(snippets.slug, slug)))
      .limit(1);

    const snippet = result?.snippets;
    if (!snippet) return undefined;
    // Владелец видит и свой приватный: этот путь открывает редактор.
    if (snippet.visibility === 'private' && snippet.userId !== viewerId) {
      return undefined;
    }
    return snippet;
  } catch (error) {
    console.error('Error in getSnippetByUsernameSlug:', error);
    throw new Error('Failed to get snippet by username and slug');
  }
}

/**
 * Сниппеты пользователя для его публичного профиля: без приватных.
 *
 * Раньше страница профиля брала getAllSnippets и фильтровала по userId на
 * клиенте — то есть каждый посетитель выкачивал таблицу сниппетов всего сайта,
 * включая приватные чужие, и приватные показывались на публичном профиле.
 */
export async function getPublicSnippetsByUsername(
  username: string,
): Promise<Snippet[]> {
  try {
    const rows = await db
      .select({ snippet: snippets })
      .from(snippets)
      .innerJoin(users, eq(snippets.userId, users.id))
      .where(
        and(eq(users.username, username), ne(snippets.visibility, 'private')),
      )
      .orderBy(desc(snippets.createdAt));

    return rows.map((row) => row.snippet);
  } catch (error) {
    console.error('Error in getPublicSnippetsByUsername:', error);
    throw new Error('Failed to get public snippets by username');
  }
}

/**
 * Все сниппеты в БД, включая приватные.
 *
 * Служебная выборка: снаружи доступна только админам
 * (snippets.getAllSnippets). Дашборд пользователя ходит в
 * getSnippetsByUserId, публичный профиль — в getPublicSnippetsByUsername.
 */
export async function getAllSnippets(): Promise<Snippet[]> {
  try {
    return await db.select().from(snippets).orderBy(desc(snippets.createdAt));
  } catch (error) {
    console.error('Error in getAllSnippets:', error);
    throw new Error('Failed to get all snippets');
  }
}

/** Свои сниппеты, включая приватные — выборка дашборда. */
export async function getSnippetsByUserId(userId: number): Promise<Snippet[]> {
  try {
    return await db
      .select()
      .from(snippets)
      .where(eq(snippets.userId, userId))
      .orderBy(desc(snippets.createdAt));
  } catch (error) {
    console.error('Error in getSnippetsByUserId:', error);
    throw new Error('Failed to get user snippets');
  }
}

/**
 * Владелец сниппета — для проверки прав перед изменением. Отдельный запрос
 * вместо полного getSnippetById: проверке нужен только userId, а тащить код
 * сниппета ради неё незачем.
 */
export async function getSnippetOwnerId(
  id: number,
): Promise<number | null | undefined> {
  try {
    const [row] = await db
      .select({ userId: snippets.userId })
      .from(snippets)
      .where(eq(snippets.id, id))
      .limit(1);

    return row ? row.userId : undefined;
  } catch (error) {
    console.error('Error in getSnippetOwnerId:', error);
    throw new Error('Failed to get snippet owner');
  }
}

// по id юзера создание сниппета

/**
 * Короткий код для публичной ссылки (/s/aB3xK9).
 *
 * Алфавит без похожих символов (0/O, 1/l/I), чтобы код можно было продиктовать
 * или перепечатать вручную. Уникальность проверяем запросом: коллизия на
 * 6 символах маловероятна, но обязана быть исключена — по коду открывается
 * чужой сниппет.
 */
const SHORT_CODE_ALPHABET =
  'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

async function generateShortCode(length = 6): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    let code = '';
    for (let i = 0; i < length; i += 1) {
      code +=
        SHORT_CODE_ALPHABET[
          Math.floor(Math.random() * SHORT_CODE_ALPHABET.length)
        ];
    }
    const [taken] = await db
      .select({ id: snippets.id })
      .from(snippets)
      .where(eq(snippets.shortCode, code))
      .limit(1);
    if (!taken) return code;
  }
  // Практически недостижимо; удлиняем код, вместо того чтобы падать.
  return generateShortCode(length + 2);
}

/** Сниппет по короткой ссылке. Приватные по коду не отдаём. */
export async function getSnippetByShortCode(
  shortCode: string,
): Promise<(Snippet & { authorUsername: string | null }) | undefined> {
  try {
    const [row] = await db
      .select({ snippet: snippets, username: users.username })
      .from(snippets)
      .leftJoin(users, eq(snippets.userId, users.id))
      .where(eq(snippets.shortCode, shortCode))
      .limit(1);

    if (!row || row.snippet.visibility === 'private') return undefined;
    return { ...row.snippet, authorUsername: row.username ?? null };
  } catch (error) {
    console.error('Error in getSnippetByShortCode:', error);
    throw new Error('Failed to get snippet by short code');
  }
}

/** Смена уровня доступа. */
export async function setSnippetVisibility(
  id: number,
  visibility: Visibility,
): Promise<Snippet> {
  try {
    const [result] = await db
      .update(snippets)
      .set({ visibility, updatedAt: new Date() })
      .where(eq(snippets.id, id))
      .returning();
    if (!result) throw new Error(`Snippet with id ${id} not found`);
    return result;
  } catch (error) {
    console.error('Error in setSnippetVisibility:', error);
    throw new Error('Failed to update snippet visibility');
  }
}

export async function createSnippet(
  snippetData: CreateSnippetData,
): Promise<Snippet> {
  try {
    await verifyUserExists(snippetData.userId);

    const slug = await generateSlug(snippetData.userId);
    if (!slug) {
      throw new Error('Failed to generate slug');
    }
    const newSnippetData: NewSnippet = {
      name: snippetData.name,
      code: snippetData.code,
      language: snippetData.language,
      slug,
      shortCode: await generateShortCode(),
      // По умолчанию приватный: публикация — осознанное действие автора.
      visibility: snippetData.visibility ?? 'private',
      userId: snippetData.userId,
    };
    const [result] = await db
      .insert(snippets)
      .values(newSnippetData)
      .returning();
    if (!result) {
      throw new Error('Database returned empty result');
    }
    return result;
  } catch (error) {
    console.error('Error in createSnippet:', error);
    throw new Error(
      `Failed to create snippet: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

// обновление снипетта по id сниппета

export async function updateSnippet(
  id: number,
  updates: Omit<UpdateSnippetInput, 'id' | 'userId'>,
): Promise<Snippet> {
  try {
    const [result] = await db
      .update(snippets)
      .set({
        name: updates.name,
        slug: updates.slug,
        code: updates.code,
        language: updates.language,
        updatedAt: new Date(),
      })
      .where(eq(snippets.id, id))
      .returning();

    if (!result) {
      throw new Error(`Snippet with id ${id} not found`);
    }

    return result;
  } catch (error) {
    console.error('Error in updateSnippet:', error);
    throw new Error(
      `Failed to update snippet: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export async function deleteSnippet(id: number): Promise<boolean> {
  try {
    const result = await db.delete(snippets).where(eq(snippets.id, id));

    return result.changes > 0;
  } catch (error) {
    console.error('Error in deleteSnippet:', error);
    throw new Error(
      `Failed to delete snippet: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export function generateName(): string {
  const adjectiveLength = 3 + Math.round(Math.random() * 6);
  const adjective = faker.word.adjective(adjectiveLength);
  const animal = faker.animal.type();
  return `${adjective}-${animal}`;
}
