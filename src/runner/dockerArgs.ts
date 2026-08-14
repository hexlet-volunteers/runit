import type { LanguageSpec } from './languages';
import type { RunLimits } from './types';

export interface DockerArgsParams {
  spec: LanguageSpec;
  limits: RunLimits;
  /** Имя контейнера — по нему гарантированно убираем его при таймауте. */
  containerName: string;
  imageTag: string;
  /** Имя файла внутри /app. */
  fileName: string;
  /** Путь к seccomp-профилю на хосте. Не задан — работает профиль docker. */
  seccompProfile?: string;
}

/**
 * Сборка argv для `docker run`. Единственное место, где живёт модель изоляции
 * песочницы (#860) — поэтому функция чистая и покрыта юнит-тестами: любое
 * ослабление флагов ломает тест.
 *
 * Как код попадает в контейнер: первой строкой stdin, в base64. Внутри
 * контейнера крошечный пролог на sh раскодирует её в файл в /tmp и запускает
 * язык, а всё, что идёт в stdin дальше, достаётся уже самой программе.
 *
 * Почему не монтирование каталога, как было раньше. Путь в `-v host:/app`
 * разбирает демон, а не тот, кто вызывает CLI. Пока код монтировался, запуск
 * работал ровно в одном случае: приложение и демон видят одну файловую систему.
 * В прод-схемах это неверно — приложение в контейнере (его /tmp демону не виден)
 * или демон на отдельном runner-хосте (нашей файловой системы у него нет
 * вовсе). Проявлялось не ошибкой запуска, а пустым монтом: контейнер
 * поднимался, а интерпретатор отвечал «can't open file '/app/main.py'».
 *
 * Почему не `docker cp` в созданный контейнер: демон отказывается копировать в
 * контейнер с read-only rootfs («container rootfs is marked read-only»), а
 * снимать этот флаг ради доставки файла нельзя — он часть песочницы.
 *
 * Никогда не добавлять: --privileged, -v /var/run/docker.sock, --cap-add,
 * --security-opt seccomp=unconfined, --pid=host, --net=host.
 */
/** Безопасное одинарное кавычивание для встраивания argv в строку sh -c. */
const shQuote = (arg: string): string => `'${arg.replaceAll("'", `'\\''`)}'`;

/**
 * Пролог внутри контейнера: раскодировать первую строку stdin в файл и запустить
 * язык.
 *
 * `IFS= read -r` читает ровно одну строку и не трогает обратные слэши, а
 * base64 — одна строка без переводов, поэтому дальше в stdin остаётся ровно то,
 * что пользователь ввёл во вкладке «Ввод». `exec` заменяет оболочку процессом
 * языка: не остаётся лишнего процесса, и сигналы доходят напрямую.
 */
export function bootstrap(containerPath: string, spec: LanguageSpec): string {
  const command = spec.command(containerPath).map(shQuote).join(' ');
  return (
    `IFS= read -r __runit_src; printf %s "$__runit_src" | base64 -d > ${containerPath}; ` +
    `exec ${command}`
  );
}

export function buildDockerArgs(params: DockerArgsParams): string[] {
  const { spec, limits, containerName, imageTag, fileName, seccompProfile } =
    params;
  /**
   * Код лежит в /tmp, а не в /app: /tmp — единственная writable точка при
   * read-only rootfs, а файл создаётся уже внутри контейнера.
   */
  const containerPath = `/tmp/${fileName}`;
  // Вторая линия обороны: если наш watchdog умрёт (например, рестарт сервера
  // ровно во время запуска), процесс всё равно будет убит ядром по CPU-секундам.
  const cpuSeconds = Math.ceil(limits.timeoutMs / 1000) + 2;
  // noexec на /tmp — эшелон обороны, а не граница безопасности: границу держат
  // отсутствие сети, cap-drop=ALL, no-new-privileges, read-only rootfs и
  // непривилегированный пользователь. Для компилируемых языков исполнение
  // собранного файла и есть смысл запуска, поэтому им noexec не ставим.
  const tmpfs = spec.tmpfs ?? { size: '16m' };
  // Важно: docker ставит noexec на --tmpfs по умолчанию, поэтому мало убрать
  // опцию — нужно перекрыть её явным exec, иначе собранный бинарник не
  // запускается («permission denied» уже после успешной компиляции).
  const tmpfsOptions = [
    'rw',
    tmpfs.allowExec ? 'exec' : 'noexec',
    'nosuid',
    'nodev',
    `size=${tmpfs.size}`,
  ].join(',');

  const args = [
    'run',
    '--rm',
    // stdin: первой строкой едет код, остальное — ввод самой программы.
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
    // Профиль seccomp (#860). Без переменной работает штатный профиль docker —
    // это уже аллоулист примерно на 300 сисколлов, который блокирует mount,
    // ptrace, bpf, keyctl и прочее опасное.
    //
    // Важно понимать: --security-opt seccomp=<файл> ЗАМЕНЯЕТ дефолтный профиль,
    // а не дополняет его. Поэтому «денилист» из пары опасных вызовов был бы
    // ослаблением: default-allow снял бы защиту всего остального. Свой профиль
    // имеет смысл только как полный аллоулист, выверенный под все языки, —
    // отдельная работа, её ставим сюда через переменную, не выдумывая профиль
    // задним числом.
    ...(seccompProfile ? [`--security-opt=seccomp=${seccompProfile}`] : []),
    '--user',
    '10001:10001',
    '--read-only',
    // Единственная writable точка (нужна JVM и tempfile): в RAM, без права
    // исполнения записанного, с ограничением размера.
    '--tmpfs',
    `/tmp:${tmpfsOptions}`,
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
    `fsize=${limits.maxFileBytes}`,
    '--ulimit',
    `cpu=${cpuSeconds}`,
    // Иначе демон параллельно пишет весь вывод контейнера на диск хоста.
    '--log-driver=none',
    // Рабочий каталог — writable /tmp: сниппет, который создаёт файл рядом с
    // собой (обычное дело в задачах на файлы), при /app получал бы отказ,
    // потому что rootfs только для чтения.
    '--workdir',
    '/tmp',
  ];

  for (const [key, value] of Object.entries({
    HOME: '/tmp',
    ...(spec.env ?? {}),
  })) {
    args.push('--env', `${key}=${value}`);
  }

  args.push(imageTag, 'sh', '-c', bootstrap(containerPath, spec));

  return args;
}
