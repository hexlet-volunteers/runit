import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  embedCodeFor,
  embedPath,
  embedUrl,
  publicBaseUrl,
  snippetPath,
  snippetUrl,
} from './snippetLinks';

/**
 * Ссылки на сниппет — то, чем сервис делится с внешним миром, поэтому ошибка
 * здесь видна не нам, а чужому сайту, куда вставили нерабочий iframe.
 *
 * Проверяется ровно то, что уже ломалось:
 *  * шаблон ссылки был скопирован в четыре файла, и на роуте короткой ссылки все
 *    копии выдавали «/s//» — username и slug брались из URL, где их нет;
 *  * модалка «Поделиться» строила адрес из window.location.origin, поэтому
 *    скопированный со стейджинга или с localhost код не открывался на чужом
 *    сайте.
 */

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('publicBaseUrl', () => {
  test('берёт адрес из сборки, если он задан', () => {
    vi.stubEnv('VITE_PUBLIC_BASE_URL', 'https://runit.hexlet.ru/');
    // Хвостовой слэш убирается: иначе получалось «https://host//s/code».
    expect(publicBaseUrl()).toBe('https://runit.hexlet.ru');
  });

  test('без переменной — текущий origin', () => {
    vi.stubEnv('VITE_PUBLIC_BASE_URL', '');
    expect(publicBaseUrl()).toBe(window.location.origin);
  });
});

describe('пути просмотра и виджета', () => {
  test('короткий код — канонический путь', () => {
    const source = { shortCode: 'aB3xK9', username: 'user', slug: 'my-slug' };
    expect(snippetPath(source)).toBe('/s/aB3xK9');
    expect(embedPath(source)).toBe('/embed/s/aB3xK9');
  });

  test('без короткого кода работает старая пара username+slug', () => {
    const source = { username: 'user', slug: 'my-slug' };
    expect(snippetPath(source)).toBe('/s/user/my-slug');
    expect(embedPath(source)).toBe('/embed/user/my-slug');
  });

  test('authorUsername подходит так же, как username', () => {
    // getSnippetByShortCode отдаёт автора в поле authorUsername — на странице
    // короткой ссылки другого имени просто нет.
    expect(snippetPath({ authorUsername: 'author', slug: 'x' })).toBe(
      '/s/author/x',
    );
  });

  test('без данных возвращается пустая строка, а не «/s//»', () => {
    // Именно так и выглядела поломка: кнопка «Копировать» отдавала «/s//».
    expect(snippetPath({})).toBe('');
    expect(snippetPath({ username: 'user' })).toBe('');
    expect(snippetPath({ slug: 'x' })).toBe('');
    expect(embedPath({})).toBe('');
    expect(snippetUrl({})).toBe('');
    expect(embedUrl({})).toBe('');
  });
});

describe('абсолютные ссылки', () => {
  test('строятся от адреса сборки, а не от текущего окна', () => {
    vi.stubEnv('VITE_PUBLIC_BASE_URL', 'https://runit.hexlet.ru');
    expect(snippetUrl({ shortCode: 'aB3xK9' })).toBe(
      'https://runit.hexlet.ru/s/aB3xK9',
    );
    expect(embedUrl({ shortCode: 'aB3xK9' })).toBe(
      'https://runit.hexlet.ru/embed/s/aB3xK9',
    );
  });

  test('тема и высота уезжают параметрами виджета', () => {
    vi.stubEnv('VITE_PUBLIC_BASE_URL', 'https://runit.hexlet.ru');
    const url = embedUrl({ shortCode: 'aB3xK9' }, { theme: 'dark', height: 520 });
    expect(url).toBe(
      'https://runit.hexlet.ru/embed/s/aB3xK9?theme=dark&height=520',
    );
  });
});

describe('код для вставки', () => {
  test('готовый iframe с адресом виджета и высотой', () => {
    vi.stubEnv('VITE_PUBLIC_BASE_URL', 'https://runit.hexlet.ru');
    const code = embedCodeFor(
      { shortCode: 'aB3xK9' },
      { name: 'мой-сниппет', height: 280 },
    );

    expect(code).toContain(
      'src="https://runit.hexlet.ru/embed/s/aB3xK9?theme=dark&height=280"',
    );
    expect(code).toContain('height="280"');
    expect(code).toContain('title="Runit — мой-сниппет"');
  });

  test('кавычки в имени не разрывают атрибут title', () => {
    // Иначе имя вида «мой "лучший" сниппет» ломало бы разметку на чужой
    // странице — и виноват был бы наш код для вставки.
    const code = embedCodeFor(
      { shortCode: 'aB3xK9' },
      { name: 'мой "лучший" сниппет' },
    );
    expect(code).toContain('title="Runit — мой &quot;лучший&quot; сниппет"');
    expect(code.match(/"/g)?.length).toBeGreaterThan(0);
    expect(code).not.toContain('title="Runit — мой "лучший"');
  });

  test('без данных о сниппете кода нет — не выдаём заведомо битый iframe', () => {
    expect(embedCodeFor({}, { name: 'x' })).toBe('');
  });
});
