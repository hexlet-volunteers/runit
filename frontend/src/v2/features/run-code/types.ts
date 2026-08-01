import type { ConsoleLine } from '../../shared/runner';
export type OutputTab = 'console' | 'input';

export type ConsolePanelProps = {
  tab: OutputTab;
  onTabChange: (tab: OutputTab) => void;
  lines: ConsoleLine[];
  running: boolean;
  stdin: string;
  onStdinChange: (value: string) => void;
  onClear: () => void;
};