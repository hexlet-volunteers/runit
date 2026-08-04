export type ConsoleLine = {
  type: 'log' | 'error' | 'warn' | 'info' | 'system';
  text: string;
};

export type RunResult = {
  lines: ConsoleLine[];
  exitCode: number;
  durationMs: number;
};
