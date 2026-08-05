import {
  Group,
  Text,
} from '@mantine/core';
import { runtimeLabel } from '../../../shared/theme';
import { type Meta } from '..'

export type StatusBarProps = {
  meta: Meta,
  language: string,
  cursor: {
    line: number;
    col: number;
  },
}

export default function EditorStatusBar(props: StatusBarProps) {
  const { meta, language, cursor } = props;
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
        <Text fz={12} c="dimmed">{runtimeLabel(language)}</Text>
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
