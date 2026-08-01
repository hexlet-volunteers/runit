 import {
  Text,
} from '@mantine/core';
 
 /** Метка поля формы с кастомным стилем. */
export default function FieldLabel({ children }: { children: string }) {
  return (
    <Text fz="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: 0.8 }}>
      {children}
    </Text>
  );
}