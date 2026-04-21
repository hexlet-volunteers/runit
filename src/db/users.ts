import { eq, desc } from 'drizzle-orm';
import { z } from 'zod/v3';
import { db } from './connection';
import { 
  users,
  snippets, 
  userSettings,
  type User,
  type NewUser,
  type UserSettings,
  type NewUserSettings
 } from './schema/schema';

 // to do:
 // 1) дописать сброс пароля resetPassword
// 2) recover  - подключить sentry
// 3) checkHash 

export const userSchema = z.object({
  id: z.number(),
  username: z.string().min(3).max(20),
  email: z.string().email().max(60),
  password: z.string().min(6).max(60),
  isAdmin: z.boolean().default(false),
  recoverHash: z.string().max(50).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createUserSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email().max(60),
  password: z.string().min(6).max(60),
  isAdmin: z.boolean().default(false).optional(),
  recoverHash: z.string().max(50).optional(),
});

export const updateUserSchema = z.object({
  id: z.number(),
  username: z.string().min(3).max(20).optional(),
  email: z.string().email().max(60).optional(),
  password: z.string().min(6).max(60).optional(),
  isAdmin: z.boolean().optional(),
  recoverHash: z.string().max(50).optional(),
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
  id: z.coerce.number().positive()
});

export const getUserByIdSchema = z.number();
export const getUserByEmailSchema = z.string().email().max(60);
export const getUserByUsernameSchema = z.string().min(3).max(20);

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;

export async function getUserById(id: number): Promise<User | undefined> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    
    return user;
  } catch (error) {
    console.error('Error getting user by id:', error);
    throw new Error('Failed to get user');
  }
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    return user;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw new Error('Failed to get user');
  }
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  try {
    const [user] = await db
      .select()
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
export async function getAllUsers(): Promise<User[]> {
  try {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
    
    return allUsers;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw new Error('Failed to get users');
  }
}

export async function createUser(userData: CreateUserInput): Promise<User> {
  try {
    const newUser: NewUser = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      recoverHash: userData.recoverHash || null,
    };

    const result = await db.insert(users).values(newUser).returning();
    
    if (!result[0]) {
      throw new Error('Failed to create user');
    }
    
    return result[0];
  } catch (error) {
    console.error('Error creating user:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      if (error.message.includes('username')) {
        throw new Error('Username already exists');
      }
      if (error.message.includes('email')) {
        throw new Error('Email already exists');
      }
    }
    throw new Error('Failed to create user');
  }
}

export async function updateUser(
  id: number,  
  updates: Omit<UpdateUserInput, 'id'> // ← используем UpdateUserInput и исключаем id
): Promise<User | null> {
  try {
    const updateData: Partial<NewUser> = {
      ...updates,
    };

    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      if (error.message.includes('username')) {
        throw new Error('Username already exists');
      }
      if (error.message.includes('email')) {
        throw new Error('Email already exists');
      }
    }
    throw new Error('Failed to update user');
  }
}

export async function deleteUser(id: number): Promise<boolean> {
  try {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));

    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
}

export async function updateRecoverHash(email: string, recoverHash: string | null): Promise<boolean> {
  try {
    const result = await db
      .update(users)
      .set({ recoverHash })
      .where(eq(users.email, email));

    return result.changes > 0;
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
  updateData: Omit<UpdateUserSettingsInput, 'userId'> // ← исключаем userId
): Promise<any> {
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

    const settings = updatedSettings[0];
    const currentUser = await getUserById(id);

    return {
      ...currentUser,
      language: settings.language,
      theme: settings.theme,
      avatar_base64: settings.avatarBase64,
    };
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw new Error('Failed to update user settings');
  }
}

// получение данных пользователя - настройки и сниппеты

// todo: сделать отдельно getSnippetsByUser 

// export async function getData({ id }: { id: number }): Promise<any> {
//   try {
//     const currentUser = await getUserById(id);
//     if (!currentUser) {
//       throw new Error('User not found');
//     }

//     const settings = await getUserSettings(id);

//     const userSnippets = await db
//       .select({
//         snippet: snippets,
//         user: users,
//       })
//       .from(snippets)
//       .innerJoin(users, eq(snippets.userId, users.id))
//       .where(eq(snippets.userId, id));

//     const userData = {
//       ...currentUser,
//       language: settings.language,
//       theme: settings.theme,
//       avatar_base64: settings.avatarBase64,
//     };

//     const formattedSnippets = userSnippets.map(item => ({
//       ...item.snippet,
//       user: item.user,
//     }));

//     return {
//       currentUser: userData,
//       snippets: formattedSnippets,
//     };
//   } catch (error) {
//     console.error('Error getting user data:', error);
//     throw new Error('Failed to get user data');
//   }
// }   

// временная для тестирования:
export async function deleteAllUsers() {
  const result = await db.delete(users);
  return result.changes;
}