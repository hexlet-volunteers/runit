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
import {
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  useEditorPrefs,
  writeEditorPrefs,
  type ConsoleLayout,
} from '../../../shared/lib';

/**
 * Вкладка «Редактор»: размер шрифта, расположение консоли, табуляция.
 *
 * Значения хранятся локально (shared/lib/editorPrefs) и читаются редактором.
 * Раньше вкладка складывала их в localStorage, а редактор об этом не знал:
 * переключатели двигались, надпись обещала «уже применено», и ничего не менялось.
 */
export default function EditorTab() {
  const { fontSize, consoleLayout, tabSpaces } = useEditorPrefs();

  return (
    <Card withBorder radius="lg" p="xl" mt="lg">
      <SettingRow
        title="Размер шрифта в редакторе"
        description="Применяется мгновенно"
        control={
          <Group gap="md" wrap="nowrap" w={320}>
            <Slider
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              step={1}
              value={fontSize}
              onChange={(value) => writeEditorPrefs({ fontSize: value })}
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
            onChange={(value) =>
              writeEditorPrefs({ consoleLayout: value as ConsoleLayout })
            }
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
            onChange={(e) =>
              writeEditorPrefs({ tabSpaces: e.currentTarget.checked })
            }
          />
        }
      />
      <Text c="dimmed" fz="sm" ta="center" mt="lg">
        Настройки применяются к редактору сразу — если он открыт в другой
        вкладке, менять их там не нужно. На узком экране консоль всегда
        переключается кнопкой, а не делит экран с кодом.
      </Text>
    </Card>
  );
}
