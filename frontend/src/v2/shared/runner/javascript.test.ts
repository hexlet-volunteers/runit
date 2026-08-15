import { describe, expect, test } from 'vitest';
import { SANDBOX_SOURCE, createSandbox } from './javascript';

/**
 * Песочница исполнения JavaScript.
 *
 * Тесты закрепляют границу, отсутствие которой было настоящей дырой: код
 * сниппета выполнялся в Web Worker на origin приложения, то есть запросы из него
 * уходили с cookie сессии. Проверено экспериментом до исправления: сниппет читал
 * `auth.me` (почта владельца), получал `auth.csrfToken` и делал мутации от его
 * имени — например, публиковал приватный сниппет. Срабатывало это на самом
 * обычном действии: открыть чужой сниппет по ссылке и нажать «Выполнить».
 *
 * Здесь проверяется не поведение браузера (его в jsdom нет), а те свойства
 * разметки песочницы, от которых зависит изоляция. Их легко потерять при
 * невнимательной правке, и потеря будет не видна: код продолжит работать.
 */

describe('атрибуты iframe', () => {
  test('sandbox без allow-same-origin — иначе origin общий с приложением', () => {
    const frame = createSandbox();

    const sandbox = frame.getAttribute('sandbox') ?? '';
    expect(sandbox).toContain('allow-scripts');
    expect(sandbox).not.toContain('allow-same-origin');
    // Ни навигации, ни всплывающих окон, ни форм: сниппет не должен уводить
    // пользователя со страницы и открывать вкладки.
    expect(sandbox).not.toContain('allow-top-navigation');
    expect(sandbox).not.toContain('allow-popups');
    expect(sandbox).not.toContain('allow-forms');
    expect(sandbox).not.toContain('allow-modals');

    frame.remove();
  });

  test('песочница скрыта и не мешает раскладке', () => {
    const frame = createSandbox();

    expect(frame.style.display).toBe('none');
    expect(frame.getAttribute('aria-hidden')).toBe('true');

    frame.remove();
  });

  test('документ песочницы приходит из srcdoc, а не по сети', () => {
    const frame = createSandbox();

    expect(frame.getAttribute('src')).toBeNull();
    expect(frame.srcdoc).toContain('Content-Security-Policy');

    frame.remove();
  });
});

describe('политика безопасности песочницы', () => {
  const csp =
    SANDBOX_SOURCE.match(/content="([^"]+)"/)?.[1] ?? '(политика не найдена)';

  test('сеть закрыта полностью', () => {
    // Ровно та же граница, что у серверных языков (--network=none): из кода
    // нельзя ни утащить данные наружу, ни постучаться в наш API.
    expect(csp).toContain("connect-src 'none'");
    expect(csp).toContain("default-src 'none'");
  });

  test('скрипты разрешены только те, что нужны для запуска кода', () => {
    expect(csp).toContain('script-src');
    expect(csp).toContain('blob:');
    // Никаких внешних источников скриптов: подгрузить чужую библиотеку и
    // выполнить её в песочнице нельзя.
    expect(csp).not.toContain('https:');
    expect(csp).not.toContain('*');
  });

  test('воркер создаётся из blob — это и есть отдельный поток', () => {
    expect(csp).toContain('worker-src blob:');
    expect(SANDBOX_SOURCE).toContain('new Worker(');
  });

  test('песочница принимает сообщения только от вставившей её страницы', () => {
    expect(SANDBOX_SOURCE).toContain('event.source !== parent');
  });
});
