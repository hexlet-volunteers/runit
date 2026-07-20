import {
  Group,
  Text,
} from '@mantine/core';
import { type Meta } from '..'

export type StatusBarProps = {
  meta: Meta,
  cursor: {
    line: number;
    col: number;
  },
}

export default function EditorStatusBar(props: StatusBarProps) {
  const {meta, cursor } = props;
  return (
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
        <Text fz={12} c="dimmed">Runit v2.1</Text>
      </Group>
    </Group>
  )
}
