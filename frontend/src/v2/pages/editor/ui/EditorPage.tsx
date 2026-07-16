import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Box, Button, Center, Loader, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';

import { useTRPCClient } from '../../../shared/api';
import { editorColors, langMeta } from '../../../shared/theme';
import { useSession } from '../../../entities/user';

import { ConsolePanel } from '../../../features/run-code';
import { ShareModal } from '../../../features/share-snippet';
import AddPackageModal from './AddPackageModal';

import {
  FILE_NAME_BY_LANGUAGE,
  STARTER_CODE,
  SAVE_STATUS_META,
} from '../lib/constants';
import EditorHeader from './EditorHeader';
import EditorSidebar from './EditorSidebar';
import EditorStatusBar from './EditorStatusBar';
import { useRunner } from '../../../features/run-code';
import { useSnippetById, generateSnippetName } from '../../../entities/snippet';
import { useSnippetSave } from '../model';
import { useUserById } from '../../../entities/user';

// Экран редактора Runit v2 (docs/design/editor.png).
// TODO(#821, #609): серверное исполнение — сейчас JS выполняется в Web Worker,
// остальные языки отвечают заглушкой unsupportedLanguage.

/** Страница редактора сниппетов с Monaco Editor, консолью и сохранением. */
export default function EditorPage() {
  const { id } = useParams();
  const snippetId = id ? Number(id) : null;
  const trpc = useTRPCClient();
  const { user } = useSession();

  const [name, setName] = useState('');
  const [code, setCode] = useState(STARTER_CODE);
  const [language, setLanguage] = useState('javascript');
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [shareOpened, setShareOpened] = useState(false);
  const [packageOpened, setPackageOpened] = useState(false);

  // Рефы для стабильных колбэков (saveNow использует их через useSnippetSave).
  const nameRef = useRef(name);
  const codeRef = useRef(code);
  const languageRef = useRef(language);
  nameRef.current = name;
  codeRef.current = code;
  languageRef.current = language;

  const {
    running,
    lines,
    stdin,
    runRef,
    setStdin,
    tab,
    setTab,
    handleRun,
    clearLines,
  } = useRunner(code, language);
  const {
    saveNow,
    markDirty,
    saveStatus,
    setSaveStatus,
    slug,
    setSlug,
    snippetIdRef,
  } = useSnippetSave(snippetId, nameRef, codeRef, languageRef);

  const initializedFor = useRef<string>('');

  // --- Данные -------------------------------------------------------------
  /** Загрузка сниппета по ID (только для существующих). */
  const snippetQuery = useQuery({
    queryKey: ['v2-editor-snippet', snippetId],
    queryFn: () => useSnippetById(trpc, snippetId as number),
    enabled: snippetId != null,
    retry: false,
  });

  /** Загрузка владельца сниппета для подписи в ShareModal. */
  const ownerQuery = useQuery({
    queryKey: ['v2-editor-owner', snippetQuery.data?.userId],
    queryFn: () => useUserById(trpc, snippetQuery.data!.userId),
    enabled: snippetQuery.data?.userId != null,
  });

  /** Генерация имени для нового черновика (только для новых сниппетов). */
  const draftNameQuery = useQuery({
    queryKey: ['v2-editor-draft-name'],
    queryFn: () => generateSnippetName(trpc),
    enabled: snippetId == null,
    staleTime: Infinity,
  });

  /** Инициализация стейта редактора при загрузке существующего сниппета. */
  useEffect(() => {
    if (
      snippetId != null &&
      snippetQuery.data &&
      initializedFor.current !== `id:${snippetId}`
    ) {
      initializedFor.current = `id:${snippetId}`;
      setName(snippetQuery.data.name);
      setCode(snippetQuery.data.code);
      setLanguage(snippetQuery.data.language ?? 'javascript');
      setSlug(snippetQuery.data.slug);
      setSaveStatus('saved');
    }
  }, [snippetId, snippetQuery.data]);

  /** Установка имени из сгенерированного draft-имени для нового сниппета. */
  useEffect(() => {
    if (
      snippetId == null &&
      draftNameQuery.data &&
      initializedFor.current === ''
    ) {
      initializedFor.current = 'draft';
      setName(draftNameQuery.data.name);
    }
  }, [snippetId, draftNameQuery.data]);

  /** Обработчик монтирования Monaco Editor: отслеживание позиции курсора и хоткей Ctrl+Enter. */
  const handleEditorMount: OnMount = (editor, monaco) => {
    editor.onDidChangeCursorPosition((e) => {
      setCursor({ line: e.position.lineNumber, col: e.position.column });
    });
    // eslint-disable-next-line no-bitwise
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      void runRef.current();
    });
  };

  // --- Ранние состояния ---------------------------------------------------
  if (snippetId != null && snippetQuery.isLoading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  if (snippetId != null && snippetQuery.isError) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="sm">
          <Text fw={700} fz="lg">
            Сниппет не найден
          </Text>
          <Button component={Link} to="/snippets" variant="light">
            К моим сниппетам
          </Button>
        </Stack>
      </Center>
    );
  }

  const meta = langMeta[language] ?? {
    label: language,
    dot: '#adb5bd',
    runnable: false,
  };
  const fileName = FILE_NAME_BY_LANGUAGE[language] ?? 'index.txt';
  const statusMeta = SAVE_STATUS_META[saveStatus];
  const shareUsername = ownerQuery.data?.username ?? user?.username ?? 'guest';

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#f8f9fa',
      }}
    >
      {/* ===== Верхняя панель (52px) ===== */}
      <EditorHeader
        setName={setName}
        name={name}
        meta={meta}
        saveNow={saveNow}
        statusMeta={statusMeta}
        setShareOpened={setShareOpened}
        handleRun={handleRun}
        running={running}
        markDirty={markDirty}
      />

      {/* ===== Основная область ===== */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* --- Левый сайдбар (212px) --- */}
        <EditorSidebar
          fileName={fileName}
          meta={meta}
          setPackageOpened={setPackageOpened}
        />

        {/* --- Центр: редактор кода --- */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            background: editorColors.bg,
          }}
        >
          <Box
            style={{
              height: 40,
              flexShrink: 0,
              display: 'flex',
              background: editorColors.panel,
              borderBottom: `1px solid ${editorColors.border}`,
            }}
          >
            <Box
              px="lg"
              style={{
                display: 'flex',
                alignItems: 'center',
                background: editorColors.bg,
                borderTop: `2px solid ${editorColors.accent}`,
                borderRight: `1px solid ${editorColors.border}`,
              }}
            >
              <Text ff="monospace" fz={13} style={{ color: editorColors.text }}>
                {fileName}
              </Text>
            </Box>
          </Box>
          <div style={{ flex: 1, minHeight: 0 }}>
            <MonacoEditor
              theme="vs-dark"
              language={language}
              value={code}
              onChange={(value) => {
                setCode(value ?? '');
                markDirty();
              }}
              onMount={handleEditorMount}
              loading={<Loader color={editorColors.accent} />}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                minimap: { enabled: false },
                tabSize: 2,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 14 },
                renderLineHighlight: 'line',
              }}
            />
          </div>
        </div>

        {/* --- Правая панель: консоль/ввод (~25%) --- */}
        <div style={{ width: '25%', flexShrink: 0, minWidth: 260 }}>
          <ConsolePanel
            tab={tab}
            onTabChange={setTab}
            lines={lines}
            running={running}
            stdin={stdin}
            onStdinChange={setStdin}
            onClear={clearLines}
          />
        </div>
      </div>

      {/* ===== Статус-бар (28px) ===== */}
      <EditorStatusBar meta={meta} cursor={cursor} />

      <ShareModal
        opened={shareOpened}
        onClose={() => setShareOpened(false)}
        username={shareUsername}
        slug={slug ?? 'draft'}
        saved={snippetIdRef.current != null || slug != null}
      />
      <AddPackageModal
        opened={packageOpened}
        onClose={() => setPackageOpened(false)}
      />
    </div>
  );
}
