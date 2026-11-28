import { Box, Center, Group, Loader, Text } from '@mantine/core';
import type { Snippet } from '../../../entities/snippet';
import { editorColors } from '../../../shared/theme';
import { snippetFileName, snippetPath } from '../../../shared/lib';
import { useEmbedSnippet } from '../model/useEmbedSnippet';
import EmbedHeader from './EmbedHeader';
import EmbedEditor from './EmbedEditor';
import EmbedOutput from './EmbedOutput';

// Компактный embed-виджет (без AppHeader/AppFooter — страница живёт внутри iframe).
// TODO(#841): варианты оформления card/minimal/tabs (query-параметр variant).
export default function EmbedSnippet() {
  const {
    shortCode,
    username,
    slug,
    isDark,
    widgetHeight,
    showOutput,
    readOnly,
    snippet,
    isLoading,
    isError,
    result,
    running,
    runKey,
    code,
    setCode,
    run,
  } = useEmbedSnippet();

  const colors = isDark
    ? editorColors
    : {
        bg: '#ffffff',
        panel: '#f8f9fa',
        border: '#dee2e6',
        text: '#212529',
        dim: '#868e96',
        accent: '#228be6',
        error: '#e03131',
        ok: '#2f9e44',
      };

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="sm" />
      </Center>
    );
  }

  if (isError || !snippet) {
    return (
      <Center h="100vh">
        <Text c="dimmed" fz="sm">
          Сниппет не найден
        </Text>
      </Center>
    );
  }

  const currentSnippet = snippet as Snippet;

  const fileName = snippetFileName(
    currentSnippet.name,
    currentSnippet.language,
  );

  // Как и на странице шаринга: на роуте короткой ссылки username и slug пусты,
  // поэтому путь строится из данных сниппета, а параметры адреса — запасной вариант.
  const shareHref = snippetPath({
    shortCode: shortCode ?? currentSnippet.shortCode,
    authorUsername: currentSnippet.authorUsername ?? username,
    slug: currentSnippet.slug ?? slug,
  });

  const runSnippet = () => {
    void run(currentSnippet);
  };

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: widgetHeight ?? '100vh',
        maxHeight: '100vh',
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        background: colors.panel,
      }}
    >
      <EmbedHeader
        snippet={currentSnippet}
        colors={colors}
        fileName={fileName}
        shareHref={shareHref}
        running={running}
        onRun={runSnippet}
      />

      <EmbedEditor
        code={code}
        language={currentSnippet.language}
        isDark={isDark}
        readOnly={readOnly}
        accentColor={colors.accent}
        onChange={setCode}
      />

      <EmbedOutput
        snippet={currentSnippet}
        code={code}
        showOutput={showOutput}
        runKey={runKey}
        result={result}
        colors={colors}
      />

      <Group
        gap={6}
        px="md"
        py={6}
        style={{
          borderTop: `1px solid ${colors.border}`,
          flexShrink: 0,
        }}
      >
        <Text c="blue.6" fz="xs" aria-hidden>
          ⚡
        </Text>

        <Text fz="xs" c={colors.dim}>
          Работает на Runit
        </Text>
      </Group>
    </Box>
  );
}
