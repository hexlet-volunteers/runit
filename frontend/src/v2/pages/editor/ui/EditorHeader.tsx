import { Link } from 'react-router';
import {
  ActionIcon,
  Avatar,
  Box,
  Button,
  Group,
  Menu,
  Text,
  Tooltip,
  UnstyledButton,
} from '@mantine/core';
import { RunitLogo } from '../../../shared/ui';
import { initialsOf } from '../../../shared/lib';
import {
  IconArrowLeft,
  IconHistory,
  IconPlay,
  IconShare,
  IconUsers,
} from '../../../shared/ui';

import { useAuthModal } from '../../../features/auth';
import { useSession } from '../../../entities/user';
import { type Meta } from '..'

export type EditorHeaderProps = {
    setName: (name: string) => void,
    name: string,
    meta: Meta,
    saveNow: () => void,
    statusMeta: {
      color: string;
      label: string;
    },
    markDirty: () => void,
    /** Чужой сниппет: имя не меняется, статус сохранения не показывается. */
    readOnly?: boolean,
    handleRun: () => Promise<void>,
    setShareOpened: (v: boolean) => void,
    running: boolean,
}

export default function EditorHeader( props: EditorHeaderProps ) {
  const { user, isGuest } = useSession();
  const auth = useAuthModal();
  const {
    setName,
    meta,
    name,
    saveNow,
    markDirty,
    statusMeta,
    handleRun,
    setShareOpened,
    running,
    readOnly = false,
  } = props;

  return (
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
      {/*
        Левая часть сжимается и обрезается, правая — нет. Без этого на узком
        экране (примерно от 900 px) имя сниппета и статус сохранения заезжали
        на кнопки «Поделиться» и «Выполнить»: у Group стоит wrap="nowrap", а
        input имел фиксированную ширину, поэтому лишнее не убиралось, а
        накладывалось поверх.
      */}
      <Group
        gap="sm"
        wrap="nowrap"
        style={{ minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}
      >
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
          {/* Логотип на мобильном лишний: рядом есть стрелка «назад», а
              ширины в шапке не хватает (#842). */}
          <UnstyledButton component={Link} to="/" visibleFrom="sm">
            <RunitLogo size={26} />
          </UnstyledButton>
          <input
            readOnly={readOnly}
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
              flex: '0 1 200px',
              minWidth: 60,
              textOverflow: 'ellipsis',
            }}
          />
          {/* Язык на мобильном показан в статус-баре — здесь не дублируем. */}
          <Group
            gap={6}
            px={10}
            py={4}
            wrap="nowrap"
            visibleFrom="sm"
            style={{ background: '#f1f3f5', borderRadius: 8, flexShrink: 0 }}
          >
            <Box w={8} h={8} style={{ borderRadius: '50%', background: meta.dot }} />
            <Text fz="sm" fw={600} c="dark.5">
              {meta.label}
            </Text>
        </Group>
        {/* Статус сохранения бессмысленен там, где сохранять нечего. */}
        {!readOnly && (
        <Tooltip
            label={
              isGuest
                ? 'Зарегистрируйтесь, чтобы сохранять сниппеты'
                : 'Сниппет сохраняется сам через 1,5 секунды после правки. Нажмите здесь или Ctrl+S, чтобы сохранить сейчас'
            }
            withArrow
            multiline
            w={260}
          >
            {/* Статус сохранения не сжимается и не обрезается: это обратная
                связь о сохранности работы, она важнее длины имени. */}
            <UnstyledButton onClick={() => void saveNow()} style={{ flexShrink: 0 }}>
              <Group gap={6} wrap="nowrap">
                <Box
                  w={8}
                  h={8}
                  style={{ borderRadius: '50%', background: statusMeta.color }}
                />
                <Text
                  fz="sm"
                  c="dimmed"
                  visibleFrom="sm"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {statusMeta.label}
                </Text>
              </Group>
            </UnstyledButton>
          </Tooltip>
        )}
        </Group>

        <Group gap="sm" wrap="nowrap" style={{ flexShrink: 0 }}>
          {/*
            Обе кнопки — заглушки нереализованных функций, и обе скрыты на
            узких экранах: места в шапке не хватает, а из-за них статус
            сохранения оказывался перекрыт. Работающие элементы приоритетнее
            неработающих.
          */}
          <Tooltip label="В разработке (#836/#837)" withArrow>
            <ActionIcon
              visibleFrom="md"
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
              visibleFrom="md"
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
            visibleFrom="sm"
            variant="light"
            leftSection={<IconShare />}
            onClick={() => setShareOpened(true)}
          >
            Поделиться
          </Button>
          {/* На мобильном подпись не помещается, действие остаётся доступным. */}
          <ActionIcon
            hiddenFrom="sm"
            variant="light"
            size="lg"
            aria-label="Поделиться"
            onClick={() => setShareOpened(true)}
          >
            <IconShare />
          </ActionIcon>
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
  )
}
