import {
  Box,
  Group,
  Text,
} from '@mantine/core';

/** Логотип Runit с иконкой и текстовым названием. */
export function RunitLogo({ size = 28 }: { size?: number }) {
  return (
    <Group gap={8} wrap="nowrap">
      <Box
        w={size}
        h={size}
        style={{
          borderRadius: 8,
          background: 'var(--mantine-color-blue-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="white">
          <path d="M8 5v14l11-7z" />
        </svg>
      </Box>
      <Text fw={800} fz={size * 0.7} c="dark.9">
        Runit
      </Text>
    </Group>
  );
}