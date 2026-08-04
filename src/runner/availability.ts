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

export async function checkDaemon(): Promise<Availability> {
  if (!runnerConfig.enabled) {
    return {
      ok: false,
      reason: 'disabled',
      message: 'Серверное исполнение отключено (RUNNER_ENABLED=false).',
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
      message:
        'Docker не установлен на сервере — серверное исполнение недоступно.',
    });
  }

  if (result.exitCode !== 0) {
    logProbe('docker version', result.stderr);
    return remember('daemon', {
      ok: false,
      reason: 'no_daemon',
      message: 'Docker-демон не запущен. Запустите Docker и повторите попытку.',
    });
  }

  return remember('daemon', { ok: true });
}

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

  if (result.exitCode !== 0) {
    logProbe(`docker image inspect ${tag}`, result.stderr);
    return remember(`image:${tag}`, {
      ok: false,
      reason: 'no_image',
      message: `Образ ${tag} не собран. Выполните: npm run runner:build-images`,
    });
  }

  return remember(`image:${tag}`, { ok: true });
}
