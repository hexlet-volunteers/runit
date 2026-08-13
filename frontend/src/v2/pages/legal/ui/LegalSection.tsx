import { Box, List, Stack, Text, Title } from '@mantine/core';
import type { Clause } from '../content';

/**
 * Пункт правового документа: заголовок, абзацы и списки.
 *
 * Списки выводятся списком, а не абзацем через запятые: перечни целей и данных
 * в Политике и Согласии читают выборочно — глазами ищут свой пункт.
 */
export default function LegalSection({ clause }: { clause: Clause }) {
  return (
    <Box>
      <Title order={4} mb={8}>
        {clause.title}
      </Title>
      <Stack gap="sm">
        {clause.blocks.map((block, index) =>
          typeof block === 'string' ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: абзацы не переупорядочиваются
            <Text key={index} c="dark.6" style={{ lineHeight: 1.65 }}>
              {block}
            </Text>
          ) : (
            <List
              // biome-ignore lint/suspicious/noArrayIndexKey: см. выше
              key={index}
              spacing={6}
              size="sm"
              c="dark.6"
              style={{ lineHeight: 1.65 }}
            >
              {block.list.map((item) => (
                <List.Item key={item}>{item}</List.Item>
              ))}
            </List>
          ),
        )}
      </Stack>
    </Box>
  );
}
