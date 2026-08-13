/**
 * Создаёт чистую базу и возвращает строку подключения к ней.
 * Вызывать ДО импорта модулей, которые открывают соединение.
 */
export declare function createTestDatabase(name: string): Promise<string>;
export declare function dropTestDatabase(name: string): Promise<void>;
