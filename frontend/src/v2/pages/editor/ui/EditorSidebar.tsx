import {
  ActionIcon,
  Box,
  Group,
  Text,
  Tooltip,
} from '@mantine/core';

import SectionLabel from './SectionLabel';
import {
  IconPlus,
} from '../../../shared/ui';
import { type Meta } from '..'

export type EditorSidebarProps = {
  meta: Meta,
  fileName: string,
  setPackageOpened: (v: boolean) => void
}

export default function EditorSidebar(props: EditorSidebarProps) {
  const {meta, fileName, setPackageOpened } = props;
  return (
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
  )
}
