import { z } from 'zod/v4';
import { runCode } from './run';
export { runCode, sweepOrphans } from './run';
export type { RunnerLanguage, RunOutput, RunStatus } from './types';
export declare const runInputSchema: z.ZodObject<{
    language: z.ZodEnum<{
        python: "python";
        php: "php";
        ruby: "ruby";
        java: "java";
    }>;
    code: z.ZodString;
    stdin: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type RunInput = z.infer<typeof runInputSchema>;
export interface RunnerStatus {
    /** Языки, исполняемые на сервере (JavaScript исполняется в браузере). */
    languages: string[];
    available: boolean;
    message: string | null;
}
export declare function runnerStatus(): Promise<RunnerStatus>;
export { runCode as runnerRun, runInputSchema as runnerRunInputSchema };
