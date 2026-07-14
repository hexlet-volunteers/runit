import { createTRPCContext } from '@trpc/tanstack-react-query';
import type { AppRouter } from '../../../../../types/router/index';

export const { useTRPC, TRPCProvider, useTRPCClient } =
  createTRPCContext<AppRouter>();