import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Center,
  Group,
  Loader,
  Menu,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import MonacoEditor, { type OnMount } from '@monaco-editor/react';
import { notifications } from '@mantine/notifications';

import { useTRPCClient } from '../../../utils/trpc';
import { editorColors, langMeta } from '../../theme';
import { useSession } from '../../session';
import { useAuthModal } from '../../components/AuthModal/context';
import { RunitLogo, initialsOf } from '../../components/AppHeader';
import { runJavaScript, unsupportedLanguage, type ConsoleLine } from '../../runner';
import ConsolePanel, { type OutputTab } from './ConsolePanel';
import ShareModal from './ShareModal';
import AddPackageModal from './AddPackageModal';
import {
  IconArrowLeft,
  IconHistory,
  IconPlay,
  IconPlus,
  IconShare,
  IconUsers,
} from './icons';

// Экран редактора Runit v2 (docs/design/editor.png).
// TODO(#821, #609): серверное исполнение — сейчас JS выполняется в Web Worker,
// остальные языки отвечают заглушкой unsupportedLanguage.

type SaveStatus = 'saved' | 'saving' | 'unsaved';

const FILE_NAME_BY_LANGUAGE: Record<string, string> = {
  javascript: 'index.js',
  typescript: 'index.ts',
  python: 'main.py',
  php: 'index.php',
  ruby: 'main.rb',
  java: 'Main.java',
  html: 'index.html',
};

const STARTER_CODE = `// Корзина курса: считаем итоговую стоимость
const items = [
  { title: 'JS: Массивы', price: 3900 },
  { title: 'JS: Функции', price: 4900 },
  { title: 'JS: Объекты', price: 4400 },
];

const sum = (nums) => nums.reduce((acc, n) => acc + n, 0);
const total = sum(items.map((item) => item.price));

console.log('Позиций в корзине:', items.length);
console.log('Сумма без скидки:', total, '₽');
`;

const SAVE_STATUS_META: Record<SaveStatus, { color: string; label: string }> = {
  saved: { color: '#51cf66', label: 'Сохранено' },
  saving: { color: '#4dabf7', label: 'Сохранение…' },
  unsaved: { color: '#adb5bd', label: 'Не сохранено' },
};

function SectionLabel({ children }: { children: string }) {
  return (
    <Text fz={11} fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
      {children}
    </Text>
  );
}

export default function EditorPage() {
  const { id } = useParams();
  const snippetId = id ? Number(id) : null;
  const navigate = useNavigate();
  const trpc = useTRPCClient();
  const { user, isGuest } = useSession();
  const auth = useAuthModal();

  const [name, setName] = useState('');
  const [code, setCode] = useState(STARTER_CODE);
  const [language, setLanguage] = useState('javascript');
  const [slug, setSlug] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('unsaved');
  const [stdin, setStdin] = useState('');
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState<OutputTab>('console');
  const [cursor, setCursor] = useState({ line: 1, col: 1 });
  const [shareOpened, setShareOpened] = useState(false);
  const [packageOpened, setPackageOpened] = useState(false);

  // Рефы для стабильных колбэков (хоткей, monaco-команда, debounce).
  const nameRef = useRef(name);
  const codeRef = useRef(code);
  const stdinRef = useRef(stdin);
  const languageRef = useRef(language);
  nameRef.current = name;
  codeRef.current = code;
  stdinRef.current = stdin;
  languageRef.current = language;

  const initializedFor = useRef<string>('');

  // --- Данные -------------------------------------------------------------
  const snippetQuery = useQuery({
    queryKey: ['v2-editor-snippet', snippetId],
    queryFn: () => trpc.snippets.getSnippetById.query(snippetId as number),
    enabled: snippetId != null,
    retry: false,
  });

  const ownerQuery = useQuery({
    queryKey: ['v2-editor-owner', snippetQuery.data?.userId],
    queryFn: () => trpc.users.getUserById.query(snippetQuery.data!.userId),
    enabled: snippetQuery.data?.userId != null,
  });

  const draftNameQuery = useQuery({
    queryKey: ['v2-editor-draft-name'],
    queryFn: () => trpc.snippets.generateSnippetName.query(),
    enabled: snippetId == null,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (snippetId != null && snippetQuery.data && initializedFor.current !== `id:${snippetId}`) {
      initializedFor.current = `id:${snippetId}`;
      setName(snippetQuery.data.name);
      setCode(snippetQuery.data.code);
      setLanguage(snippetQuery.data.language);
      setSlug(snippetQuery.data.slug);
      setSaveStatus('saved');
    }
  }, [snippetId, snippetQuery.data]);

  useEffect(() => {
    if (snippetId == null && draftNameQuery.data && initializedFor.current === '') {
      initializedFor.current = 'draft';
      setName(draftNameQuery.data.name);
    }
  }, [snippetId, draftNameQuery.data]);

  // --- Сохранение ---------------------------------------------------------
  // TODO(#826): разрешение конфликтов и оффлайн-черновики.
  const savingRef = useRef(false);
  const snippetIdRef = useRef(snippetId);
  snippetIdRef.current = snippetId;

  const saveNow = useCallback(async () => {
    if (isGuest || !user) {
      auth.open('register');
      return;
    }
    if (savingRef.current) return;
    savingRef.current = true;
    setSaveStatus('saving');
    try {
      if (snippetIdRef.current == null) {
        const created = await trpc.snippets.createSnippet.mutate({
          name: nameRef.current,
          code: codeRef.current,
          language: languageRef.current,
          userId: user.id,
        });
        initializedFor.current = `id:${created.id}`;
        setSlug(created.slug);
        setSaveStatus('saved');
        navigate(`/editor/${created.id}`, { replace: true });
      } else {
        await trpc.snippets.updateSnippet.mutate({
          id: snippetIdRef.current,
          name: nameRef.current,
          code: codeRef.current,
          language: languageRef.current,
        });
        setSaveStatus('saved');
      }
    } catch {
      setSaveStatus('unsaved');
      notifications.show({ message: 'Не удалось сохранить сниппет', color: 'red' });
    } finally {
      savingRef.current = false;
    }
  }, [isGuest, user, auth, trpc, navigate]);

  // Автосохранение с debounce 1.5 c — только для сохранённого сниппета юзера.
  useEffect(() => {
    if (saveStatus !== 'unsaved') return undefined;
    if (isGuest || snippetId == null) return undefined;
    const timer = setTimeout(() => {
      void saveNow();
    }, 1500);
    return () => clearTimeout(timer);
  }, [saveStatus, name, code, isGuest, snippetId, saveNow]);

  const markDirty = useCallback(() => setSaveStatus('unsaved'), []);

  // --- Запуск -------------------------------------------------------------
  const runningRef = useRef(false);
  const handleRun = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setTab('console');
    const result =
      languageRef.current === 'javascript'
        ? await runJavaScript(codeRef.current, stdinRef.current)
        : unsupportedLanguage(languageRef.current);
    setLines([
      ...result.lines,
      {
        type: 'system',
        text: `Процесс завершён с кодом ${result.exitCode} за ${Math.max(1, Math.round(result.durationMs))} мс`,
      },
    ]);
    runningRef.current = false;
    setRunning(false);
  }, []);

  const runRef = useRef(handleRun);
  runRef.current = handleRun;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        void runRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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
          <Text fw={700} fz="lg">Сниппет не найден</Text>
          <Button component={Link} to="/snippets" variant="light">
            К моим сниппетам
          </Button>
        </Stack>
      </Center>
    );
  }

  const meta = langMeta[language] ?? { label: language, dot: '#adb5bd', runnable: false };
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
      <Group
        component="header"
        px="md"
        justify="space-between"
        wrap="nowrap"
        style={{
          height: 52,
          flexShrink: 0,
          background: '#fff',
          borderBottom: '1px solid #e9ecef',
        }}
      >
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <Tooltip label="К моим сниппетам" withArrow>
            <ActionIcon
              component={Link}
              to="/snippets"
              variant="subtle"
              color="gray"
              aria-label="Назад к сниппетам"
            >
              <IconArrowLeft />
            </ActionIcon>
          </Tooltip>
          <UnstyledButton component={Link} to="/">
            <RunitLogo size={26} />
          </UnstyledButton>
          <input
            value={name}
            onChange={(e) => {
              setName(e.currentTarget.value);
              markDirty();
            }}
            placeholder="имя-сниппета"
            aria-label="Имя сниппета"
            spellCheck={false}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 15,
              fontWeight: 600,
              color: '#212529',
              width: 200,
              minWidth: 0,
            }}
          />
          <Group
            gap={6}
            px={10}
            py={4}
            wrap="nowrap"
            style={{ background: '#f1f3f5', borderRadius: 8, flexShrink: 0 }}
          >
            <Box w={8} h={8} style={{ borderRadius: '50%', background: meta.dot }} />
            <Text fz="sm" fw={600} c="dark.5">
              {meta.label}
            </Text>
          </Group>
          <Tooltip
            label={
              isGuest
                ? 'Зарегистрируйтесь, чтобы сохранять сниппеты'
                : 'Сохранить сейчас (автосохранение — 1,5 с)'
            }
            withArrow
          >
            <UnstyledButton onClick={() => void saveNow()}>
              <Group gap={6} wrap="nowrap">
                <Box
                  w={8}
                  h={8}
                  style={{ borderRadius: '50%', background: statusMeta.color }}
                />
                <Text fz="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                  {statusMeta.label}
                </Text>
              </Group>
            </UnstyledButton>
          </Tooltip>
        </Group>

        <Group gap="sm" wrap="nowrap">
          {/* TODO(#836, #837): история версий со снапшотами и diff */}
          <Tooltip label="В разработке (#836/#837)" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              data-disabled
              onClick={(e) => e.preventDefault()}
              aria-label="История версий"
            >
              <IconHistory />
            </ActionIcon>
          </Tooltip>
          {/* TODO(#3, #838): совместное редактирование в реальном времени */}
          <Tooltip label="В разработке (#3/#838)" withArrow>
            <ActionIcon
              variant="subtle"
              color="gray"
              data-disabled
              onClick={(e) => e.preventDefault()}
              aria-label="Совместная сессия"
            >
              <IconUsers />
            </ActionIcon>
          </Tooltip>
          <Button
            variant="light"
            leftSection={<IconShare />}
            onClick={() => setShareOpened(true)}
          >
            Поделиться
          </Button>
          <Tooltip label="Ctrl + Enter" withArrow>
            <Button
              leftSection={<IconPlay />}
              onClick={() => void handleRun()}
              disabled={running}
            >
              {running ? 'Выполняется…' : 'Выполнить'}
            </Button>
          </Tooltip>
          {isGuest ? (
            <Button variant="subtle" color="gray" onClick={() => auth.open('login')}>
              Войти
            </Button>
          ) : (
            <Menu position="bottom-end" width={180} radius="md">
              <Menu.Target>
                <UnstyledButton>
                  <Avatar color="blue" radius="xl" size={34}>
                    {initialsOf(user!.username)}
                  </Avatar>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>{user!.username}</Menu.Label>
                <Menu.Item component={Link} to="/snippets">
                  Мои сниппеты
                </Menu.Item>
                <Menu.Item component={Link} to={`/u/${user!.username}`}>
                  Профиль
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Group>

      {/* ===== Основная область ===== */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* --- Левый сайдбар (212px) --- */}
        <Box
          component="aside"
          w={212}
          style={{
            flexShrink: 0,
            background: '#fff',
            borderRight: '1px solid #e9ecef',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Group justify="space-between" px="md" pt="md" pb={6}>
            <SectionLabel>ФАЙЛЫ</SectionLabel>
            {/* TODO(#818, #819): мультифайловые сниппеты */}
            <Tooltip label="Мультифайловость — #818/#819" withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                data-disabled
                onClick={(e) => e.preventDefault()}
                aria-label="Добавить файл"
              >
                <IconPlus size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <Box px={8}>
            <Group
              gap={8}
              px={10}
              py={8}
              wrap="nowrap"
              style={{
                background: 'var(--mantine-color-blue-0)',
                borderRadius: 8,
              }}
            >
              <Box w={8} h={8} style={{ borderRadius: '50%', background: meta.dot }} />
              <Text ff="monospace" fz="sm" fw={600} c="blue.7">
                {fileName}
              </Text>
            </Group>
          </Box>

          <div style={{ flex: 1 }} />

          <Group justify="space-between" px="md" pb={6}>
            <SectionLabel>ПАКЕТЫ</SectionLabel>
            <Tooltip label="Добавить пакет" withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => setPackageOpened(true)}
                aria-label="Добавить пакет"
              >
                <IconPlus size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <Text px="md" pb="sm" fz="sm" c="dimmed">
            Нет зависимостей
          </Text>
          <Text
            px="md"
            py={10}
            fz="xs"
            c="dimmed"
            style={{ borderTop: '1px solid #e9ecef' }}
          >
            Node.js 20 LTS
          </Text>
        </Box>

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

        {/* --- Правая панель: консоль/ввод (~40%) --- */}
        <div style={{ width: '40%', maxWidth: 640, flexShrink: 0, minWidth: 260 }}>
          <ConsolePanel
            tab={tab}
            onTabChange={setTab}
            lines={lines}
            running={running}
            stdin={stdin}
            onStdinChange={setStdin}
            onClear={() => setLines([])}
          />
        </div>
      </div>

      {/* ===== Статус-бар (28px) ===== */}
      <Group
        px="md"
        justify="space-between"
        wrap="nowrap"
        style={{
          height: 28,
          flexShrink: 0,
          background: '#fff',
          borderTop: '1px solid #e9ecef',
        }}
      >
        <Group gap="lg" wrap="nowrap">
          <Text fz={12} c="dimmed">{meta.label}</Text>
          <Text fz={12} c="dimmed">Node.js 20 LTS</Text>
          <Text fz={12} c="dimmed">
            Строка {cursor.line}, столбец {cursor.col}
          </Text>
          <Text fz={12} c="dimmed">Отступ: 2 пробела</Text>
        </Group>
        <Group gap="lg" wrap="nowrap">
          <Text fz={12} c="dimmed">UTF-8</Text>
          <Text fz={12} c="dimmed">Runit v2.1 · MVP</Text>
        </Group>
      </Group>

      <ShareModal
        opened={shareOpened}
        onClose={() => setShareOpened(false)}
        username={shareUsername}
        slug={slug ?? 'draft'}
        saved={snippetIdRef.current != null || slug != null}
      />
      <AddPackageModal opened={packageOpened} onClose={() => setPackageOpened(false)} />
    </div>
  );
}
