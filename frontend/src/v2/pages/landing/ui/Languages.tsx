import { Box, Group, Text, Title } from '@mantine/core';
import { langMeta } from '../../../shared/theme';

/**
 * Чипы языков на лендинге.
 *
 * Список совпадает с тем, что редактор действительно умеет: девять языков
 * исполняются на сервере в docker-контейнере, JavaScript — в браузере, а HTML и
 * CSS показываются превью. Раньше здесь было десять чипов и оговорка «реально
 * исполняется только JavaScript» — она устарела, серверный раннер работает и
 * проверяется смоуком в CI на каждом PR.
 *
 * Разметка выделена отдельной группой: обещать «исполнение» HTML и CSS
 * неправильно — их не запускают, а отображают.
 */
const CODE_LANGS: { label: string; dot: string }[] = [
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

const MARKUP_LANGS: { label: string; dot: string }[] = [
  { label: 'HTML', dot: langMeta.html.dot },
  { label: 'CSS', dot: langMeta.css.dot },
];

function Chip({ label, dot }: { label: string; dot: string }) {
  return (
    <Group
      gap={8}
      px={16}
      py={8}
      style={{
        border: '1px solid #e9ecef',
        borderRadius: 999,
        background: '#fff',
      }}
    >
      <Box w={8} h={8} style={{ borderRadius: '50%', background: dot }} />
      <Text fz="sm" fw={500}>
        {label}
      </Text>
    </Group>
  );
}

export default function Languages() {
  return (
    <Box ta="center">
      <Title order={2} fz={{ base: 26, sm: 32 }} mb="xs">
        12 языков — из коробки
      </Title>
      <Text c="dimmed" mb="xl">
        Выбирайте язык при создании сниппета — окружение уже настроено.
      </Text>
      <Group justify="center" gap="sm">
        {CODE_LANGS.map((lang) => (
          <Chip key={lang.label} label={lang.label} dot={lang.dot} />
        ))}
      </Group>
      <Text c="dimmed" fz="sm" mt="xl" mb="sm">
        А вёрстку видно сразу — HTML и CSS открываются в превью:
      </Text>
      <Group justify="center" gap="sm">
        {MARKUP_LANGS.map((lang) => (
          <Chip key={lang.label} label={lang.label} dot={lang.dot} />
        ))}
      </Group>
    </Box>
  );
}
