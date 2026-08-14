import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import useCreateSnippet from './useCreateSnippet';

/**
 * Создание сниппета из модалки.
 *
 * Проверяется то, из-за чего выбор пользователя молча терялся: видимость,
 * выбранная тумблером, не уходила в мутацию, и сниппет всегда создавался
 * приватным. Человек выбирал «Публичный», а сниппет не появлялся в профиле — и
 * заметить это можно было только сравнив выбор с результатом.
 *
 * Заодно зафиксирован тумблер «Начать с примера кода»: с ним уезжает пример для
 * языка, без него — пустая строка (пустой код сервер принимает).
 */

/**
 * Заглушки создаются через vi.hoisted: vi.mock поднимается выше импортов, и
 * обычные const к моменту вызова фабрики ещё не инициализированы.
 */
const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  show: vi.fn(),
  createSnippet: vi.fn(),
  generateSnippetName: vi.fn(),
}));

vi.mock('react-router', () => ({ useNavigate: () => mocks.navigate }));
vi.mock('@mantine/notifications', () => ({
  notifications: { show: mocks.show },
}));
vi.mock('../../../entities/user', () => ({
  useSession: () => ({ user: { id: 1, username: 'user' }, isGuest: false }),
}));
vi.mock('../../../shared/api', () => ({ useTRPCClient: () => ({}) }));
vi.mock('../../../entities/snippet', async () => {
  const actual =
    await vi.importActual<typeof import('../../../entities/snippet')>(
      '../../../entities/snippet',
    );
  return {
    ...actual,
    SNIPPETS_QUERY_KEY: ['snippets'],
    sampleCode: { javascript: 'console.log("пример");', python: 'print(1)' },
    generateSnippetName: mocks.generateSnippetName,
    createSnippet: (_client: unknown, params: unknown) =>
      mocks.createSnippet(params),
  };
});

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: { mutations: { retry: false } },
      }),
    },
    children,
  );

const setup = () =>
  renderHook(() => useCreateSnippet({ opened: true, onClose: () => {} }), {
    wrapper,
  });

/** Модалка при открытии сама запрашивает имя — ждём, пока оно появится. */
const ready = async (result: { current: { name: string } }) => {
  await waitFor(() => expect(result.current.name).toBe('сгенерированное'));
};

beforeEach(() => {
  mocks.navigate.mockReset();
  mocks.show.mockReset();
  mocks.createSnippet.mockReset().mockResolvedValue({ id: 42, slug: 'sl' });
  mocks.generateSnippetName
    .mockReset()
    .mockResolvedValue({ name: 'сгенерированное' });
});

describe('создание сниппета', () => {
  test('выбранная видимость уходит на сервер', async () => {
    const { result } = setup();
    await ready(result);

    act(() => result.current.setVisibility('public'));
    await waitFor(() => expect(result.current.visibility).toBe('public'));

    act(() => result.current.createMutation.mutate());

    await waitFor(() =>
      expect(mocks.createSnippet).toHaveBeenCalledWith(
        expect.objectContaining({ visibility: 'public' }),
      ),
    );
  });

  test('по умолчанию — «по ссылке», как в модалке', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.visibility).toBe('link'));

    act(() => result.current.createMutation.mutate());

    await waitFor(() =>
      expect(mocks.createSnippet).toHaveBeenCalledWith(
        expect.objectContaining({ visibility: 'link' }),
      ),
    );
  });

  test('тумблер примера решает, уедет ли стартовый код', async () => {
    const { result } = setup();
    await ready(result);

    act(() => result.current.createMutation.mutate());
    await waitFor(() =>
      expect(mocks.createSnippet).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'console.log("пример");' }),
      ),
    );

    mocks.createSnippet.mockClear();
    act(() => result.current.setWithExample(false));
    await waitFor(() => expect(result.current.withExample).toBe(false));

    act(() => result.current.createMutation.mutate());
    await waitFor(() =>
      expect(mocks.createSnippet).toHaveBeenCalledWith(
        expect.objectContaining({ code: '' }),
      ),
    );
  });

  test('имя отправляется без пробелов по краям', async () => {
    const { result } = setup();
    await ready(result);

    act(() => result.current.setName('   моя-задача   '));
    await waitFor(() => expect(result.current.name).toBe('   моя-задача   '));

    act(() => result.current.createMutation.mutate());
    await waitFor(() =>
      expect(mocks.createSnippet).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'моя-задача' }),
      ),
    );
  });

  test('после создания открывается редактор нового сниппета', async () => {
    const { result } = setup();
    await ready(result);

    act(() => result.current.createMutation.mutate());

    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith('/editor/42'),
    );
  });

  test('ошибка создания объясняется пользователю', async () => {
    mocks.createSnippet.mockRejectedValue(new Error('сервер отказал'));
    const { result } = setup();
    await ready(result);

    act(() => result.current.createMutation.mutate());

    await waitFor(() =>
      expect(mocks.show).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'red' }),
      ),
    );
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
