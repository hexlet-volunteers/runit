import { useState } from 'react';
import { Box, Button, Group, Paper, Text } from '@mantine/core';
import { editorColors, langMeta } from '../../../shared/theme/tokens';
import { runJavaScript, type RunResult } from '../../../shared/runner';

/** Палитра подсветки синтаксиса (tokyo-night). */
const HL = {
  comment: '#565f89',
  keyword: '#bb9af7',
  string: '#9ece6a',
  number: '#ff9e64',
  method: '#4dabf7',
};

/** Экранирует HTML-спецсимволы для безопасной вставки в разметку. */
const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Лёгкая regex-подсветка JavaScript для демо-виджета. */
function highlightJS(src: string): string {
const re =
  /(\/\/[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(const|let|var|function|return|if|else|for|while|of|in|new|class|true|false|null|undefined)\b|\b(\d+(?:\.\d+)?)\b|\b(forEach|log|map|filter|reduce|push|pop|shift|unshift)\b/g;
  let out = '';
  let last = 0;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    out += escapeHtml(src.slice(last, m.index));
    const [full, comment, str, kw, num, method] = m;
    const color = comment ? HL.comment : str ? HL.string : kw ? HL.keyword : num ? HL.number : method ? HL.method : HL.number;
    out += `<span style="color:${color}">${escapeHtml(full)}</span>`;
    last = m.index + full.length;
  }
  return out + escapeHtml(src.slice(last));
}

/** Стили для моноширинного отображения кода. */
const CODE_FONT: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: 14,
  lineHeight: 1.7,
  padding: '4px 8px',
  margin: 0,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
};

/** Начальный код для демо-виджета. */
const INITIAL_CODE = `// Попробуйте — код выполняется по-настоящему
const languages = ['JavaScript', 'Python', 'PHP', 'Ruby'];

languages.forEach((lang, i) => {
  console.log((i + 1) + '. ' + lang);
});

console.log('…и ещё 6 языков из коробки');`;

/** Возвращает цвет для строки консоли в зависимости от её типа. */
function lineColor(type: string): string {
  switch (type) {
    case 'error':
      return editorColors.error;
    case 'warn':
      return '#f2c94c';
    case 'system':
      return editorColors.dim;
    default:
      return editorColors.text;
  }
}

/** Живой мини-редактор для лендинга с выполнением JavaScript. */
export default function DemoWidget() {
  const [code, setCode] = useState(INITIAL_CODE);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

  /** Запускает выполнение кода и сохраняет результат. */
  const handleRun = async () => {
    setRunning(true);
    try {
      const res = await runJavaScript(code);
      setResult(res);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Box>
      <Paper
        radius="lg"
        style={{
          overflow: 'hidden',
          border: `1px solid ${editorColors.border}`,
          boxShadow: '0 20px 60px rgba(26, 27, 38, 0.25)',
        }}
      >
        {/* Шапка карточки: имя файла, язык, кнопка запуска */}
        <Group
          justify="space-between"
          px="md"
          py={10}
          style={{ background: '#fff', borderBottom: '1px solid #e9ecef' }}
        >
          <Group gap={8}>
            <Text ff="monospace" fz="sm" fw={600} c="dark.9">
              demo.js
            </Text>
            <Box
              w={8}
              h={8}
              style={{ borderRadius: '50%', background: langMeta.javascript.dot }}
            />
            <Text fz="sm" c="dimmed">
              {langMeta.javascript.label}
            </Text>
          </Group>
          <Button
            size="xs"
            radius="md"
            loading={running}
            onClick={handleRun}
            leftSection={
              <svg width={10} height={10} viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            }
          >
            Запустить
          </Button>
        </Group>

        {/* Тёмная область кода: подсвеченный <pre> под прозрачной textarea */}
        <Box p="sm" style={{ background: editorColors.bg }}>
          <div style={{ position: 'relative' }}>
            <pre
              aria-hidden
              style={{ ...CODE_FONT, color: editorColors.text, minHeight: '11em' }}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: `${highlightJS(code)}\n` }}
            />
            <textarea
              value={code}
              onChange={(e) => setCode(e.currentTarget.value)}
              aria-label="Код demo.js"
              spellCheck={false}
              style={{
                ...CODE_FONT,
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                resize: 'none',
                color: 'transparent',
                caretColor: editorColors.text,
                overflow: 'hidden',
              }}
            />
          </div>
        </Box>

        {/* Блок результата */}
        {result && (
          <Box
            px="md"
            py="sm"
            style={{
              background: editorColors.panel,
              borderTop: `1px solid ${editorColors.border}`,
            }}
          >
            <Group justify="space-between" mb={6}>
              <Text
                fz={11}
                fw={700}
                c={editorColors.dim}
                style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}
              >
                Результат
              </Text>
              <Text fz={11} c={result.exitCode === 0 ? editorColors.ok : editorColors.error}>
                {result.exitCode === 0 ? 'выполнено' : 'ошибка'} ·{' '}
                {Math.round(result.durationMs)} мс
              </Text>
            </Group>
            {result.lines.length === 0 ? (
              <Text ff="monospace" fz={13} c={editorColors.dim}>
                (нет вывода)
              </Text>
            ) : (
              result.lines.map((line, i) => (
                <Text
                  key={i}
                  ff="monospace"
                  fz={13}
                  style={{
                    color: lineColor(line.type),
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: 1.6,
                  }}
                >
                  {line.text}
                </Text>
              ))
            )}
          </Box>
        )}
      </Paper>

      <Text ta="center" c="dimmed" fz="sm" mt="sm">
        Это живой виджет — измените код и нажмите «Запустить»
      </Text>
    </Box>
  );
}
