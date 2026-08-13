import { TRPCError } from '@trpc/server';
import { hashPassword, validatePasswordPolicy } from '../auth/password';
import { toPublicProfile, toPublicUser } from '../auth/publicUser';
import {
  type AuthenticatedUser,
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from '../context';

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
  setUserRole,
  setUserRoleSchema,
  updateUser,
  updateUserSchema,
  updateUserSettings,
  updateUserSettingsSchema,
} from '../db/users';

/**
 * Доступ к данным конкретного пользователя: только он сам либо админ (#792).
 *
 * Без этой проверки процедуры вида «отдай/измени пользователя по id»
 * равносильны захвату любого аккаунта: id — последовательное число, и его не
 * надо угадывать.
 */
function assertSelfOrAdmin(viewer: AuthenticatedUser, targetId: number): void {
  if (viewer.id === targetId || viewer.isAdmin) {
    return;
  }

  throw new TRPCError({ code: 'FORBIDDEN' });
}

export const userRouter = router({
  /**
   * Публичная карточка пользователя (подпись автора у сниппета, страница
   * профиля). Отдаёт только id/username/createdAt — см. toPublicProfile.
   * Свои полные данные пользователь получает через auth.me.
   */
  getUserById: publicProcedure
    .input(getUserByIdSchema)
    .query(async ({ input }) => {
      const user = await getUserById(input);
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }
      return toPublicProfile(user);
    }),

  /** См. getUserById — та же публичная проекция, поиск по имени. */
  getUserByUsername: publicProcedure
    .input(getUserByUsernameSchema)
    .query(async ({ input }) => {
      const user = await getUserByUsername(input);
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }
      return toPublicProfile(user);
    }),

  /**
   * Поиск по email — только для админов. Публичный маршрут здесь работал как
   * оракул «есть ли такой email в базе»: по нему проверяют утёкшие адреса и
   * подбирают цели для брутфорса. Вход выдаёт одинаковую ошибку для неверного
   * email и неверного пароля именно чтобы такого оракула не было (auth.login).
   */
  getUserByEmail: adminProcedure
    .input(getUserByEmailSchema)
    .query(async ({ input }) => {
      const user = await getUserByEmail(input);
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }
      return toPublicUser(user);
    }),

  // Легаси-маршрут, отдающий всех пользователей — ограничен админами до
  // переезда на profile-агрегаты (#717/#718).
  getAllUsers: adminProcedure.query(async () => {
    return await getAllUsers();
  }),

  // Ограничен админами: создаёт пользователя вне обычного флоу регистрации
  // (auth.register). Хеширует пароль и проверяет политику самостоятельно,
  // т.к. createUser() в db/users.ts ожидает уже готовый хеш.
  createUser: adminProcedure
    .input(createUserSchema)
    .mutation(async ({ input }) => {
      const passwordCheck = validatePasswordPolicy(input.password);
      if (!passwordCheck.ok) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: passwordCheck.errors.join(', '),
        });
      }

      const passwordHash = await hashPassword(input.password);

      return await createUser({ ...input, password: passwordHash });
    }),

  /**
   * Изменение своего профиля (имя, email). Пароль сюда не входит — он меняется
   * через auth.changePassword, где проверяется текущий пароль.
   */
  updateUser: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input;
      assertSelfOrAdmin(ctx.user, id);

      const user = await updateUser(id, updates);
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      return user;
    }),

  // isAdmin исключён из updateUserSchema намеренно — смена роли идёт только
  // через этот отдельный admin-only маршрут.
  setUserRole: adminProcedure
    .input(setUserRoleSchema)
    .mutation(async ({ input, ctx }) => {
      if (input.id === ctx.user.id && !input.isAdmin) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot remove your own admin role',
        });
      }

      const user = await setUserRole(input.id, input.isAdmin);
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      return user;
    }),

  /**
   * Удаление аккаунта — своего или, для админа, любого. Каскад по сниппетам,
   * настройкам и токенам обеспечен onDelete: 'cascade' в схеме (#834).
   */
  deleteUser: protectedProcedure
    .input(deleteUserSchema)
    .mutation(async ({ input, ctx }) => {
      assertSelfOrAdmin(ctx.user, input.id);

      const success = await deleteUser(input.id);
      if (!success) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      return { success: true, id: input.id };
    }),

  getUserSettings: protectedProcedure
    .input(getUserByIdSchema)
    .query(async ({ input, ctx }) => {
      assertSelfOrAdmin(ctx.user, input);

      return await getUserSettings(input);
    }),

  updateUserSettings: protectedProcedure
    .input(updateUserSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      const { userId, ...settings } = input;
      assertSelfOrAdmin(ctx.user, userId);

      return await updateUserSettings(userId, settings);
    }),

  /**
   * Настройки вместе со сниппетами — включая приватные, поэтому только свои.
   * Публичный список сниппетов профиля живёт в snippets.getPublicSnippetsByUsername.
   */
  getData: protectedProcedure
    .input(getUserByIdSchema)
    .query(async ({ input, ctx }) => {
      assertSelfOrAdmin(ctx.user, input);

      return await getData({ id: input });
    }),
});
