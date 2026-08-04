import { type Availability } from './availability';
import { runProcess } from './process';
import type { RunnerLanguage, RunOutput } from './types';
export interface RunParams {
    language: RunnerLanguage;
    code: string;
    stdin?: string;
}
/** Внедряемые зависимости — чтобы тестировать все ветки без docker. */
export interface RunDeps {
    runProcess: typeof runProcess;
    checkDaemon: () => Promise<Availability>;
    checkImage: (language: string) => Promise<Availability>;
}
/** Уборка контейнеров, оставшихся после аварийного завершения сервера. */
export declare function sweepOrphans(): void;
export declare function runCode(params: RunParams, deps?: RunDeps): Promise<RunOutput>;
