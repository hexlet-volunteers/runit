#!/usr/bin/env node
// Smoke-проверка серверного раннера: по одному сниппету на каждый язык.
//
// Запускается в CI, где есть Docker (локально у разработчика демон может быть
// выключен — тогда раннер отвечает подсказкой, и проверять нечего).
// Использование: node bin/runner-smoke.mjs [базовый-URL]

const BASE = process.argv[2] ?? 'http://localhost:3001';

const CASES = [
  { language: 'python', code: "print('ok-python')", expect: 'ok-python' },
  { language: 'php', code: "echo 'ok-php';", expect: 'ok-php' },
  // Тег в верхнем регистре и смешанный с разметкой код: раньше сервис дописывал
  // второй `<?php` и выводил его текстом или ломал разметку parse error.
  {
    language: 'php',
    code: "<?PHP echo 'ok-php-upper';",
    expect: 'ok-php-upper',
    label: 'php: тег в верхнем регистре',
  },
  {
    language: 'php',
    code: "<h1>html</h1>\n<?php echo 'ok-php-mixed'; ?>",
    expect: 'ok-php-mixed',
    label: 'php: разметка вместе с кодом',
  },
  { language: 'ruby', code: "puts 'ok-ruby'", expect: 'ok-ruby' },
  { language: 'bash', code: "echo ok-bash", expect: 'ok-bash' },
  { language: 'typescript', code: "const s: string = 'ok-ts';\nconsole.log(s);", expect: 'ok-ts' },
  { language: 'go', code: 'package main\nimport "fmt"\nfunc main() { fmt.Println("ok-go") }', expect: 'ok-go' },
  {
    language: 'cpp',
    code: '#include <iostream>\nint main() { std::cout << "ok-cpp" << std::endl; }',
    expect: 'ok-cpp',
  },
  { language: 'sql', code: "select 'ok-sql' as result;", expect: 'ok-sql' },
  {
    language: 'java',
    code: 'class Main { public static void main(String[] a) { System.out.println("ok-java"); } }',
    expect: 'ok-java',
  },
  // Проверяем не только happy path: ввод и защита от бесконечного цикла.
  { language: 'python', code: 'print(input().upper())', stdin: 'stdin-works', expect: 'STDIN-WORKS', label: 'python + stdin' },
  { language: 'python', code: 'while True: pass', expectStatus: 'timeout', label: 'python таймаут' },
  {
    language: 'python',
    code: "import socket\ntry:\n    socket.create_connection(('1.1.1.1', 80), 3)\n    print('СЕТЬ ДОСТУПНА')\nexcept Exception as e:\n    print('сеть недоступна')",
    expect: 'сеть недоступна',
    label: 'изоляция сети',
  },
  // Fork-бомба — самая дешёвая атака на хост. Гасится --pids-limit: процессы
  // перестают создаваться, скрипт доходит до конца и печатает предел. Проверка
  // именно фактическая: на аргументах docker это подтвердить нельзя, а без
  // лимита хост уходит в отказ вместе со всеми остальными запусками.
  {
    language: 'python',
    code: [
      'import os',
      'created = 0',
      'try:',
      '    for _ in range(10000):',
      '        if os.fork() == 0:',
      '            os._exit(0)',
      '        created += 1',
      'except OSError:',
      "    print('fork остановлен лимитом')",
      'else:',
      "    print('ЛИМИТА НЕТ, создано', created)",
    ].join('\n'),
    expect: 'fork остановлен лимитом',
    label: 'fork-бомба гасится pids-limit',
  },
  // Лимит вывода: программа печатает заметно больше разрешённого, ответ обязан
  // прийти обрезанным, а не завалить сервер и браузер многомегабайтной строкой.
  {
    language: 'python',
    code: "print('x' * 5_000_000)",
    expectStatus: ['ok', 'output_limit'],
    expectTruncated: true,
    label: 'вывод обрезается по лимиту',
  },
];

const run = async (item) => {
  const response = await fetch(`${BASE}/trpc/runner.run`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ language: item.language, code: item.code, stdin: item.stdin ?? '' }),
  });
  const json = await response.json();

  // Проверяем HTTP-код до разбора тела. Иначе отказ вроде 429 (тело лимитера
  // не содержит поля error) выглядел как «Cannot read properties of undefined»
  // и приходилось гадать, что случилось.
  if (!response.ok) {
    const hint =
      response.status === 429
        ? ' — сработал лимит запусков; поднимите RATE_LIMIT_RUNNER для прогона'
        : '';
    throw new Error(
      `HTTP ${response.status}${hint}: ${JSON.stringify(json).slice(0, 160)}`,
    );
  }
  if (json.error) throw new Error(`tRPC: ${JSON.stringify(json.error).slice(0, 200)}`);
  if (!json.result?.data) {
    throw new Error(`неожиданный ответ: ${JSON.stringify(json).slice(0, 160)}`);
  }
  return json.result.data;
};

const main = async () => {
  let failed = 0;

  for (const item of CASES) {
    const label = item.label ?? item.language;
    try {
      const out = await run(item);
      const output = `${out.stdout ?? ''}${out.stderr ?? ''}`;

      if (item.expectStatus) {
        // Допускаем несколько статусов: обрезка вывода приходит либо как ok с
        // флагом truncated, либо как output_limit — зависит от того, успел ли
        // процесс завершиться сам.
        const allowed = Array.isArray(item.expectStatus)
          ? item.expectStatus
          : [item.expectStatus];
        let ok = allowed.includes(out.status);
        let extra = '';
        if (ok && item.expectTruncated) {
          const truncated = out.truncated === true || out.status === 'output_limit';
          const size = (out.stdout ?? '').length;
          ok = truncated;
          extra = ` truncated=${out.truncated} размер вывода=${size}`;
        }
        console.log(
          `${ok ? '✓' : '✗'} ${label}: status=${out.status}${extra} (ожидали ${allowed.join('|')})`,
        );
        if (!ok) failed += 1;
        continue;
      }

      const ok = out.status === 'ok' && output.includes(item.expect);
      console.log(
        `${ok ? '✓' : '✗'} ${label}: status=${out.status} exit=${out.exitCode} ` +
          `${out.durationMs}ms ${ok ? '' : `вывод: ${output.slice(0, 160).replace(/\n/g, ' | ')}`}`,
      );
      if (!ok) failed += 1;
    } catch (error) {
      console.log(`✗ ${label}: ${error.message}`);
      failed += 1;
    }
  }

  console.log(`\nИтого: ${CASES.length - failed} из ${CASES.length}`);
  if (failed > 0) process.exit(1);
};

main();
