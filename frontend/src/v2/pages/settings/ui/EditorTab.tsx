import { useEffect, useState } from 'react';
import SettingRow from './SettingRow';
import {
  Badge,
  Card,
  Divider,
  Group,
  SegmentedControl,
  Slider,
  Switch,
  Text,
} from '@mantine/core';

/** Ключи localStorage для настроек редактора. TODO(#832): перенести на сервер. */
const LS_FONT_SIZE = 'runit.v2.editorFontSize';
const LS_CONSOLE_LAYOUT = 'runit.v2.consoleLayout';
const LS_TAB_SPACES = 'runit.v2.tabSpaces';

/** Читает строку из localStorage. При ошибке (приватный режим) возвращает запасное значение. */
const readLS = (key: string, fallback: string): string => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

/** Вкладка «Редактор»: размер шрифта, расположение консоли, табуляция. Настройки хранятся в localStorage. */
export default function EditorTab() {
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