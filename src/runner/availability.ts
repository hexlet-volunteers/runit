import { dockerEnv, imageTagFor, runnerConfig } from './config';
import { runProcess } from './process';

export type Availability =
  | { ok: true }
  | {
      ok: false;
      reason: 'no_cli' | 'no_daemon' | 'no_image' | 'disabled';
      message: string;
    };

const PROBE_TIMEOUT_MS = 3000;
const OK_TTL_MS = 60_000;
// Короткий отрицательный кэш: поднятый Docker Desktop подхватится без рестарта сервера.
const FAIL_TTL_MS = 5000;

type CacheEntry = { value: Availability; expiresAt: number };
const cache = new Map<string, CacheEntry>();

const cached = (key: string): Availability | null => {
  const hit = cache.get(key);
  if (!hit || hit.expiresAt < Date.now()) return null;
  return hit.value;
};

const remember = (key: string, value: Availability): Availability => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + (value.ok ? OK_TTL_MS : FAIL_TTL_MS),
  });
  return value;
};

/** Сырой stderr docker наружу не отдаём — в нём хостовые пути и путь к сокету. */
const logProbe = (what: string, stderr: string) => {
  if (stderr.trim()) console.error(`[runner] ${what}: ${stderr.trim()}`);
};

/**
 * Сообщение о недоступности — по адресату.
 *
 * Сниппеты встраиваются в чужие страницы: «Выполнить» в виджете нажимает
 * читатель урока или статьи, который про наш сервер ничего не знает. Ему
 * доставались инструкции для администратора — «Запустите Docker и повторите
 * попытку», «Выполните: npm run runner:build-images». Совет, который читатель
 * не может выполнить, выглядит как поломка сайта, на котором он читает.
 *
 * Поэтому в production наружу идёт нейтральный текст, а точную причину видит
 * тот, кому она адресована — она остаётся в логах (logProbe выше и вызывающий
 * код). В разработке остаются подсказки: там сообщение читает разработчик.
 */
const audienceMessage = (developerHint: string): string =>
  process.env.NODE_ENV === 'production'
    ? 'Серверное исполнение сейчас недоступно. Попробуйте позже.'
    : developerHint;

export async function checkDaemon(): Promise<Availability> {
  if (!runnerConfig.enabled) {
    return {
      ok: false,
      reason: 'disabled',
      // Название переменной окружения читателю встроенного виджета не поможет.
      message: audienceMessage(
        'Серверное исполнение отключено (RUNNER_ENABLED=false).',
      ),
    };
  }

  const hit = cached('daemon');
  if (hit) return hit;

  const result = await runProcess({
    bin: runnerConfig.dockerBin,
    args: ['version', '--format', '{{.Server.Version}}'],
    input: '',
    timeoutMs: PROBE_TIMEOUT_MS,
    maxOutputBytes: 4096,
    env: dockerEnv(),
  });

  if (result.spawnErrorCode === 'ENOENT') {
    return remember('daemon', {
      ok: false,
      reason: 'no_cli',
      message: audienceMessage(
        'Docker не установлен на сервере — серверное исполнение недоступно.',
      ),
    });
  }

  if (result.exitCode !== 0) {
    logProbe('docker version', result.stderr);
    return remember('daemon', {
      ok: false,
      reason: 'no_daemon',
      message: audienceMessage(
        'Docker-демон не запущен. Запустите Docker и повторите попытку.',
      ),
    });
  }

  return remember('daemon', { ok: true });
}

/**
 * Отличает «образа нет» от «демон не ответил».
 *
 * `docker image inspect` возвращает ненулевой код в обоих случаях, и раньше оба
 * объяснялись одинаково — «Образ не собран, выполните runner:build-images».
 * Совет бывал прямо вредным: во время обновления Docker Desktop демон
 * отказывался отвечать на inspect по имени, притом что образ был на месте и
 * `docker run` с ним работал. Человеку предлагалось пересобирать девять
 * образов, хотя нужно было подождать полминуты.
 *
 * Разбираем по тексту ошибки самого docker — другого признака у CLI нет.
 */
export const looksLikeDaemonProblem = (stderr: string): boolean =>
  /cannot connect to the docker daemon|is the docker daemon running|daemon is not running|connection refused|context deadline exceeded|EOF/i.test(
    stderr,
  );

export async function checkImage(language: string): Promise<Availability> {
  const tag = imageTagFor(language);
  const hit = cached(`image:${tag}`);
  if (hit) return hit;

  // Намеренно без `docker pull`: в обработчике запроса мы никогда не тянем из сети.
  const result = await runProcess({
    bin: runnerConfig.dockerBin,
    args: ['image', 'inspect', tag],
    input: '',
    timeoutMs: PROBE_TIMEOUT_MS,
    maxOutputBytes: 8192,
    env: dockerEnv(),
  });

  if (result.exitCode !== 0 || result.spawnErrorCode) {
    logProbe(`docker image inspect ${tag}`, result.stderr);

    if (result.spawnErrorCode || looksLikeDaemonProblem(result.stderr)) {
      /**
       * Сбой демона, а не отсутствие образа. Не запоминаем это как приговор
       * образу: отрицательный кэш живёт секунды, поэтому после возвращения
       * демона язык заработает сам, без перезапуска приложения.
       */
      return {
        ok: false,
        reason: 'no_daemon',
        message: audienceMessage(
          'Docker сейчас не отвечает (перезапуск или обновление). Повторите через полминуты.',
        ),
      };
    }

    return remember(`image:${tag}`, {
      ok: false,
      reason: 'no_image',
      message: audienceMessage(
        `Образ ${tag} не собран. Выполните: npm run runner:build-images`,
      ),
    });
  }

  return remember(`image:${tag}`, { ok: true });
}
