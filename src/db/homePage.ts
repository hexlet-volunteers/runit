import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import { db } from './connection';
import { type NewSection, sections } from './schema/schema';

export const sectionSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  description: z.string().min(1),
  content: z
    .string()
    .min(1)
    .refine(
      (value) => {
        try {
          const parsed = JSON.parse(value);
          return typeof parsed === 'object' && parsed !== null;
        } catch {
          return false;
        }
      },
      {
        message: 'Content must be valid JSON',
      },
    ),
  componentType: z.string().min(1),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createSectionSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  content: z
    .string()
    .min(1)
    .refine(
      (value) => {
        try {
          const parsed = JSON.parse(value);
          return (
            typeof parsed === 'object' &&
            parsed !== null &&
            !Array.isArray(parsed) &&
            Object.keys(parsed).length > 0
          );
        } catch {
          return false;
        }
      },
      {
        message: 'Content must be valid JSON',
      },
    ),
  componentType: z.string().min(1),
});

export const updateSectionSchema = createSectionSchema.partial().extend({
  id: z.number(),
});

export type ValidSection = z.infer<typeof sectionSchema>;
export type CreateSectiontInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

export async function getHomePageData(): Promise<ValidSection[]> {
  try {
    const data = await db.select().from(sections);

    return data.map((section) => sectionSchema.parse(section));
  } catch (error) {
    console.error('Get home page data error:', error);
    throw new Error('Failed to get home page data');
  }
}

export async function getSectionById(
  id: number,
): Promise<ValidSection | undefined> {
  try {
    const [data] = await db
      .select()
      .from(sections)
      .where(eq(sections.id, id))
      .limit(1);

    return sectionSchema.parse(data);
  } catch (error) {
    console.error('Get section by ID error:', error);
    throw new Error('Failed to get section by ID');
  }
}

export async function createSection(
  input: CreateSectiontInput,
): Promise<ValidSection> {
  try {
    const newSection: NewSection = {
      title: input.title,
      description: input.description,
      content: input.content,
      componentType: input.componentType,
    };
    const data = await db.insert(sections).values(newSection).returning();

    if (!data || data.length === 0) {
      throw new Error('Failed to create section');
    }

    return sectionSchema.parse(data[0]);
  } catch (error) {
    console.error('Create section error:', error);
    throw new Error('Failed to create section');
  }
}

export async function updateSection(
  input: UpdateSectionInput,
): Promise<ValidSection> {
  try {
    const { id, ...updateData } = input;
    const component = await getSectionById(id);

    if (!component) {
      throw new Error(`Component with ID ${id} not found`);
    }

    const data = await db
      .update(sections)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(sections.id, id))
      .returning();

    if (!data || data.length === 0) {
      throw new Error('Failed to update section');
    }

    return sectionSchema.parse(data[0]);
  } catch (error) {
    console.error('Update section error:', error);
    throw new Error('Failed to update section');
  }
}
