import { checkDaemon } from './availability';
import { imageTagFor, runnerConfig } from './config';
import { ensureImages } from './images';
import { RUNNER_LANGUAGES, type RunnerLanguage } from './types';

// CLI доставки образов раннера: npm run runner:pull-images [язык ...]
//
// Нужен там, где образы не собирают, а берут из реестра — на боевом
// runner-хосте. Теги считаются из той же конфигурации, что использует раннер
// (RUNNER_IMAGE_PREFIX и RUNNER_IMAGE_TAG), поэтому «скачали не тот тег»
// невозможно: раннер и этот скрипт всегда говорят об одном и том же образе.
//
// Приложение делает то же самое само при старте (prefetchImages), но в фоне и
// молча-в-лог. Этот скрипт нужен, когда результат хочется увидеть сразу:
// подготовка нового хоста, проверка после смены версии, разбор жалобы
// «язык отвечает недоступно».

const main = async () => {
  const requested = process.argv
    .slice(2)
    .filter((arg): arg is RunnerLanguage =>
      (RUNNER_LANGUAGES as readonly string[]).includes(arg),
    );
  const languages =
    requested.length > 0
      ? requested
      : (runnerConfig.enabledLanguages as RunnerLanguage[]);

  if (languages.length === 0) {
    console.error(
      'Ни один язык не включён (RUNNER_LANGUAGES) — скачивать нечего.',
    );
    process.exit(1);
  }

  const daemon = await checkDaemon();
  if (!daemon.ok) {
    console.error(`\n${daemon.message}\n`);
    process.exit(1);
  }

  console.log(
    `Хост: ${process.env.DOCKER_HOST ?? 'локальный демон'}\n` +
      `Образы: ${languages.map(imageTagFor).join(', ')}\n`,
  );

  const reports = await ensureImages(languages);

  console.log('\n=== Итог ===');
  for (const report of reports) {
    const mark =
      report.state === 'present' || report.state === 'pulled' ? '✓' : '✗';
    const state = {
      present: 'уже на хосте',
      pulled: 'скачан',
      failed: 'не скачался',
      local_missing: 'локальный образ не собран',
    }[report.state];
    console.log(
      `${mark} ${report.tag} — ${state}${report.detail ? `: ${report.detail}` : ''}`,
    );
  }

  if (reports.some((r) => r.state === 'failed' || r.state === 'local_missing')) {
    process.exit(1);
  }
};

main();
