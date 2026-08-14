import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { writeEditorPrefs } from '../../../shared/lib';
import EditorStatusBar from './EditorStatusBar';

/**
 * Статус-бар редактора.
 *
 * Две вещи, которые он раньше сообщал неверно:
 *  * подпись «Отступ: 2 пробела» была постоянной и прямо противоречила
 *    выключённой настройке «Tab вставляет пробелы»;
 *  * среда JavaScript называлась «Node.js 20 LTS», хотя код исполняется в
 *    браузере, в Web Worker: сниппет с require или process.argv не работал, и по
 *    подписи причина не угадывалась.
 */

const meta = { label: 'JavaScript', dot: '#f7df1e', runnable: true };

const renderBar = (compact = false) =>
  render(
    <MantineProvider>
      <EditorStatusBar
        meta={meta}
        language="javascript"
        cursor={{ line: 3, col: 7 }}
        compact={compact}
      />
    </MantineProvider>,
  );

beforeEach(() => {
  localStorage.clear();
});

describe('среда исполнения', () => {
  test('для JavaScript названа браузером, а не Node', () => {
    renderBar();

    expect(screen.getByText('Браузер (Web Worker)')).toBeInTheDocument();
    expect(screen.queryByText(/Node\.js/)).not.toBeInTheDocument();
  });
});

describe('подпись отступа', () => {
  test('следует настройке «пробелы»', () => {
    writeEditorPrefs({ tabSpaces: true });
    renderBar();
    expect(screen.getByText(/Отступ:\s*2 пробела/)).toBeInTheDocument();
  });

  test('следует настройке «табуляция»', () => {
    writeEditorPrefs({ tabSpaces: false });
    renderBar();
    expect(screen.getByText(/Отступ:\s*табуляция/)).toBeInTheDocument();
  });
});

describe('мобильная раскладка', () => {
  test('на узком экране остаются только язык и позиция курсора', () => {
    // На 375 px шесть подписей не помещаются в строку 28 px и расползаются,
    // ломая раскладку (#842).
    renderBar(true);

    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('3:7')).toBeInTheDocument();
    expect(screen.queryByText(/Отступ/)).not.toBeInTheDocument();
    expect(screen.queryByText('UTF-8')).not.toBeInTheDocument();
  });

  test('на широком экране видны все подписи', () => {
    renderBar(false);

    expect(screen.getByText('Строка 3, столбец 7')).toBeInTheDocument();
    expect(screen.getByText('UTF-8')).toBeInTheDocument();
  });
});
