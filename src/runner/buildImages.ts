import { spawn } from 'node:child_process';
import path from 'node:path';
import { checkDaemon } from './availability';
import { dockerEnv, imageTagFor, runnerConfig } from './config';
import { LANGUAGE_SPECS } from './languages';
import { RUNNER_LANGUAGES, type RunnerLanguage } from './types';

// CLI сборки образов раннера: npm run runner:build-images [язык ...]
// Теги берутся из того же источника, что и у раннера (config/languages),
// поэтому рассинхрон «собрали не тот тег» невозможен.

const IMAGES_ROOT = path.join(process.cwd(), 'runner-images');

const build = (language: RunnerLanguage): Promise<boolean> =>
  new Promise((resolve) => {
    const spec = LANGUAGE_SPECS[language];
    const tag = imageTagFor(language);
    const dir = path.join(IMAGES_ROOT, spec.imageDir);
    console.log(`\n=== ${language}: docker build -t ${tag} ${dir} ===`);
    const child = spawn(runnerConfig.dockerBin, ['build', '-t', tag, dir], {
      env: dockerEnv(),
      stdio: 'inherit',
    });
    child.on('error', (err) => {
      console.error(`[runner] не удалось запустить docker: ${err.message}`);
      resolve(false);
    });
    child.on('close', (code) => resolve(code === 0));
  });

const main = async () => {
  const requested = process.argv
    .slice(2)
    .filter((arg): arg is RunnerLanguage =>
      (RUNNER_LANGUAGES as readonly string[]).includes(arg),
    );
  const languages = requested.length > 0 ? requested : [...RUNNER_LANGUAGES];

  const daemon = await checkDaemon();
  if (!daemon.ok) {
    console.error(`\n${daemon.message}\n`);
    process.exit(1);
  }

  const results: Array<[string, boolean]> = [];
  for (const language of languages) {
    results.push([imageTagFor(language), await build(language)]);
  }

  console.log('\n=== Итог ===');
  for (const [tag, ok] of results) {
    console.log(`${ok ? '✓' : '✗'} ${tag}`);
  }

  if (results.some(([, ok]) => !ok)) process.exit(1);
};

main();
