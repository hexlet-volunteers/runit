import type { ReactNode } from 'react';
import { Box, Card, SimpleGrid, Text, Title } from '@mantine/core';

type Feature = {
  title: string;
  text: string;
  icon: ReactNode;
};

function IconBadge({ children }: { children: ReactNode }) {
  return (
    <Box
      w={44}
      h={44}
      mb="md"
      style={{
        borderRadius: 12,
        background: 'var(--mantine-color-blue-0)',
        color: 'var(--mantine-color-blue-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </Box>
  );
}

const FEATURES: Feature[] = [
  {
    title: 'Шаринг по ссылке',
    text: 'Один клик — и у коллеги та же версия, тот же результат. Без «пришли файлом» и скриншотов кода.',
    icon: (
      <svg
        width={22}
        height={22}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    title: 'Встраивание на сайты',
    text: 'Живой сниппет в статье или уроке: читатель меняет код и запускает его, не покидая страницу.',
    icon: (
      <svg
        width={22}
        height={22}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    title: 'Совместное редактирование',
    text: 'Работайте над одним сниппетом всей командой: курсоры участников видны в реальном времени.',
    icon: (
      <svg
        width={22}
        height={22}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx={9} cy={7} r={4} />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function Features() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
      {FEATURES.map((f) => (
        <Card key={f.title} padding="xl" radius="lg" withBorder>
          <IconBadge>{f.icon}</IconBadge>
          <Title order={3} fz="lg" mb={6}>
            {f.title}
          </Title>
          <Text c="dimmed" fz="sm" lh={1.6}>
            {f.text}
          </Text>
        </Card>
      ))}
    </SimpleGrid>
  );
}
