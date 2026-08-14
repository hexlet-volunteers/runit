import {
  Group,
  Text,
} from '@mantine/core';
import { runtimeLabel } from '../../../shared/theme';
import { useEditorPrefs } from '../../../shared/lib';
import { type Meta } from '..'

export type StatusBarProps = {
  meta: Meta,
  language: string,
  cursor: {
    line: number;
    col: number;
  },
  /**
   * Короткий вид для мобильного (#842). На 375 px все шесть подписей не
   * помещаются в строку 28 px и расползаются в две-три строки, ломая раскладку.
   * Остаются язык и позиция курсора — единственное, что меняется по ходу работы;
   * остальное (кодировка, версия, размер отступа) постоянно и на маленьком
   * экране только занимает место.
   */
  compact?: boolean,
}

export default function EditorStatusBar(props: StatusBarProps) {
  const { meta, language, cursor, compact = false } = props;
  // Подпись об отступе была постоянной («2 пробела») независимо от настроек:
  // с выключенным «Tab вставляет пробелы» она прямо противоречила редактору.
  const { tabSpaces } = useEditorPrefs();

  if (compact) {
    return (
      <Group
        px="sm"
        justify="space-between"
        wrap="nowrap"
        style={{
          height: 28,
          flexShrink: 0,
          background: '#fff',
          borderTop: '1px solid #e9ecef',
        }}
      >
        <Text fz={12} c="dimmed" truncate>
          {meta.label}
        </Text>
        <Text fz={12} c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          {cursor.line}:{cursor.col}
        </Text>
      </Group>
    );
  }

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
        <Text fz={12} c="dimmed">
          Отступ: {tabSpaces ? '2 пробела' : 'табуляция'}
        </Text>
      </Group>
      <Group gap="lg" wrap="nowrap">
        <Text fz={12} c="dimmed">UTF-8</Text>
        <Text fz={12} c="dimmed">Runit v2.1</Text>
      </Group>
    </Group>
  )
}
