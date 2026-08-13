import postgres from 'postgres';
import * as schema from './schema/schema';
export declare const db: import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema> & {
    $client: postgres.Sql<{}>;
};
export declare const runMigrations: () => Promise<void>;
/** Явное закрытие — нужно тестам, чтобы процесс не держал соединения. */
export declare const closeDbConnection: () => Promise<void>;
