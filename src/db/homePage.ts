import { eq, desc } from 'drizzle-orm';
import { z } from 'zod/v4';
import { db } from './connection';
import { 
  sections,
  type Section,
  type NewSection
} from './schema/schema';

/**
 * Валидация данных для компонентов главной страницы
*/
export const sectionSchema = z.object({
  id: z.number(),
  title: z.string().min(1, 'Title не может быть пустым'),
  description: z.string().min(1, 'Description не может быть пустым'),
  content: z
    .string()
    .min(1, 'Content не может быть пустым')
    .refine((value) => {
      try {
        const parsed = JSON.parse(value);
        return typeof parsed === 'object' && parsed !== null;
      } catch {
        return false;
      }
    },
    {
      message: 'Content должен быть валидным JSON',
    }
  ),
  componentType: z.string().min(1, 'Type не может быть пустым'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const createSectionSchema = z.object({
  title: z.string().min(1, 'Title не может быть пустым'),
  description: z.string().min(1, 'Description не может быть пустым'),
  content: z
    .string()
    .min(1, 'Content не может быть пустой строкой')
    .refine((value) => {
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
      message: 'Content должен быть валидным непустым JSON объектом',
    }
  ),
  componentType: z.string().min(1, 'Type не может быть пустым'),
});

export const updateSectionSchema = createSectionSchema.partial().extend({
  id: z.number(),
});

export type ValidSection = z.infer<typeof sectionSchema>;
export type CreateSectiontInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;

/**
 * @route homePage.getHomePageData
 * @returns {HomePageData} Данные главной страницы
*/
export async function getHomePageData(): Promise<ValidSection[]> {
  try {
    const data = await db.select().from(sections)

    return data.map((section) => sectionSchema.parse(section));
  } catch (error) {
    console.error('Ошибка получения данных главной страницы:', error);
    throw new Error('Не удалось получить данные главной страницы');
  }
}

/**
 * Получение одного компонента по ID
*/
export async function getSectionById(id: number): Promise<ValidSection | undefined> {
  try {
    const [data] = await db
      .select()
      .from(sections)
      .where(eq(sections.id, id))
      .limit(1);
    
    return sectionSchema.parse(data);
  } catch (error) {
    console.error('Ошибка получения компонента по ID:', error);
    throw new Error('Не удалось получить компонент');
  }
}

/**
 * Создание нового компонента
*/
export async function createSection(input: CreateSectiontInput): Promise<ValidSection> {
  try {
    const newSection: NewSection = {
      title: input.title,
      description: input.description,
      content: input.content,
      componentType: input.componentType,
    };
    const data = await db.insert(sections).values(newSection).returning();

    if (!data || data.length === 0) {
      throw new Error('Не удалось создать компонент');
    }

    return sectionSchema.parse(data[0]);
  } catch (error) {
    console.error('Ошибка создания компонента главной страницы:', error);
    throw new Error('Не удалось создать компонент');
  }
}

/**
 * Редактирование существующего компонента
*/
export async function updateSection(input: UpdateSectionInput): Promise<ValidSection> {
  try {
    const { id, ...updateData } = input;
    const component = await getSectionById(id);
    
    if (!component) {
      throw new Error(`Компонент с ID ${id} не найден`);
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
      throw new Error('Не удалось обновить компонент');
    }

    return sectionSchema.parse(data[0]);
  } catch (error) {
    console.error('Ошибка обновления компонента:', error);
    throw new Error('Не удалось обновить компонент');
  }
}
