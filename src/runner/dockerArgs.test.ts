import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runnerConfig } from './config';
import { buildDockerArgs } from './dockerArgs';
import { LANGUAGE_SPECS, specFor } from './languages';
import type { RunLimits, RunnerLanguage } from './types';

const limits: RunLimits = {
  timeoutMs: 10_000,
  memory: '256m',
  cpus: '1',
  pidsLimit: 64,
  maxOutputBytes: 65_536,
};

const argsFor = (language: RunnerLanguage) =>
  buildDockerArgs({
    spec: specFor(language),
    limits: { ...limits, ...specFor(language).limits },
    containerName: 'runit-run-test',
    hostCodeDir: '/tmp/runit-runner-abc',
    imageTag: `runit-runner-${language}:1`,
    fileName: specFor(language).fileName('class Main {}'),
  });

const pairValue = (args: string[], flag: string): string | undefined => {
  const idx = args.indexOf(flag);
  return idx === -1 ? undefined : args[idx + 1];
};

test('песочница: все флаги изоляции на месте', () => {
  const args = argsFor('python');
  for (const flag of [
    '--network=none',
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges',
    '--read-only',
    '--log-driver=none',
    '--rm',
  ]) {
    assert.ok(args.includes(flag), `отсутствует ${flag}`);
  }
  assert.equal(pairValue(args, '--user'), '10001:10001');
  assert.equal(pairValue(args, '--pids-limit'), '64');
  assert.match(
    pairValue(args, '--tmpfs') ?? '',
    /^\/tmp:rw,noexec,nosuid,nodev,size=/,
  );
});

test('песочница: опасные флаги отсутствуют', () => {
  const joined = argsFor('python').join(' ');
  for (const forbidden of [
    '--privileged',
    'docker.sock',
    'seccomp=unconfined',
    '--cap-add',
    '--pid=host',
    '--net=host',
  ]) {
    assert.ok(
      !joined.includes(forbidden),
      `найден запрещённый флаг ${forbidden}`,
    );
  }
});

test('лимит памяти не обходится свопом: --memory-swap равен --memory', () => {
  const args = argsFor('python');
  assert.equal(pairValue(args, '--memory'), '256m');
  assert.equal(pairValue(args, '--memory-swap'), pairValue(args, '--memory'));
});

test('код монтируется только для чтения', () => {
  const mount = pairValue(argsFor('python'), '-v');
  assert.equal(mount, '/tmp/runit-runner-abc:/app:ro');
});

test('ulimit cpu страхует wall-clock таймаут', () => {
  const args = argsFor('python');
  const cpuLimit = args.filter((a) => a.startsWith('cpu='))[0];
  assert.equal(cpuLimit, 'cpu=12'); // ceil(10000/1000) + 2
});

test('java получает увеличенные лимиты', () => {
  const args = argsFor('java');
  assert.equal(pairValue(args, '--memory'), '512m');
  assert.equal(pairValue(args, '--pids-limit'), '256');
});

test('команды и имена файлов по языкам', () => {
  assert.deepEqual(specFor('python').command('/app/main.py'), [
    'python',
    '-u',
    '/app/main.py',
  ]);
  assert.deepEqual(specFor('ruby').command('/app/main.rb'), [
    'ruby',
    '/app/main.rb',
  ]);
  assert.deepEqual(specFor('php').command('/app/main.php'), [
    'php',
    '-f',
    '/app/main.php',
  ]);
  assert.deepEqual(specFor('java').command('/app/Main.java'), [
    'java',
    '-XX:-UsePerfData',
    '/app/Main.java',
  ]);
});

test('php: тег дописывается только при отсутствии и не сдвигает строки', () => {
  const prepare = LANGUAGE_SPECS.php.prepare!;
  assert.equal(prepare("echo 'Hello';"), "<?php echo 'Hello';");
  assert.equal(prepare("<?php echo 'Hi';"), "<?php echo 'Hi';");
  assert.equal(prepare('<?= 1 ?>'), '<?= 1 ?>');
  // нумерация строк сохранена: первая строка осталась первой
  assert.equal(prepare('echo 1;\necho 2;').split('\n').length, 2);
});

test('java: имя файла берётся из имени класса', () => {
  const fileName = LANGUAGE_SPECS.java.fileName;
  assert.equal(fileName('public class Solution { }'), 'Solution.java');
  assert.equal(fileName('class Foo {}'), 'Foo.java');
  assert.equal(fileName('// нет класса'), 'Main.java');
});

test('env приложения не протекает в контейнер: передаётся только allowlist', () => {
  const args = argsFor('python');
  const envValues = args.filter((_, i) => args[i - 1] === '--env');
  assert.ok(envValues.includes('HOME=/tmp'));
  assert.ok(envValues.includes('PYTHONDONTWRITEBYTECODE=1'));
  assert.ok(!envValues.some((v) => /JWT|SECRET|DB_PATH/i.test(v)));
});

test('имя контейнера и лейбл заданы (нужны для уборки орфанов)', () => {
  const args = argsFor('python');
  assert.equal(pairValue(args, '--name'), 'runit-run-test');
  assert.equal(pairValue(args, '--label'), 'runit-runner=1');
});

test('конфиг по умолчанию: серверные языки, без JS/HTML/CSS', () => {
  // JavaScript исполняется в браузере, HTML/CSS показываются как превью —
  // на сервер они не идут.
  for (const browserOnly of ['javascript', 'html', 'css']) {
    assert.ok(
      !runnerConfig.enabledLanguages.includes(browserOnly as never),
      `${browserOnly} не должен исполняться на сервере`,
    );
  }
  assert.deepEqual(runnerConfig.enabledLanguages, [
    'python',
    'php',
    'ruby',
    'java',
    'typescript',
    'go',
    'cpp',
    'sql',
    'bash',
  ]);
});

test('новые языки: команды и файлы', () => {
  assert.deepEqual(specFor('typescript').command('/app/main.ts'), [
    'node',
    '/app/main.ts',
  ]);
  assert.deepEqual(specFor('go').command('/app/main.go'), [
    'go',
    'run',
    '/app/main.go',
  ]);
  assert.deepEqual(specFor('bash').command('/app/main.sh'), [
    'bash',
    '/app/main.sh',
  ]);
  assert.equal(specFor('cpp').fileName(''), 'main.cpp');
  assert.equal(specFor('sql').fileName(''), 'main.sql');
});

test('seccomp: без переменной профиль docker, с переменной — заданный файл', () => {
  // Без RUNNER_SECCOMP_PROFILE флага быть не должно: свой файл заменяет
  // дефолтный профиль docker целиком, поэтому пустое значение обязано означать
  // «работает штатный аллоулист», а не «seccomp выключен».
  const withoutProfile = argsFor('python');
  assert.ok(
    !withoutProfile.some((arg) => arg.includes('seccomp')),
    'без переменной флаг seccomp не добавляется',
  );
  assert.ok(
    !withoutProfile.includes('--security-opt=seccomp=unconfined'),
    'seccomp никогда не отключается',
  );

  const withProfile = buildDockerArgs({
    spec: specFor('python'),
    limits,
    containerName: 'runit-run-test',
    hostCodeDir: '/tmp/runit-runner-abc',
    imageTag: 'runit-runner-python:1',
    fileName: 'main.py',
    seccompProfile: '/etc/runit/seccomp.json',
  });
  assert.ok(
    withProfile.includes('--security-opt=seccomp=/etc/runit/seccomp.json'),
    'заданный профиль передаётся docker',
  );
});

test('/tmp: скриптовым языкам noexec, компилируемым — место и exec', () => {
  // CI-прогон в Docker показал ровно две поломки компилируемых языков:
  // go упирался в 16 МБ («no space left on device»), а собранный /tmp/app в cpp
  // не запускался из-за noexec. Тест фиксирует обе настройки и то, что
  // послабление касается только этих языков.
  const tmpfsOf = (lang: Parameters<typeof specFor>[0]) =>
    pairValue(
      buildDockerArgs({
        spec: specFor(lang),
        limits: { ...limits, ...specFor(lang).limits },
        containerName: 'runit-run-test',
        hostCodeDir: '/tmp/runit-runner-abc',
        imageTag: `runit-runner-${lang}:1`,
        fileName: specFor(lang).fileName('class Main {}'),
      }),
      '--tmpfs',
    ) ?? '';

  for (const lang of [
    'python',
    'ruby',
    'php',
    'java',
    'bash',
    'sql',
  ] as const) {
    assert.match(tmpfsOf(lang), /noexec/, `${lang}: noexec обязателен`);
  }
  for (const lang of ['go', 'cpp'] as const) {
    const value = tmpfsOf(lang);
    assert.doesNotMatch(
      value,
      /noexec/,
      `${lang}: бинарник должен исполняться`,
    );
    // Остальные защитные опции при этом сохраняются.
    assert.match(value, /nosuid/);
    assert.match(value, /nodev/);
  }
  assert.match(tmpfsOf('go'), /size=320m/);
});

test('компилируемые языки пишут артефакты только в /tmp', () => {
  // rootfs монтируется read-only, поэтому вывод компилятора обязан идти в tmpfs.
  const cppCmd = specFor('cpp').command('/app/main.cpp').join(' ');
  assert.match(cppCmd, /-o \/tmp\//);
  const goEnv = specFor('go').env ?? {};
  assert.match(goEnv.GOCACHE ?? '', /^\/tmp\//);
  assert.match(goEnv.GOPATH ?? '', /^\/tmp\//);
});

test('изоляция сохраняется для всех серверных языков', () => {
  for (const lang of runnerConfig.enabledLanguages) {
    const args = buildDockerArgs({
      spec: specFor(lang),
      limits: { ...limits, ...specFor(lang).limits },
      containerName: 'runit-run-test',
      hostCodeDir: '/tmp/runit-runner-abc',
      imageTag: `runit-runner-${lang}:1`,
      fileName: specFor(lang).fileName('class Main {}'),
    });
    assert.ok(args.includes('--network=none'), `${lang}: нет --network=none`);
    assert.ok(args.includes('--cap-drop=ALL'), `${lang}: нет --cap-drop`);
    assert.ok(args.includes('--read-only'), `${lang}: нет --read-only`);
    assert.equal(
      pairValue(args, '--user'),
      '10001:10001',
      `${lang}: не non-root`,
    );
    assert.ok(
      (pairValue(args, '-v') ?? '').endsWith(':ro'),
      `${lang}: код смонтирован не read-only`,
    );
  }
});
