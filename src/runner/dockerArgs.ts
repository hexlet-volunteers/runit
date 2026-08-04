import type { LanguageSpec } from './languages';
import type { RunLimits } from './types';

export interface DockerArgsParams {
  spec: LanguageSpec;
  limits: RunLimits;
  /** Имя контейнера — по нему гарантированно убираем его при таймауте. */
  containerName: string;
  /** Каталог на хосте с файлом кода (монтируется только для чтения). */
  hostCodeDir: string;
  imageTag: string;
  /** Имя файла внутри /app. */
  fileName: string;
}

/**
 * Сборка argv для `docker run`. Единственное место, где живёт модель изоляции
 * песочницы (#860) — поэтому функция чистая и покрыта юнит-тестами: любое
 * ослабление флагов ломает тест.
 *
 * Никогда не добавлять: --privileged, -v /var/run/docker.sock, --cap-add,
 * --security-opt seccomp=unconfined, --pid=host, --net=host.
 */
export function buildDockerArgs(params: DockerArgsParams): string[] {
  const { spec, limits, containerName, hostCodeDir, imageTag, fileName } =
    params;
  const containerPath = `/app/${fileName}`;
  // Вторая линия обороны: если наш watchdog умрёт (например, рестарт сервера
  // ровно во время запуска), процесс всё равно будет убит ядром по CPU-секундам.
  const cpuSeconds = Math.ceil(limits.timeoutMs / 1000) + 2;

  const args = [
    'run',
    '--rm',
    '-i',
    '--name',
    containerName,
    // Лейбл нужен подметальщику орфанов после аварийного завершения сервера.
    '--label',
    'runit-runner=1',
    // Главный флаг: без сети чужой код не эксфильтрует данные, не сканирует
    // внутреннюю сеть, не ходит за облачными креденшелами и не майнит.
    '--network=none',
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges',
    '--user',
    '10001:10001',
    '--read-only',
    // Единственная writable точка (нужна JVM и tempfile): в RAM, без права
    // исполнения записанного, с ограничением размера.
    '--tmpfs',
    '/tmp:rw,noexec,nosuid,nodev,size=16m',
    '--memory',
    limits.memory,
    // Равный --memory-swap выключает своп: иначе лимит памяти обходится, и
    // контейнер начинает свопить, убивая I/O хоста.
    '--memory-swap',
    limits.memory,
    '--cpus',
    limits.cpus,
    // Защита от fork-бомбы — самой дешёвой DoS-атаки на хост.
    '--pids-limit',
    String(limits.pidsLimit),
    '--ulimit',
    'nofile=256:256',
    '--ulimit',
    'fsize=8388608',
    '--ulimit',
    `cpu=${cpuSeconds}`,
    // Иначе демон параллельно пишет весь вывод контейнера на диск хоста.
    '--log-driver=none',
    '--workdir',
    '/app',
  ];

  for (const [key, value] of Object.entries({
    HOME: '/tmp',
    ...(spec.env ?? {}),
  })) {
    args.push('--env', `${key}=${value}`);
  }

  // :ro — код не может править собственный исходник или использовать монт как хранилище.
  args.push(
    '-v',
    `${hostCodeDir}:/app:ro`,
    imageTag,
    ...spec.command(containerPath),
  );

  return args;
}
