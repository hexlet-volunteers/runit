import { Link } from 'react-router';
import { Anchor, Box, Container, Group, Text } from '@mantine/core';
import { RunitLogo } from '../../shared/ui';

// TODO: провести рефакторинг архитектуры (выделить в отдельную таску)
/** Компонент подвала сайта с навигационными ссылками и копирайтом. */
export default function AppFooter() {
  return (
    <Box component="footer" py={28} mt="auto" style={{ borderTop: '1px solid #e9ecef', background: '#fff' }}>
      <Container size="lg">
        <Group justify="space-between" wrap="wrap">
          <Group gap={10}>
            <RunitLogo size={22} />
            <Text c="dimmed" fz="sm">
              © 2026 ООО «Хекслет Рус»
            </Text>
          </Group>
          <Group gap="lg">
            <Anchor component={Link} to="/#features" c="dimmed" fz="sm">
              Возможности
            </Anchor>
            <Anchor component={Link} to="/embedding" c="dimmed" fz="sm">
              Встраивание
            </Anchor>
            <Anchor component={Link} to="/legal" c="dimmed" fz="sm">
              Условия использования
            </Anchor>
            {/*
              Ссылка на Политику обязана быть доступна с любой страницы без
              регистрации: оператор обеспечивает к ней неограниченный доступ
              (152-ФЗ, ст. 18.1 ч. 2). Подвал есть на всех страницах.
            */}
            <Anchor component={Link} to="/legal?tab=privacy" c="dimmed" fz="sm">
              Персональные данные
            </Anchor>
            <Anchor component={Link} to="/legal?tab=consent" c="dimmed" fz="sm">
              Согласие на обработку
            </Anchor>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
