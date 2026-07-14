import type { ReactNode } from 'react';
import {
  Box,
  Text,
  Title,
} from '@mantine/core';

/** Секция правового текста: заголовок + тело. */
export default function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Title order={4} mb={6}>
        {title}
      </Title>
      <Text c="dark.6" style={{ lineHeight: 1.65 }}>
        {children}
      </Text>
    </Box>
  );
}