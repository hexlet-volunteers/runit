import { desc, eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import { emailSchema } from '../auth/email';
import { db } from './connection';
import { isUniqueViolationOn } from './errors';
import {
  type NewUser,
  type NewUserSettings,
  snippets,
  type UserSettings,
  userSettings,
  users,
} from './schema/schema';

// to do:
// 1) дописать сброс пароля resetPassword
// 2) recover  - подключить sentry
// 3) checkHash

/**
 * Столбцы, безопасные для возврата клиенту — никогда не включают password
 * и recoverHash. Использовать во всех select/.returning(), результат которых
 * может попасть в tRPC-ответ.
 */
const safeUserColumns = {
  id: users.id,
  username: users.username,
  email: users.email,
  isAdmin: users.isAdmin,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
} as const;

export type SafeUser = {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const userSchema = z.object({
  id: z.number(),
  username: z.string().min(3).max(20),
  email: emailSchema,
  password: z.string().min(6).max(60),
  isAdmin: z.boolean().default(false),
  recoverHash: z.string().max(50).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserSchema = z.object({
  username: z.string().min(3).max(20),
  email: emailSchema,
  password: z.string().min(8).max(60),
  isAdmin: z.boolean().default(false).optional(),
  recoverHash: z.string().max(50).optional(),
});

/**
 * Обновление профиля. Ни password, ни recoverHash здесь нет намеренно:
 *  - пароль меняется только через auth.changePassword — там проверяется текущий
 *    пароль, политика и повторное использование, и результат хешируется. Пока
 *    поле было в этой схеме, любое обновление профиля могло записать пароль
 *    в открытом виде (#791);
 *  - recoverHash — внутреннее поле восстановления доступа, клиент не должен
 *    иметь возможности задать его сам (иначе выпишет себе токен сброса).
 *
 * isAdmin тоже исключён — роль меняется только через admin-only setUserRole.
 */
export const updateUserSchema = z.object({
  id: z.number(),
  username: z.string().min(3).max(20).optional(),
  email: emailSchema.optional(),
});

export const userSettingsSchema = z.object({
  id: z.number(),
  userId: z.number(),
  theme: z.enum(['system', 'light', 'dark']).default('system'),
  language: z.enum(['ru', 'en', 'es', 'fr', 'de']).default('ru'),
  avatarBase64: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserSettingsSchema = z.object({
  userId: z.number(),
  theme: z.enum(['system', 'light', 'dark']).default('system').optional(),
  language: z.enum(['ru', 'en', 'es', 'fr', 'de']).default('ru').optional(),
  avatarBase64: z.string().nullable().optional(),
});

export const updateUserSettingsSchema = z.object({
  userId: z.number(),
  theme: z.enum(['system', 'light', 'dark']).optional(),
  language: z.enum(['ru', 'en', 'es', 'fr', 'de']).optional(),
  avatarBase64: z.string().nullable().optional(),
});

export const deleteUserSchema = z.object({
  id: z.coerce.number().positive(),
});

export const setUserRoleSchema = z.object({
  id: z.number(),
  isAdmin: z.boolean(),
});

export const getUserByIdSchema = z.number();
export const getUserByEmailSchema = emailSchema;
export const getUserByUsernameSchema = z.string().min(3).max(20);

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;

export async function getUserById(id: number): Promise<SafeUser | undefined> {
  try {
    const [user] = await db
      .select(safeUserColumns)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user;
  } catch (error) {
    console.error('Error getting user by id:', error);
    throw new Error('Failed to get user');
  }
}

export async function getUserByEmail(
  email: string,
): Promise<SafeUser | undefined> {
  try {
    const [user] = await db
      .select(safeUserColumns)
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw new Error('Failed to get user');
  }
}

export async function getUserByUsername(
  username: string,
): Promise<SafeUser | undefined> {
  try {
    const [user] = await db
      .select(safeUserColumns)
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    return user;
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw new Error('Failed to get user');
  }
}

// выяснить, для чего нужен этот маршрут
export async function getAllUsers(): Promise<SafeUser[]> {
  try {
    const allUsers = await db
      .select(safeUserColumns)
      .from(users)
      .orderBy(desc(users.createdAt));

    return allUsers;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw new Error('Failed to get users');
  }
}

/**
 * Данные для создания пользователя. Версия согласия приходит отдельно от
 * пользовательского ввода: её проверяет и подставляет auth.register (#866),
 * а не клиент.
 */
export type CreateUserData = CreateUserInput & {
  consentVersion?: string;
};

export async function createUser(userData: CreateUserData): Promise<SafeUser> {
  try {
    const newUser: NewUser = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      recoverHash: userData.recoverHash || null,
      // Дата согласия ставится здесь же: версия без даты не отвечает на вопрос
      // «когда получено согласие», который и задаёт проверяющий.
      consentVersion: userData.consentVersion ?? null,
      consentGivenAt: userData.consentVersion ? new Date() : null,
    };

    const result = await db
      .insert(users)
      .values(newUser)
      .returning(safeUserColumns);

    if (!result[0]) {
      throw new Error('Failed to create user');
    }

    return result[0];
  } catch (error) {
    console.error('Error creating user:', error);
    if (isUniqueViolationOn(error, 'username')) {
      throw new Error('Username already exists');
    }
    if (isUniqueViolationOn(error, 'email')) {
      throw new Error('Email already exists');
    }
    throw new Error('Failed to create user');
  }
}

export async function updateUser(
  id: number,
  updates: Omit<UpdateUserInput, 'id'>, // ← используем UpdateUserInput и исключаем id
): Promise<SafeUser | null> {
  try {
    const updateData: Partial<NewUser> = {
      ...updates,
      updatedAt: new Date(),
    };

    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning(safeUserColumns);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Error updating user:', error);
    if (isUniqueViolationOn(error, 'username')) {
      throw new Error('Username already exists');
    }
    if (isUniqueViolationOn(error, 'email')) {
      throw new Error('Email already exists');
    }
    throw new Error('Failed to update user');
  }
}

/**
 * Записывает уже готовый bcrypt-хеш. Отделено от updateUser сознательно:
 * там принимаются данные прямо из ввода клиента, здесь — значение, которое
 * обязано быть посчитано hashPassword(). Единственный вызывающий —
 * auth.changePassword.
 */
export async function updateUserPasswordHash(
  id: number,
  passwordHash: string,
): Promise<void> {
  try {
    await db
      .update(users)
      .set({ password: passwordHash, updatedAt: new Date() })
      .where(eq(users.id, id));
  } catch (error) {
    console.error('Error updating password:', error);
    throw new Error('Failed to update password');
  }
}

export async function setUserRole(
  id: number,
  isAdmin: boolean,
): Promise<SafeUser | null> {
  try {
    const result = await db
      .update(users)
      .set({ isAdmin })
      .where(eq(users.id, id))
      .returning(safeUserColumns);

    return result[0] ?? null;
  } catch (error) {
    console.error('Error setting user role:', error);
    throw new Error('Failed to set user role');
  }
}

/**
 * Признак «что-то действительно изменилось» получаем через RETURNING, а не из
 * метаданных результата: поле `changes` было особенностью better-sqlite3, в
 * postgres-js его нет. Без RETURNING проверка `changes > 0` читалась бы как
 * `undefined > 0`, то есть всегда false — удаление существующего пользователя
 * отвечало бы «не найден».
 */
export async function deleteUser(id: number): Promise<boolean> {
  try {
    const deleted = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    return deleted.length > 0;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
}

export async function updateRecoverHash(
  email: string,
  recoverHash: string | null,
): Promise<boolean> {
  try {
    const updated = await db
      .update(users)
      .set({ recoverHash })
      .where(eq(users.email, email))
      .returning({ id: users.id });

    return updated.length > 0;
  } catch (error) {
    console.error('Error updating recover hash:', error);
    throw new Error('Failed to update recover hash');
  }
}

// получить настройки пользователя отдельно:
export async function getUserSettings(userId: number): Promise<UserSettings> {
  try {
    let settingsUser = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    if (settingsUser.length === 0) {
      const newSettings: NewUserSettings = {
        userId: userId,
        theme: 'system',
        language: 'ru',
        avatarBase64: null,
      };

      const createdSettings = await db
        .insert(userSettings)
        .values(newSettings)
        .returning();

      settingsUser = createdSettings;
    }

    return settingsUser[0];
  } catch (error) {
    console.error('Error getting user settings:', error);
    throw new Error('Failed to get user settings');
  }
}

// обновить настройки пользователя
export async function updateUserSettings(
  id: number,
  updateData: Omit<UpdateUserSettingsInput, 'userId'>, // ← исключаем userId
): Promise<UserSettings> {
  try {
    // Валидация теперь не нужна, т.к. тип уже правильный

    const updatedSettings = await db
      .update(userSettings)
      .set({
        // Явно указываем только нужные поля (как в updateSnippet)
        theme: updateData.theme,
        language: updateData.language,
        avatarBase64: updateData.avatarBase64,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, id))
      .returning();

    if (updatedSettings.length === 0) {
      throw new Error('Failed to update user settings');
    }

    return updatedSettings[0];
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw new Error('Failed to update user settings');
  }
}

// получение данных пользователя - настройки и сниппеты
export async function getData({ id }: { id: number }): Promise<{
  currentUser: SafeUser & {
    language: string;
    theme: string;
    avatarBase64: string | null;
  };
  snippets: (typeof snippets.$inferSelect & { user: SafeUser })[];
}> {
  try {
    const currentUser = await getUserById(id);
    if (!currentUser) {
      throw new Error('User not found');
    }

    const settings = await getUserSettings(id);

    const userSnippets = await db
      .select({
        snippet: snippets,
        user: safeUserColumns,
      })
      .from(snippets)
      .innerJoin(users, eq(snippets.userId, users.id))
      .where(eq(snippets.userId, id));

    const userData = {
      ...currentUser,
      language: settings.language,
      theme: settings.theme,
      avatarBase64: settings.avatarBase64,
    };

    const formattedSnippets = userSnippets.map((item) => ({
      ...item.snippet,
      user: item.user,
    }));

    return {
      currentUser: userData,
      snippets: formattedSnippets,
    };
  } catch (error) {
    console.error('Error getting user data:', error);
    throw new Error('Failed to get user data');
  }
}
