import { useEffect, useRef } from 'react';

/**
 * Ctrl/Cmd+S — сохранить сниппет сейчас.
 *
 * Сохранение в редакторе автоматическое, но привычка жать Ctrl+S сильнее любой
 * подписи в интерфейсе. Без перехвата браузер открывает на это сочетание диалог
 * «сохранить страницу»: человек получал окно сохранения HTML вместо своего
 * сниппета и делал вывод, что сохранения нет вовсе.
 *
 * Внутри редактора кода нажатие перехватывает своя команда Monaco (она не
 * доходит до window), поэтому здесь важны остальные места: поле имени, консоль,
 * вкладка «Ввод».
 */
export default function useSaveHotkey(onSave: () => void): void {
  // Ref, чтобы обработчик не переподписывался на каждый рендер редактора.
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') {
        return;
      }
      // Иначе браузер предложит сохранить страницу.
      event.preventDefault();
      onSaveRef.current();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
