import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, test, vi } from 'vitest';
import HtmlPreview from './HtmlPreview';

/**
 * Превью вёрстки.
 *
 * Здесь две вещи, каждая из которых уже ломалась:
 *  * документ пересобирался на каждое нажатие клавиши, и браузер перезагружал
 *    iframe посимвольно: превью мигало, скрипты сниппета перезапускались,
 *    прокрутка сбрасывалась;
 *  * пользовательская разметка обязана жить только в sandbox-iframe без
 *    allow-same-origin — иначе чужой скрипт получает доступ к нашим cookie и DOM.
 */

const frame = () => screen.getByTitle('Превью вёрстки') as HTMLIFrameElement;

describe('песочница', () => {
  test('разметка рендерится в sandbox-iframe без доступа к нашему origin', () => {
    render(<HtmlPreview language="html" code="<h1>привет</h1>" />);

    const iframe = frame();
    expect(iframe.getAttribute('sandbox')).toBe('allow-scripts');
    // allow-same-origin вместе с allow-scripts снимает изоляцию полностью.
    expect(iframe.getAttribute('sandbox')).not.toContain('allow-same-origin');
    expect(iframe.getAttribute('referrerPolicy')).toBe('no-referrer');
    expect(iframe.srcdoc).toContain('привет');
  });
});

describe('обновление', () => {
  test('набор текста не перезагружает iframe на каждый символ', () => {
    vi.useFakeTimers();
    const { rerender } = render(<HtmlPreview language="html" code="<p>1</p>" />);
    const before = frame().srcdoc;

    rerender(<HtmlPreview language="html" code="<p>12</p>" />);
    rerender(<HtmlPreview language="html" code="<p>123</p>" />);

    // Пауза ещё не истекла — документ прежний, перезагрузки не было.
    expect(frame().srcdoc).toBe(before);

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(frame().srcdoc).toContain('<p>123</p>');
    vi.useRealTimers();
  });

  test('«Выполнить» обновляет превью сразу, без паузы', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <HtmlPreview language="html" code="<p>старое</p>" runKey={0} />,
    );

    // Нажатие кнопки меняет runKey — это явное действие, ждать нельзя.
    rerender(<HtmlPreview language="html" code="<p>новое</p>" runKey={1} />);

    expect(frame().srcdoc).toContain('новое');
    vi.useRealTimers();
  });
});
