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
];

const run = async (item) => {
  const response = await fetch(`${BASE}/trpc/runner.run`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ language: item.language, code: item.code, stdin: item.stdin ?? '' }),
  });
  const json = await response.json();
  if (json.error) throw new Error(`tRPC: ${JSON.stringify(json.error).slice(0, 200)}`);
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
        const ok = out.status === item.expectStatus;
        console.log(`${ok ? '✓' : '✗'} ${label}: status=${out.status} (ожидали ${item.expectStatus})`);
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
