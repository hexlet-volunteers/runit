import { dockerEnv, imageTagFor, runnerConfig } from './config';
import { type ProcessResult, runProcess } from './process';
import type { RunnerLanguage } from './types';

/**
 * Доставка образов раннера на хост, где они исполняются.
 *
 * Зачем это нужно отдельно от сборки. Раннер намеренно никогда не тянет образы
 * в обработчике запроса (см. availability.ts): запуск сниппета не должен
 * зависеть от сети и превращаться в многоминутное ожидание. Значит образы
 * обязаны появиться на хосте заранее. Локально это делает
 * `npm run runner:build-images`, а в проде их собирать нечем и незачем — там
 * берутся опубликованные в реестре.
 *
 * Пока этого шага не было, релизный процесс имел дыру: образы приложения и
 * фронтенда публиковались, а девять образов раннера — нет и никем не
 * доставлялись. На новом стенде python/php/ruby/java/go/cpp/sql/bash отвечали
 * «недоступно» при полностью зелёном деплое, то есть из двенадцати языков
 * работали три (JavaScript в браузере и разметка в превью).
 *
 * Здесь одна операция: «сделать так, чтобы нужные образы были на месте» —
 * проверить наличие и скачать отсутствующие. Вызывается при старте приложения
 * в фоне и вручную из CLI (src/runner/pullImages.ts).
 */

const INSPECT_TIMEOUT_MS = 5000;
/** Скачивание большого образа (java, go) на медленной сети — минуты, не секунды. */
const PULL_TIMEOUT_MS = 10 * 60 * 1000;

export interface ImageDeps {
  runProcess: typeof runProcess;
}

const defaultDeps: ImageDeps = { runProcess };

export type ImageState = 'present' | 'pulled' | 'failed' | 'local_missing';

export interface ImageReport {
  language: RunnerLanguage;
  tag: string;
  state: ImageState;
  /** Причина, если образа нет. Для лога, не для пользователя. */
  detail?: string;
}

/**
 * Ссылка указывает на реестр, откуда образ можно скачать.
 *
 * Локальное имя вида `runit-runner-python:1` docker попытался бы тянуть из
 * Docker Hub и ответил бы «pull access denied» — сообщение, из которого не
 * следует настоящая причина. Такой образ собирают локально, а не скачивают,
 * поэтому его отсутствие — отдельное состояние с внятным объяснением.
 *
 * Признак реестра тот же, что у самого docker: в первом сегменте имени есть
 * точка или двоеточие (ghcr.io/..., registry:5000/...).
 */
export function isRemoteImage(tag: string): boolean {
  const firstSegment = tag.split('/')[0];
  return (
    tag.includes('/') &&
    (firstSegment.includes('.') ||
      firstSegment.includes(':') ||
      firstSegment === 'localhost')
  );
}

const exists = async (
  tag: string,
  deps: ImageDeps,
): Promise<ProcessResult> =>
  deps.runProcess({
    bin: runnerConfig.dockerBin,
    args: ['image', 'inspect', tag],
    input: '',
    timeoutMs: INSPECT_TIMEOUT_MS,
    maxOutputBytes: 8192,
    env: dockerEnv(),
  });

const pull = async (tag: string, deps: ImageDeps): Promise<ProcessResult> =>
  deps.runProcess({
    bin: runnerConfig.dockerBin,
    args: ['pull', tag],
    input: '',
    timeoutMs: PULL_TIMEOUT_MS,
    // Прогресс docker не нужен, важен только итог.
    maxOutputBytes: 64 * 1024,
    env: dockerEnv(),
  });

/**
 * Проверяет наличие образов включённых языков и скачивает отсутствующие.
 *
 * Не бросает исключений: недоступный демон или сбой сети не должны мешать
 * приложению работать — языки, чьи образы не появились, просто ответят
 * «недоступно», как и раньше.
 */
export async function ensureImages(
  languages: readonly RunnerLanguage[] = runnerConfig
    .enabledLanguages as readonly RunnerLanguage[],
  deps: ImageDeps = defaultDeps,
): Promise<ImageReport[]> {
  const reports: ImageReport[] = [];

  for (const language of languages) {
    const tag = imageTagFor(language);

    const inspect = await exists(tag, deps);
    if (inspect.exitCode === 0) {
      reports.push({ language, tag, state: 'present' });
      continue;
    }

    if (!isRemoteImage(tag)) {
      reports.push({
        language,
        tag,
        state: 'local_missing',
        detail:
          'локальный образ не собран — выполните npm run runner:build-images',
      });
      continue;
    }

    const pulled = await pull(tag, deps);
    if (pulled.exitCode === 0) {
      reports.push({ language, tag, state: 'pulled' });
      continue;
    }

    reports.push({
      language,
      tag,
      state: 'failed',
      detail: (pulled.stderr || pulled.stdout).trim().slice(0, 300),
    });
  }

  return reports;
}

/**
 * Фоновая подготовка образов при старте приложения.
 *
 * Отдельная функция, а не вызов ensureImages напрямую: старт сервера ждать
 * скачивания не должен (на чистом хосте это минуты), а результат обязан попасть
 * в лог — иначе «языки не работают» пришлось бы выяснять по одному запросу.
 */
export function prefetchImages(
  log: (message: string) => void = (message) => console.log(message),
): void {
  void ensureImages()
    .then((reports) => {
      const pulled = reports.filter((r) => r.state === 'pulled');
      const missing = reports.filter(
        (r) => r.state === 'failed' || r.state === 'local_missing',
      );

      if (pulled.length > 0) {
        log(`[runner] образы скачаны: ${pulled.map((r) => r.tag).join(', ')}`);
      }
      for (const report of missing) {
        log(
          `[runner] образ ${report.tag} недоступен (${report.language}): ${report.detail ?? 'неизвестная причина'}`,
        );
      }
      if (missing.length === 0 && pulled.length === 0) {
        log(`[runner] образы на месте: ${reports.length}`);
      }
    })
    .catch((error: unknown) => {
      log(
        `[runner] подготовка образов не удалась: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
}
