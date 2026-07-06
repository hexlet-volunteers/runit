import { useState } from 'react';
import { Box, Button, Group, Paper, Text, Textarea } from '@mantine/core';
import { editorColors, langMeta } from '../../theme';
import { runJavaScript, RunResult } from '../../runner';

const INITIAL_CODE = `// Попробуйте — код выполняется по-настоящему
const languages = ['JavaScript', 'Python', 'PHP', 'Ruby'];

languages.forEach((lang, i) => {
  console.log((i + 1) + '. ' + lang);
});

console.log('…и ещё 6 языков из коробки');`;

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

// Живой мини-редактор demo.js для лендинга.
// TODO(#843): заменить Textarea на полноценный CodeMirror с подсветкой синтаксиса,
// как в основном редакторе.
export default function DemoWidget() {
  const [code, setCode] = useState(INITIAL_CODE);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

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

        {/* Тёмная область кода */}
        <Box p="sm" style={{ background: editorColors.bg }}>
          <Textarea
            value={code}
            onChange={(e) => setCode(e.currentTarget.value)}
            autosize
            minRows={8}
            maxRows={16}
            aria-label="Код demo.js"
            styles={{
              input: {
                background: 'transparent',
                border: 'none',
                color: editorColors.text,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: 14,
                lineHeight: 1.7,
                padding: '4px 8px',
              },
            }}
          />
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
