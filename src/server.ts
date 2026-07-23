import type { FastifyInstance } from 'fastify';
import getApp from './index';

const app: FastifyInstance = await getApp();

const port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const host: string = process.env.HOST || '0.0.0.0';

app.listen({ port, host }, (err: Error | null, _address: string) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
});
