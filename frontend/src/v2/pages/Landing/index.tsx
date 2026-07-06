import { Link } from 'react-router-dom';
import {
  Badge,
  Box,
  Button,
  Container,
  Group,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';
import DemoWidget from './DemoWidget';
import Features from './Features';
import Languages from './Languages';

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />

      <Box component="main" style={{ flex: 1, background: '#f8f9fa' }}>
        {/* HERO */}
        <Container size="lg" py={{ base: 48, sm: 72 }}>
          <Stack align="center" gap="lg">
            <Badge
              size="lg"
              variant="light"
              radius="xl"
              px={16}
              style={{ textTransform: 'none', fontWeight: 500 }}
              leftSection={
                <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
                </svg>
              }
            >
              Используется на платформах Хекслета
            </Badge>

            <Title
              order={1}
              ta="center"
              fz={{ base: 38, sm: 56 }}
              lh={1.1}
              maw={760}
            >
              Пишите и запускайте код{' '}
              <Text span inherit c="blue.6">
                прямо в браузере
              </Text>
            </Title>

            <Text ta="center" c="dimmed" fz={{ base: 'md', sm: 'lg' }} maw={640} lh={1.6}>
              Runit — среда для написания и выполнения кода. Делитесь по ссылке,
              встраивайте живые сниппеты в статьи и уроки, редактируйте вместе —
              в реальном времени.
            </Text>

            <Group gap="md" justify="center">
              <Button size="lg" component={Link} to="/editor">
                Создать сниппет
              </Button>
              {/* TODO(#843): страница «Как это встраивается» (гайд по embed) ещё не готова */}
              <Tooltip label="В разработке (#843)">
                <Button size="lg" variant="light" data-disabled onClick={(e) => e.preventDefault()}>
                  Как это встраивается →
                </Button>
              </Tooltip>
            </Group>

            {/* Живой мини-редактор */}
            <Box w="100%" maw={780} mt="xl">
              <DemoWidget />
            </Box>
          </Stack>
        </Container>

        {/* ФИЧИ */}
        <Container size="lg" py={{ base: 32, sm: 48 }}>
          <Features />
        </Container>

        {/* ЯЗЫКИ */}
        <Container size="lg" py={{ base: 32, sm: 48 }}>
          <Languages />
        </Container>

        {/* ФИНАЛЬНЫЙ CTA */}
        <Container size="lg" py={{ base: 48, sm: 72 }}>
          <Stack align="center" gap="md">
            <Title order={2} ta="center" fz={{ base: 26, sm: 32 }}>
              Готовы попробовать?
            </Title>
            <Text ta="center" c="dimmed" maw={520}>
              Создайте первый сниппет за минуту — без установки и настройки окружения.
            </Text>
            <Button size="lg" component={Link} to="/editor">
              Создать сниппет
            </Button>
          </Stack>
        </Container>
      </Box>

      <AppFooter />
    </div>
  );
}
