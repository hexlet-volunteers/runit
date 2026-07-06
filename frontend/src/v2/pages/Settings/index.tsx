import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Modal,
  SegmentedControl,
  Slider,
  Stack,
  Switch,
  Tabs,
  Text,
  TextInput,
  Textarea,
  Title,
  Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { useSession } from '../../session';
import { useTRPCClient } from '../../../utils/trpc';
import AppHeader, { initialsOf } from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';

// Ключи localStorage для настроек редактора.
// TODO(#832): перенести настройки на сервер (users.settings), сейчас — только localStorage.
const LS_FONT_SIZE = 'runit.v2.editorFontSize';
const LS_CONSOLE_LAYOUT = 'runit.v2.consoleLayout';
const LS_TAB_SPACES = 'runit.v2.tabSpaces';

const readLS = (key: string, fallback: string): string => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

// Строка-настройка в стиле макета: заголовок + подпись слева, контрол справа.
function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: ReactNode;
}) {
  return (
    <Group justify="space-between" wrap="nowrap" align="center" py="md">
      <Box>
        <Text fw={600}>{title}</Text>
        <Text c="dimmed" fz="sm">
          {description}
        </Text>
      </Box>
      {control}
    </Group>
  );
}

function ProfileTab() {
  const { user } = useSession();
  const [name, setName] = useState('');
  const [username, setUsername] = useState(user?.username ?? '');
  const [about, setAbout] = useState('');

  return (
    <Card withBorder radius="lg" p="xl" mt="lg">
      <Stack gap="lg">
        <Group gap="lg">
          <Avatar color="blue" radius="xl" size={72}>
            {initialsOf(user?.username ?? '')}
          </Avatar>
          <Group gap="sm">
            {/* TODO(#536): загрузка аватара (сейчас — только инициалы) */}
            <Tooltip label="В разработке (#536)">
              <Button
                variant="default"
                data-disabled
                onClick={(e) => e.preventDefault()}
              >
                Загрузить фото
              </Button>
            </Tooltip>
            <Tooltip label="В разработке (#536)">
              <Button
                variant="subtle"
                color="red"
                data-disabled
                onClick={(e) => e.preventDefault()}
              >
                Удалить
              </Button>
            </Tooltip>
          </Group>
        </Group>

        <TextInput
          label="Имя"
          placeholder="Как вас зовут"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <TextInput
          label="Имя пользователя"
          leftSection={
            <Text fz="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
              runit.hexlet.io/@
            </Text>
          }
          leftSectionWidth={140}
          styles={{ input: { paddingLeft: 140 } }}
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
        />
        <Textarea
          label="О себе"
          placeholder="Пара слов о том, чем занимаетесь"
          minRows={3}
          autosize
          value={about}
          onChange={(e) => setAbout(e.currentTarget.value)}
        />

        <Group justify="flex-end">
          {/* TODO(#718, #832): сохранение профиля (имя, био) на сервере */}
          <Tooltip label="В разработке (#718/#832)">
            <Button data-disabled onClick={(e) => e.preventDefault()}>
              Сохранить
            </Button>
          </Tooltip>
        </Group>
      </Stack>
    </Card>
  );
}

function EditorTab() {
  const [fontSize, setFontSize] = useState<number>(() => {
    const parsed = Number(readLS(LS_FONT_SIZE, '14'));
    return Number.isFinite(parsed) && parsed >= 12 && parsed <= 20 ? parsed : 14;
  });
  const [consoleLayout, setConsoleLayout] = useState<string>(() =>
    readLS(LS_CONSOLE_LAYOUT, 'right'),
  );
  const [tabSpaces, setTabSpaces] = useState<boolean>(
    () => readLS(LS_TAB_SPACES, 'true') === 'true',
  );

  useEffect(() => {
    try {
      localStorage.setItem(LS_FONT_SIZE, String(fontSize));
    } catch {
      /* приватный режим — молча пропускаем */
    }
  }, [fontSize]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_CONSOLE_LAYOUT, consoleLayout);
    } catch {
      /* noop */
    }
  }, [consoleLayout]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_TAB_SPACES, String(tabSpaces));
    } catch {
      /* noop */
    }
  }, [tabSpaces]);

  return (
    <Card withBorder radius="lg" p="xl" mt="lg">
      <SettingRow
        title="Размер шрифта в редакторе"
        description="Применяется мгновенно"
        control={
          <Group gap="md" wrap="nowrap" w={320}>
            <Slider
              min={12}
              max={20}
              step={1}
              value={fontSize}
              onChange={setFontSize}
              style={{ flex: 1 }}
              label={(v) => `${v} px`}
            />
            <Badge variant="light" size="lg" radius="sm">
              {fontSize} px
            </Badge>
          </Group>
        }
      />
      <Divider />
      <SettingRow
        title="Расположение консоли"
        description="Справа — как в repl.it, снизу — как в IDE"
        control={
          <SegmentedControl
            value={consoleLayout}
            onChange={setConsoleLayout}
            data={[
              { label: 'Справа', value: 'right' },
              { label: 'Снизу', value: 'bottom' },
            ]}
          />
        }
      />
      <Divider />
      <SettingRow
        title="Табуляция"
        description="Клавиша Tab вставляет пробелы"
        control={
          <Switch
            size="md"
            checked={tabSpaces}
            onChange={(e) => setTabSpaces(e.currentTarget.checked)}
          />
        }
      />
      <Text c="dimmed" fz="sm" ta="center" mt="lg">
        Размер шрифта и расположение консоли уже применены к редактору — откройте его,
        чтобы проверить.
      </Text>
    </Card>
  );
}

function AccountTab() {
  const { user, logout } = useSession();
  const trpc = useTRPCClient();
  const navigate = useNavigate();
  const [confirmOpened, setConfirmOpened] = useState(false);

  const deleteMutation = useMutation({
    // TODO(#834): каскадная очистка сниппетов пользователя при удалении аккаунта.
    mutationFn: () => trpc.users.deleteUser.mutate({ id: user!.id }),
    onSuccess: () => {
      notifications.show({ message: 'Аккаунт удалён', color: 'gray' });
      logout();
      navigate('/');
    },
    onError: () => {
      notifications.show({
        message: 'Не удалось удалить аккаунт. Попробуйте позже.',
        color: 'red',
      });
    },
  });

  return (
    <Stack gap="lg" mt="lg">
      <Card withBorder radius="lg" p="xl">
        <Text fw={600} mb="md">
          Электронная почта
        </Text>
        <Group justify="space-between" wrap="nowrap">
          <Group gap="sm">
            <Text>{user?.email}</Text>
            {/* TODO(#416, #472): реальное подтверждение почты письмом */}
            <Badge variant="light" color="gray">
              Подтверждена
            </Badge>
          </Group>
          <Tooltip label="В разработке (#416/#472)">
            <Button variant="default" data-disabled onClick={(e) => e.preventDefault()}>
              Сменить
            </Button>
          </Tooltip>
        </Group>
      </Card>

      <Card withBorder radius="lg" p="xl">
        <Text fw={600} mb="md">
          Пароль
        </Text>
        <Group justify="space-between" wrap="nowrap">
          <Text c="dimmed" fz="sm">
            Регулярная смена пароля повышает безопасность аккаунта.
          </Text>
          {/* TODO(#770, #640): смена пароля через бэкенд */}
          <Tooltip label="В разработке (#770/#640)">
            <Button variant="default" data-disabled onClick={(e) => e.preventDefault()}>
              Сменить пароль
            </Button>
          </Tooltip>
        </Group>
      </Card>

      <Card withBorder radius="lg" p="xl">
        <Text fw={600} mb="md">
          Активные сессии
        </Text>
        <Group justify="space-between">
          <Text>Этот браузер</Text>
          <Badge variant="light" color="green">
            Текущая
          </Badge>
        </Group>
        {/* TODO(#833): список активных сессий с бэкенда */}
        <Text c="dimmed" fz="sm" mt="sm">
          Список сессий появится позже (#833)
        </Text>
      </Card>

      <Card
        withBorder
        radius="lg"
        p="xl"
        style={{ borderColor: 'var(--mantine-color-red-3)' }}
      >
        <Text fw={600} c="red.7" mb="md">
          Удаление аккаунта
        </Text>
        <Group justify="space-between" wrap="nowrap" align="center">
          <Text c="dimmed" fz="sm">
            Аккаунт и все сниппеты будут удалены безвозвратно. Это действие нельзя
            отменить.
          </Text>
          <Button color="red" variant="outline" onClick={() => setConfirmOpened(true)}>
            Удалить аккаунт
          </Button>
        </Group>
      </Card>

      <Modal
        opened={confirmOpened}
        onClose={() => setConfirmOpened(false)}
        title="Удалить аккаунт?"
        centered
        radius="lg"
      >
        <Text fz="sm" mb="lg">
          Аккаунт <b>@{user?.username}</b> и все его сниппеты будут удалены
          безвозвратно. Это действие нельзя отменить.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setConfirmOpened(false)}>
            Отмена
          </Button>
          <Button
            color="red"
            loading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            Удалить навсегда
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}

export default function Settings() {
  const { isGuest } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (isGuest) navigate('/', { replace: true });
  }, [isGuest, navigate]);

  if (isGuest) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      <Container size="lg" py="xl" style={{ width: '100%' }}>
        <Box maw={760} mx="auto">
          <Title order={1} mb="lg">
            Настройки
          </Title>
          <Tabs defaultValue="profile">
            <Tabs.List>
              <Tabs.Tab value="profile">Профиль</Tabs.Tab>
              <Tabs.Tab value="editor">Редактор</Tabs.Tab>
              <Tabs.Tab value="account">Аккаунт</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="profile">
              <ProfileTab />
            </Tabs.Panel>
            <Tabs.Panel value="editor">
              <EditorTab />
            </Tabs.Panel>
            <Tabs.Panel value="account">
              <AccountTab />
            </Tabs.Panel>
          </Tabs>
        </Box>
      </Container>
      <AppFooter />
    </div>
  );
}
