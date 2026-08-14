/**
 * Общая подготовка окружения тестов фронтенда.
 *
 * jsdom не реализует часть браузерных API, на которые опирается Mantine и наш
 * код. Без заглушек падали бы не проверки, а сам рендер компонентов — и это
 * выглядело бы как «тесты не работают», хотя дело в окружении.
 */
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// matchMedia нужен useMediaQuery (мобильная раскладка редактора).
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

// ResizeObserver требуется компонентам Mantine (Select, SegmentedControl).
if (!('ResizeObserver' in window)) {
  (window as unknown as Record<string, unknown>).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// scrollIntoView вызывается Mantine при работе с фокусом.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});
