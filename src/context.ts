import { initTRPC } from '@trpc/server';

// import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
// import { db } from './db/connection';

// export interface Context {
//   db: typeof db;
//   req: CreateFastifyContextOptions['req'];
//   res: CreateFastifyContextOptions['res'];
// }

// export const createContext = ({ req, res }: CreateFastifyContextOptions): Context => ({
//   db,
//   req,
//   res,
// });

// export const t = initTRPC.context<Context>().create({
//   errorFormatter({ shape }) {
//     return shape;
//   },
// });

const t = initTRPC.create({
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
