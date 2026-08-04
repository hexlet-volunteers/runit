import type { ConsoleLine } from '../../shared/runner';
export type OutputTab = 'console' | 'input' | 'preview';

export type ConsolePanelProps = {
  tab: OutputTab;
  onTabChange: (tab: OutputTab) => void;
  lines: ConsoleLine[];
  running: boolean;
  stdin: string;
  onStdinChange: (value: string) => void;
  onClear: () => void;
  /** Язык сниппета — определяет режим вывода (консоль или превью вёрстки). */
  language: string;
  /** Код для превью вёрстки (HTML/CSS). */
  code: string;
  /** Счётчик запусков: форсирует перерисовку превью. */
  runKey: number;
  /** Подпись среды исполнения в шапке консоли. */
  runtime: string;
};