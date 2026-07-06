import { Link } from 'react-router-dom';
import { Anchor, Box, Container, Group, Text } from '@mantine/core';
import { RunitLogo } from './AppHeader';

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
            <Anchor component={Link} to="/" c="dimmed" fz="sm">
              Возможности
            </Anchor>
            <Anchor component={Link} to="/" c="dimmed" fz="sm">
              Встраивание
            </Anchor>
            <Anchor component={Link} to="/legal" c="dimmed" fz="sm">
              Условия использования
            </Anchor>
            <Anchor component={Link} to="/legal?tab=privacy" c="dimmed" fz="sm">
              Конфиденциальность
            </Anchor>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
