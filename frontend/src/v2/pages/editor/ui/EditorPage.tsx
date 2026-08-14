import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  Alert,
  Box,
  Button,
  Center,
  Group,
  Loader,
  SegmentedControl,
  Stack,
  Text,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useQuery } from '@tanstack/react-query';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';

import { useTRPCClient } from '../../../shared/api';
import { useEditorPrefs } from '../../../shared/lib';
import { editorColors, langMeta, runtimeLabel } from '../../../shared/theme';
import { useSession } from '../../../entities/user';

import { ConsolePanel } from '../../../features/run-code';
import { isPreviewLanguage } from '../../../shared/runner/preview';
import { ShareModal } from '../../../features/share-snippet';
import AddPackageModal from './AddPackageModal';

import {
  FILE_NAME_BY_LANGUAGE,
  STARTER_CODE,
  SAVE_STATUS_META,
  monacoLanguage,
  useSnippetSave,
} from '..';
import EditorHeader from './EditorHeader';
import EditorSidebar from './EditorSidebar';
import EditorStatusBar from './EditorStatusBar';
import { useRunner } from '../../../features/run-code';
import {
  useSnippetById,
  generateSnippetName,
  createSnippet,
  toSnippetLanguage,
} from '../../../entities/snippet';
import { useUserById } from '../../../entities/user';
import { useAuthModal } from '../../../features/auth';

// Экран редактора Runit v2 (docs/design/editor.png).
// TODO(#821, #609): серверное исполнение — сейчас JS выполняется в Web Worker,
// остальные языки отвечают заглушкой unsupportedLanguage.

/** Страница редактора сниппетов с Monaco Editor, консолью и сохранением. */
export default function EditorPage() {
  const { id } = useParams();
  const snippetId = id ? Number(id) : null;
  const trpc = useTRPCClient();
  const navigate = useNavigate();
  const auth = useAuthModal();
  const { user } = useSession();

  const [name, setName] = useState('');
  const [code, setCode] = useState(STARTER_CODE);
  const [language, setLanguage] = useState('javascript');
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [shareOpened, setShareOpened] = useState(false);
  const [packageOpened, setPackageOpened] = useState(false);

  /**
   * Мобильная раскладка (#842).
   *
   * На узком экране три панели рядом не помещаются: при 375 px код не виден
   * вовсе — его выдавливают сайдбар файлов и консоль. Поэтому панели не
   * сжимаются, а переключаются, а сайдбар скрыт: мультифайловость ещё не
   * реализована (#818/#819), файл всегда один, и на мобильном это 212 px
   * бесполезной ширины.
   *
   * Порог 768 px — та же граница, что у остальных адаптивных правил интерфейса.
   */
  const isMobile = useMediaQuery('(max-width: 767px)') ?? false;
  const [mobilePane, setMobilePane] = useState<'code' | 'output'>('code');

  /**
   * Настройки со страницы «Настройки → Редактор». До этого они писались в
   * localStorage и никем не читались: у Monaco стоял жёсткий размер шрифта,
   * табуляция всегда в два пробела, консоль всегда справа.
   *
   * Расположение консоли учитывается только на широком экране: на узком панели
   * переключаются кнопкой (#842), делить там высоту не на чем.
   */
  const prefs = useEditorPrefs();
  const consoleAtBottom = !isMobile && prefs.consoleLayout === 'bottom';

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
    runKey,
    handleRun,
    clearLines,
  } = useRunner(code, language);

  /**
   * На мобильном при запуске сразу показываем вывод: иначе пользователь нажимает
   * «Выполнить» и остаётся на панели кода, где ничего не происходит.
   *
   * Слежение за состоянием, а не обёртка вокруг кнопки: запуск бывает и с
   * хоткея, и из превью вёрстки (там running не поднимается, меняется runKey).
   */
  useEffect(() => {
    if (isMobile && (running || runKey > 0)) setMobilePane('output');
  }, [isMobile, running, runKey]);
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

  /**
   * Чужой сниппет открыт только для чтения.
   *
   * По id доступен публичный сниппет любого автора — это нормально, но править
   * его нельзя: сервер отклоняет чужие изменения (NOT_FOUND). Раньше редактор
   * об этом не знал: текст менялся, автосохранение уходило в отказ, и человек
   * получал поток тостов «не удалось сохранить» вместо простого объяснения.
   * Правки сохраняются в свою копию — кнопка ниже.
   */
  const isForeign =
    snippetQuery.data != null &&
    snippetQuery.data.userId != null &&
    (user == null || snippetQuery.data.userId !== user.id);

  const {
    saveManually,
    markDirty,
    saveStatus,
    setSaveStatus,
    slug,
    setSlug,
    snippetIdRef,
    createdHereRef,
  } = useSnippetSave(snippetId, nameRef, codeRef, languageRef, {
    readOnly: isForeign,
  });

  /** Создаёт свою копию открытого чужого сниппета и открывает её в редакторе. */
  const [forking, setForking] = useState(false);
  const forkSnippet = async () => {
    if (!snippetQuery.data) return;
    if (!user) {
      auth.open('register');
      return;
    }
    setForking(true);
    try {
      const created = await createSnippet(trpc, {
        // Имя ограничено 30 символами, поэтому не «Копия …», а исходное имя.
        name: nameRef.current.slice(0, 30),
        code: codeRef.current,
        language: toSnippetLanguage(languageRef.current),
        visibility: 'private',
      });
      initializedFor.current = `id:${created.id}`;
      navigate(`/editor/${created.id}`, { replace: false });
    } catch {
      notifications.show({
        message: 'Не удалось создать копию сниппета',
        color: 'red',
      });
    } finally {
      setForking(false);
    }
  };

  /** Инициализация стейта редактора при загрузке существующего сниппета. */
  useEffect(() => {
    if (
      snippetId != null &&
      snippetQuery.data &&
      initializedFor.current !== `id:${snippetId}`
    ) {
      initializedFor.current = `id:${snippetId}`;
      /**
       * Сниппет только что создан из этого же редактора: в состоянии уже лежит
       * то, что человек набрал, и оно новее серверной копии. Пока этой проверки
       * не было, символы, набранные за время запроса на создание, затирались
       * ответом сервера — правка исчезала на глазах.
       */
      if (createdHereRef.current) {
        createdHereRef.current = false;
        setSlug(snippetQuery.data.slug);
        return;
      }
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
        saveNow={saveManually}
        statusMeta={statusMeta}
        readOnly={isForeign}
        setShareOpened={setShareOpened}
        handleRun={handleRun}
        running={running}
        markDirty={markDirty}
      />

      {isForeign && (
        <Alert color="yellow" radius={0} py={8}>
          <Group justify="space-between" wrap="wrap" gap="xs">
            <Text fz="sm">
              Это чужой сниппет — он открыт только для чтения.
            </Text>
            <Button
              size="xs"
              variant="light"
              loading={forking}
              onClick={() => void forkSnippet()}
            >
              Создать свою копию
            </Button>
          </Group>
        </Alert>
      )}

      {/* ===== Основная область ===== */}
      {isMobile && (
        /*
          Переключатель панелей вместо трёх колонок. Панели остаются
          смонтированными (скрываются через display), иначе Monaco теряет
          историю правок и позицию курсора при каждом переключении.
        */
        <SegmentedControl
          fullWidth
          radius={0}
          value={mobilePane}
          onChange={(value) => setMobilePane(value as 'code' | 'output')}
          data={[
            { value: 'code', label: 'Код' },
            { value: 'output', label: isPreviewLanguage(language) ? 'Превью' : 'Консоль' },
          ]}
        />
      )}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* --- Левый сайдбар (212px) --- */}
        {!isMobile && (
          <EditorSidebar
            fileName={fileName}
            meta={meta}
            language={language}
            setPackageOpened={setPackageOpened}
          />
        )}

        {/*
          --- Центр: редактор и консоль ---
          При консоли снизу редактор и консоль складываются в колонку внутри
          этого блока, при консоли справа — консоль остаётся отдельной колонкой.
        */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: consoleAtBottom ? 'column' : 'row',
            minHeight: 0,
          }}
        >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: isMobile && mobilePane !== 'code' ? 'none' : 'flex',
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
              language={monacoLanguage(language)}
              value={code}
              onChange={(value) => {
                setCode(value ?? '');
                markDirty();
              }}
              onMount={handleEditorMount}
              loading={<Loader color={editorColors.accent} />}
              options={{
                readOnly: isForeign,
                fontSize: prefs.fontSize,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                minimap: { enabled: false },
                tabSize: 2,
                insertSpaces: prefs.tabSpaces,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 14 },
                renderLineHighlight: 'line',
              }}
            />
          </div>
        </div>

        {/* --- Консоль/ввод: справа ~25%, снизу ~40% высоты, на мобильном — во всю ширину --- */}
        <div
          style={
            isMobile
              ? { flex: 1, minWidth: 0, display: mobilePane === 'output' ? 'block' : 'none' }
              : consoleAtBottom
                ? { height: '40%', flexShrink: 0, minHeight: 180 }
                : { width: '25%', flexShrink: 0, minWidth: 260 }
          }
        >
          <ConsolePanel
            tab={tab}
            onTabChange={setTab}
            lines={lines}
            running={running}
            stdin={stdin}
            onStdinChange={setStdin}
            onClear={clearLines}
            language={language}
            code={code}
            runKey={runKey}
            runtime={runtimeLabel(language)}
          />
        </div>
        </div>
      </div>

      {/* ===== Статус-бар (28px) ===== */}
      <EditorStatusBar
        meta={meta}
        language={language}
        cursor={cursor}
        compact={isMobile}
      />

      <ShareModal
        opened={shareOpened}
        onClose={() => setShareOpened(false)}
        username={shareUsername}
        slug={slug ?? 'draft'}
        saved={snippetIdRef.current != null || slug != null}
        snippetId={snippetQuery.data?.id ?? snippetIdRef.current ?? null}
        shortCode={snippetQuery.data?.shortCode ?? null}
        visibility={snippetQuery.data?.visibility ?? null}
      />
      <AddPackageModal
        opened={packageOpened}
        onClose={() => setPackageOpened(false)}
      />
    </div>
  );
}
