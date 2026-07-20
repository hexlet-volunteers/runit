import { type ReactNode } from 'react';
import {
  Box,
  Group,
  Text,
} from '@mantine/core';

/** Строка-настройка: заголовок + подпись слева, элемент управления справа. */
export default function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description: string;
  control: ReactNode;
}) {
  return (
    <Group justify="space-between" wrap="nowrap" align="center" py="md">
      <Box>
        <Text fw={600}>{title}</Text>
        <Text c="dimmed" fz="sm">
          {description}
        </Text>
      </Box>
      {control}
    </Group>
  );
}