import { publicProcedure, router } from '../context';

import {
  createUser,
  createUserSchema,
  deleteUser,
  deleteUserSchema,
  getAllUsers,
  getData,
  getUserByEmail,
  getUserByEmailSchema,
  getUserById,
  getUserByIdSchema,
  getUserByUsername,
  getUserByUsernameSchema,
  getUserSettings,
  updateUser,
  updateUserSchema,
  updateUserSettings,
  updateUserSettingsSchema,
} from '../db/users';

export const userRouter = router({
  getUserById: publicProcedure
    .input(getUserByIdSchema)
    .query(async ({ input }) => {
      const user = await getUserById(input);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }),

  getUserByEmail: publicProcedure
    .input(getUserByEmailSchema)
    .query(async ({ input }) => {
      const user = await getUserByEmail(input);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }),

  getUserByUsername: publicProcedure
    .input(getUserByUsernameSchema)
    .query(async ({ input }) => {
      const user = await getUserByUsername(input);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }),

  getAllUsers: publicProcedure.query(async () => {
    return await getAllUsers();
  }),

  createUser: publicProcedure
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      return await createUser(input);
    }),

  updateUser: publicProcedure
    .input(updateUserSchema)
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      return await updateUser(id, updates);
    }),

  deleteUser: publicProcedure
    .input(deleteUserSchema)
    .mutation(async ({ input }) => {
      const success = await deleteUser(input.id);

      if (!success) {
        throw new Error('User not found');
      }

      return { success: true, id: input };
    }),

  // получить настройки пользователя - profile?
  getUserSettings: publicProcedure
    .input(getUserByIdSchema)
    .query(async ({ input }) => {
      return await getUserSettings(input);
    }),

  updateUserSettings: publicProcedure
    .input(updateUserSettingsSchema)
    .mutation(async ({ input }) => {
      const { userId, ...settings } = input;
      return await updateUserSettings(userId, settings);
    }),

  // или это - profile? настройки И сниппеты
  getData: publicProcedure.input(getUserByIdSchema).query(async ({ input }) => {
    return await getData({ id: input });
  }),
});
