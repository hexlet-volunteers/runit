import { MantineProvider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Snippet } from '../../../entities/snippet';
import SnippetCard from './SnippetCard';

/**
 * Карточка сниппета в дашборде.
 *
 * Главное, что проверяется, — кнопка «Копировать ссылку» у приватного сниппета.
 * Раньше она молча сообщала «Ссылка скопирована»: у приватного сниппета ссылка
 * есть, но у всех, кроме владельца, она открывается как «не найдено». Человек
 * отправлял её коллеге и узнавал о проблеме от него.
 */

const snippetOf = (over: Partial<Snippet> = {}): Snippet =>
  ({
    id: 1,
    name: 'моя-задача',
    slug: 'my-slug',
    code: 'print(1)',
    language: 'python',
    userId: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    shortCode: 'aB3xK9',
    visibility: 'public',
    ...over,
  }) as Snippet;

const renderCard = (snippet: Snippet) =>
  render(
    <MantineProvider>
      <MemoryRouter>
        <SnippetCard
          snippet={snippet}
          username="user"
          selected={false}
          onToggleSelect={() => {}}
          onDelete={() => {}}
        />
      </MemoryRouter>
    </MantineProvider>,
  );

/** Открывает меню карточки и жмёт «Копировать ссылку». */
const copyLink = async () => {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  await user.click(screen.getByLabelText('Действия со сниппетом'));
  await user.click(await screen.findByText('Копировать ссылку'));
};

/**
 * Буфер обмена подменяет сам user-event: его setup() ставит свою реализацию
 * navigator.clipboard. Поэтому проверяем не вызов метода, а то, что в буфере
 * действительно оказалось — это и есть наблюдаемое поведение.
 */
beforeEach(() => {
  vi.spyOn(notifications, 'show').mockImplementation(() => '');
});

describe('карточка', () => {
  test('показывает имя, язык и ведёт в редактор', () => {
    renderCard(snippetOf());

    const link = screen.getByRole('link', { name: 'моя-задача' });
    expect(link).toHaveAttribute('href', '/editor/1');
    expect(screen.getByText('Python')).toBeInTheDocument();
  });
});

describe('копирование ссылки', () => {
  test('публичный сниппет: ссылка копируется без оговорок', async () => {
    renderCard(snippetOf({ visibility: 'public' }));

    await copyLink();

    expect(await navigator.clipboard.readText()).toContain('/s/aB3xK9');
    const message = vi.mocked(notifications.show).mock.calls[0][0]
      .message as string;
    expect(message).toBe('Ссылка скопирована');
  });

  test('приватный сниппет: предупреждение, что ссылка откроется только у автора', async () => {
    renderCard(snippetOf({ visibility: 'private' }));

    await copyLink();

    // Ссылка всё равно копируется — человек мог хотеть открыть её сам.
    expect(await navigator.clipboard.readText()).toContain('/s/aB3xK9');

    const call = vi.mocked(notifications.show).mock.calls[0][0];
    expect(call.color).toBe('yellow');
    expect(call.message as string).toMatch(/приватн/i);
    // И подсказка, что делать: сменить видимость.
    expect(call.message as string).toMatch(/видимост/i);
  });
});
