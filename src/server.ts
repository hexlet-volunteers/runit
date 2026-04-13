import getApp from './index';
import type { FastifyInstance } from 'fastify';

const app: FastifyInstance = await getApp();

const port: number = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const host: string = process.env.HOST || '0.0.0.0';

app.listen({ port, host }, (err: Error | null, address: string) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
});