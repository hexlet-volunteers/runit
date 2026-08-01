import {
  Text,
} from '@mantine/core';

/** Метка секции в боковой панели. */
export default function SectionLabel({ children }: { children: string }) {
  return (
    <Text fz={11} fw={700} c="dimmed" style={{ letterSpacing: '0.08em' }}>
      {children}
    </Text>
  );
}
