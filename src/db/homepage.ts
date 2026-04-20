import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod/v4';
import { db } from './connection';
import { sections, type Section, type NewSection } from './schema/schema';

export const SectionSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title не может быть пустым'),
  description: z.string().min(1, 'Description не может быть пустым'),
  content: z
    .string()
    .min(1, 'Content не может быть пустым')
    .refine(
      (val) => {
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: 'Content должен быть валидным JSON',
      }
    ),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const UpdateContentSchema = z
  .string()
  .min(1, 'Content не может быть пустой строкой')
  .refine(
    (val) => {
      try {
        const parsed = JSON.parse(val);
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
      message: 'Content должен быть валидным непустым JSON объектом',
    }
  );
  
// для использования на клиенте
export const ParsedContentSchema = z.string().transform((val) => {
  try {
    return JSON.parse(val);
  } catch {
    throw new Error('Невалидный JSON');
  }
});

export type ValidSection = z.infer<typeof SectionSchema>;
export type UpdateContent = z.infer<typeof UpdateContentSchema>;
export type ParsedContent = z.infer<typeof ParsedContentSchema>;

export async function getAllSections(): Promise<ValidSection[]> {
  const result = await db.select().from(sections);
  return result.map(section => SectionSchema.parse(section));
}

export async function getSectionById(id: number): Promise<ValidSection | null> {
  const result = await db.select().from(sections).where(eq(sections.id, id));
  if (result.length === 0) {
    return null;
  }
  return SectionSchema.parse(result[0]);
}

export async function updateSectionContent(
  id: number,
  content: string
): Promise<ValidSection | null> {
  const validated = UpdateContentSchema.parse(content);
  
  const result = await db
    .update(sections)
    .set({
      content: validated,
      updatedAt: new Date(),
    })
    .where(eq(sections.id, id))
    .returning();
  
  if (result.length === 0) {
    return null;
  }
  
  return SectionSchema.parse(result[0]);
}
