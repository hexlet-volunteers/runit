import { Link } from 'react-router-dom';
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
import { initialsOf } from '../../../shared/lib/initialsOf';
import {
  IconArrowLeft,
  IconHistory,
  IconPlay,
  IconShare,
  IconUsers,
} from '../../../shared/ui';

import { useAuthModal } from '../../../features/auth';
import { useSession } from '../../../entities/user';
import { type Meta } from '../types'

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
  )
}
