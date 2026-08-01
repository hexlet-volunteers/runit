import { Box, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { langMeta } from '../../theme';
import { sampleCode } from './lib';

const EXAMPLE_LANGS = ['javascript', 'python', 'php'] as const;

type Props = {
  onCreateClick: () => void;
  onCreateExample: (language: string) => void;
  creating: boolean;
};

export default function EmptyState({ onCreateClick, onCreateExample, creating }: Props) {
  return (
    <Stack align="center" gap="lg" py={64}>
      <Title order={2} ta="center">
        Создайте первый сниппет
      </Title>
      <Text c="dimmed" ta="center" maw={480}>
        Пишите, запускайте и делитесь кодом прямо в браузере. Один клик — и у вас есть
        ссылка, которую можно отправить ученикам или коллегам.
      </Text>
      <Button size="md" onClick={onCreateClick}>
        + Новый сниппет
      </Button>

      <Group gap="sm" mt="md" w="100%" maw={640} wrap="nowrap">
        <Box style={{ flex: 1, height: 1, background: '#e9ecef' }} />
        <Text c="dimmed" fz="xs" fw={700} style={{ letterSpacing: 1, whiteSpace: 'nowrap' }}>
          ИЛИ НАЧНИТЕ С ПРИМЕРА
        </Text>
        <Box style={{ flex: 1, height: 1, background: '#e9ecef' }} />
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" w="100%" maw={760}>
        {EXAMPLE_LANGS.map((lang) => {
          const meta = langMeta[lang];
          const firstLine = (sampleCode[lang] ?? '').split('\n')[0];
          return (
            <Paper
              key={lang}
              withBorder
              radius="lg"
              p="md"
              component="button"
              type="button"
              disabled={creating}
              onClick={() => onCreateExample(lang)}
              style={{
                cursor: creating ? 'wait' : 'pointer',
                textAlign: 'left',
                background: '#fff',
              }}
            >
              <Group gap={8} mb={8}>
                <Box w={10} h={10} style={{ borderRadius: '50%', background: meta.dot }} />
                <Text fw={600}>{meta.label}</Text>
              </Group>
              <Text c="dimmed" fz="xs" ff="monospace" lineClamp={2}>
                {firstLine}
              </Text>
            </Paper>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
