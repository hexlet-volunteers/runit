import { Box, Button, Group, Paper, Text, Tooltip } from '@mantine/core';
import { editorColors } from '../../theme';

// Тёмная панель массовых действий. Появляется, когда выбран хотя бы один сниппет.
// TODO(#830): массовое добавление тегов (тегов пока нет в модели данных).
// TODO(#613): смена видимости (поле видимости появится на сервере).

function DisabledAction({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <Tooltip label={tooltip} withArrow>
      <Box>
        <Button
          size="xs"
          variant="outline"
          color="gray"
          disabled
          styles={{ root: { borderColor: editorColors.border } }}
        >
          {label}
        </Button>
      </Box>
    </Tooltip>
  );
}

type Props = {
  count: number;
  onClear: () => void;
};

export default function BulkBar({ count, onClear }: Props) {
  if (count === 0) return null;

  return (
    <Paper
      radius="xl"
      px="lg"
      py="xs"
      shadow="xl"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        background: editorColors.bg,
        border: `1px solid ${editorColors.border}`,
      }}
    >
      <Group gap="md" wrap="nowrap">
        <Text c={editorColors.text} fz="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
          Выбрано: {count}
        </Text>
        <DisabledAction label="Добавить тег" tooltip="В разработке (#830)" />
        <DisabledAction label="Сменить видимость" tooltip="В разработке (#613)" />
        <DisabledAction label="Удалить" tooltip="В разработке (#830/#613)" />
        <Button size="xs" variant="subtle" color="gray" onClick={onClear}>
          Снять
        </Button>
      </Group>
    </Paper>
  );
}
