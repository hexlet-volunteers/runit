/**
 * Матчеры jest-dom (toBeInTheDocument, toHaveAttribute и прочие) для проверки
 * типов тестов.
 *
 * Импорт-побочка: пакет расширяет типы vitest, и без этого файла tsc не знает
 * про матчеры, хотя в самих тестах они работают. Отдельный .d.ts, а не запись в
 * compilerOptions.types: список types отключает автоподключение остальных
 * @types, и вместе с матчерами пропали бы типы React.
 */
import '@testing-library/jest-dom/vitest';
