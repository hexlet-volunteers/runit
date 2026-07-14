import { Box, Button, Tooltip } from '@mantine/core';
import { editorColors } from '../../../shared/theme';

/** Заблокированная кнопка с тултипом. Используется для ещё не реализованных массовых действий. */
export default function DisabledAction({ label, tooltip }: { label: string; tooltip: string }) {
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