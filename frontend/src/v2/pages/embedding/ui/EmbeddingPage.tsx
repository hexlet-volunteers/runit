import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Anchor,
  Avatar,
  Box,
  Button,
  Code,
  Container,
  Group,
  Paper,
  Text,
  Title,
} from '@mantine/core';
import { EMBED_VARIANTS, type EmbedVariant } from '../lib/demoSnippet';
import EmbeddedWidget from './EmbeddedWidget';

// Страница-демонстрация: как виджет Runit выглядит внутри страницы урока
// Хекслета (docs/design/embed.png). Открывается с лендинга по кнопке
// «Как это встраивается →».

/** Верхняя панель демо: возврат в Runit и переключатель варианта виджета. */
function DemoBar({
  variant,
  onVariantChange,
}: {
  variant: EmbedVariant;
  onVariantChange: (value: EmbedVariant) => void;
}) {
  return (
    <Container size="lg" py="md">
      <Group
        maw={1000}
        mx="auto"
        justify="center"
        gap="lg"
        px="md"
        py={10}
        wrap="wrap"
        style={{
          border: '1px dashed #ced4da',
          borderRadius: 12,
          background: 'rgba(255, 255, 255, 0.6)',
        }}
      >
        <Button component={Link} to="/" variant="default" radius="md" size="sm">
          ← Вернуться в Runit
        </Button>

        <Text c="dimmed" fz="sm">
          Демо: виджет Runit в уроке Хекслета · вариант
        </Text>

        <Group gap={4}>
          {EMBED_VARIANTS.map((item) => (
            <Button
              key={item.value}
              size="compact-sm"
              radius="md"
              variant={variant === item.value ? 'white' : 'subtle'}
              color={variant === item.value ? 'dark' : 'gray'}
              fw={variant === item.value ? 700 : 500}
              onClick={() => onVariantChange(item.value)}
              style={
                variant === item.value
                  ? { border: '1px solid #dee2e6', boxShadow: '0 1px 2px rgba(0,0,0,.06)' }
                  : undefined
              }
            >
              {item.label}
            </Button>
          ))}
        </Group>
      </Group>
    </Container>
  );
}

/** Шапка «чужого» сайта — имитация Хекслета, чтобы виджет был в контексте. */
function HexletHeader() {
  return (
    <Group
      justify="space-between"
      px={{ base: 'md', sm: 40 }}
      py="md"
      style={{ background: '#1a1b26' }}
      wrap="nowrap"
    >
      <Group gap={28} wrap="nowrap">
        <Text fw={800} fz="lg" c="#fff">
          Хекслет
        </Text>
        {['Курсы', 'Программы', 'Сообщество'].map((item) => (
          <Text key={item} fz="sm" c="rgba(255,255,255,.75)" visibleFrom="sm">
            {item}
          </Text>
        ))}
      </Group>
      <Avatar radius="xl" size={34} color="orange" variant="filled">
        ВЛ
      </Avatar>
    </Group>
  );
}

export default function EmbeddingPage() {
  const [variant, setVariant] = useState<EmbedVariant>('card');

  return (
    <div style={{ minHeight: '100vh', background: '#eef0f4' }}>
      <DemoBar variant={variant} onVariantChange={setVariant} />

      <Container size="lg" pb={64}>
        {/* Имитация страницы урока на сайте Хекслета */}
        <Paper radius="lg" shadow="md" style={{ overflow: 'hidden' }}>
          <HexletHeader />

          <Box px={{ base: 'md', sm: 40 }} py={{ base: 'lg', sm: 40 }} bg="#fff">
            <Box maw={720}>
              <Text fw={600} c="blue.6" mb="xs">
                JavaScript: Функции · Урок 7 из 12
              </Text>

              <Title order={1} fz={{ base: 30, sm: 38 }} mb="lg">
                Стрелочные функции
              </Title>

              <Text mb="lg" fz="md" lh={1.7} c="dark.6">
                В прошлом уроке мы объявляли функции через ключевое слово <Code>function</Code>.
                В современном JavaScript чаще используют стрелочные функции — компактный
                синтаксис, который особенно удобен для колбэков.
              </Text>

              <Title order={2} fz="xl" mt="xl" mb="sm">
                Синтаксис
              </Title>

              <Text mb="lg" fz="md" lh={1.7} c="dark.6">
                Стрелочная функция — это список параметров, стрелка <Code>⇒</Code> и тело.
                Если тело состоит из одного выражения, его результат возвращается
                автоматически, без <Code>return</Code>:
              </Text>

              {/* Собственно встроенный виджет Runit */}
              <Box my="xl">
                <EmbeddedWidget variant={variant} />
              </Box>

              <Text mb="lg" fz="md" lh={1.7} c="dark.6">
                <Code>greet</Code> — обычная константа, в которой лежит функция. Её можно
                передавать в другие функции, возвращать и хранить в структурах данных.
              </Text>

              <Group
                gap="sm"
                align="flex-start"
                wrap="nowrap"
                p="md"
                mt="xl"
                style={{ background: 'var(--mantine-color-blue-0)', borderRadius: 12 }}
              >
                <Text c="blue.6" fz="lg" lh={1}>
                  ⓘ
                </Text>
                <Text fz="sm" lh={1.6} c="dark.6">
                  Код в примере живой: замените имя в массиве <Code>names</Code> и нажмите
                  «Запустить» — он выполнится по-настоящему.
                </Text>
              </Group>

              {/* Навигация по урокам «чужого» сайта */}
              <Group justify="space-between" mt={40} wrap="wrap" gap="sm">
                <Button variant="default" radius="md">
                  ← Функции как данные
                </Button>
                <Button radius="md">Далее: Замыкания →</Button>
              </Group>
            </Box>
          </Box>
        </Paper>

        {/* Пояснение уже от лица Runit — зачем это нужно автору курса */}
        <Group justify="center" mt="xl">
          <Text ta="center" c="dimmed" fz="sm" maw={640}>
            Так выглядит сниппет Runit, встроенный в страницу урока: читатель меняет код и
            запускает его, не покидая сайт. Код для вставки берётся в редакторе — кнопка
            «Поделиться» → «Встроить на сайт».{' '}
            <Anchor component={Link} to="/editor">
              Попробовать в редакторе
            </Anchor>
          </Text>
        </Group>
      </Container>
    </div>
  );
}
