import { Box, Group, Text, Title } from '@mantine/core';
import { langMeta } from '../../theme';

// Чипы «10 языков — из коробки». В MVP реально исполняется только JavaScript,
// остальные чипы — просто витрина (это ок по макету).
// TODO(#843): когда появится серверное исполнение (#821), пометить runnable-языки.
const LANGS: { label: string; dot: string }[] = [
  { label: 'JavaScript', dot: langMeta.javascript.dot },
  { label: 'TypeScript', dot: langMeta.typescript.dot },
  { label: 'Python', dot: langMeta.python.dot },
  { label: 'PHP', dot: langMeta.php.dot },
  { label: 'Ruby', dot: langMeta.ruby.dot },
  { label: 'Java', dot: langMeta.java.dot },
  { label: 'Go', dot: '#00ADD8' },
  { label: 'C++', dot: '#f34b7d' },
  { label: 'SQL', dot: '#e38c00' },
  { label: 'Bash', dot: '#89e051' },
];

export default function Languages() {
  return (
    <Box ta="center">
      <Title order={2} fz={{ base: 26, sm: 32 }} mb="xs">
        10 языков — из коробки
      </Title>
      <Text c="dimmed" mb="xl">
        Выбирайте язык при создании сниппета — окружение уже настроено.
      </Text>
      <Group justify="center" gap="sm">
        {LANGS.map((lang) => (
          <Group
            key={lang.label}
            gap={8}
            px={16}
            py={8}
            style={{
              border: '1px solid #e9ecef',
              borderRadius: 999,
              background: '#fff',
            }}
          >
            <Box w={8} h={8} style={{ borderRadius: '50%', background: lang.dot }} />
            <Text fz="sm" fw={500}>
              {lang.label}
            </Text>
          </Group>
        ))}
      </Group>
    </Box>
  );
}
