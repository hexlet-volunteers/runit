import { faker } from '@faker-js/faker';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod/v3';
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
  language: z.enum(['ruby', 'java', 'php', 'python', 'javascript', 'html']),
  userId: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSnippetSchema = z.object({
  name: z.string().min(1).max(30),
  code: z.string().min(1),
  slug: z.string().max(30).optional(),
  language: z.enum(['ruby', 'java', 'php', 'python', 'javascript', 'html']),
  userId: z.number().positive(),
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

export type CreateSnippetInput = z.infer<typeof createSnippetSchema>;
export type UpdateSnippetInput = z.infer<typeof updateSnippetSchema>;

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
// по id снипетта:
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

export async function getSnippetByUsernameSlug(
  username: string,
  slug: string,
): Promise<Snippet | undefined> {
  try {
    const [result] = await db
      .select()
      .from(snippets)
      .innerJoin(users, eq(snippets.userId, users.id))
      .where(and(eq(users.username, username), eq(snippets.slug, slug)))
      .limit(1);

    return result?.snippets;
  } catch (error) {
    console.error('Error in getSnippetByUsernameSlug:', error);
    throw new Error('Failed to get snippet by username and slug');
  }
}

// вообще все снипетты которые есть в БД
export async function getAllSnippets(): Promise<Snippet[]> {
  try {
    return await db.select().from(snippets).orderBy(desc(snippets.createdAt));
  } catch (error) {
    console.error('Error in getAllSnippets:', error);
    throw new Error('Failed to get all snippets');
  }
}

// по id юзера создание сниппета
export async function createSnippet(
  snippetData: CreateSnippetInput,
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

// временная для тестирования:
export async function deleteAllSnippets() {
  const result = await db.delete(snippets);
  return result.changes;
}
