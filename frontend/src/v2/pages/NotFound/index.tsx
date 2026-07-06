import { Link } from 'react-router-dom';
import { Box, Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';
import { editorColors } from '../../theme';

// TODO(#845): логировать 404-переходы и предлагать похожие публичные сниппеты
// (поиск по slug через trpc.snippets.getAllSnippets + fuzzy-match).

function TerminalCard() {
  return (
    <Box
      p="xl"
      maw={720}
      w="100%"
      style={{
        background: editorColors.bg,
        border: `1px solid ${editorColors.border}`,
        borderRadius: 16,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 15,
        lineHeight: 2,
        textAlign: 'left',
      }}
    >
      <Text ff="inherit" fz="inherit" style={{ color: editorColors.accent }}>
        $ runit open s/xK91q
      </Text>
      <Text ff="inherit" fz="inherit" style={{ color: editorColors.error }}>
        Ошибка 404: сниппет не найден
      </Text>
      <Text ff="inherit" fz="inherit" style={{ color: editorColors.dim }}>
        Процесс завершился с кодом 1
      </Text>
    </Box>
  );
}

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      <Container
        size="lg"
        style={{
          flex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Stack align="center" gap="lg" py={60}>
          <TerminalCard />
          <Title order={2} ta="center" mt="sm">
            Такой страницы нет
          </Title>
          <Text c="dimmed" ta="center" maw={520}>
            Возможно, автор сделал сниппет приватным, переименовал или удалил его. Проверьте
            ссылку — или начните с чистого листа.
          </Text>
          <Group gap="sm">
            <Button component={Link} to="/">
              На главную
            </Button>
            <Button component={Link} to="/snippets" variant="light">
              Мои сниппеты
            </Button>
          </Group>
        </Stack>
      </Container>
      <AppFooter />
    </div>
  );
}
