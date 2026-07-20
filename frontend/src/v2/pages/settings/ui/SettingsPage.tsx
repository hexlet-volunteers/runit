import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Tabs,
  Title,
} from '@mantine/core';

import { useSession } from '../../../entities/user';
import { AppHeader } from '../../../widgets/header';
import { AppFooter } from '../../../widgets/footer';
import ProfileTab from './ProfileTab';
import EditorTab from './EditorTab';
import AccountTab from './AccountTab';

/** Страница настроек /settings. Три вкладки: Профиль, Редактор, Аккаунт. Редиректит гостей на /. */
export default function SettingsPage() {
  const { isGuest } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (isGuest) navigate('/', { replace: true });
  }, [isGuest, navigate]);

  if (isGuest) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      <Container size="lg" py="xl" style={{ width: '100%' }}>
        <Box maw={760} mx="auto">
          <Title order={1} mb="lg">
            Настройки
          </Title>
          <Tabs defaultValue="profile">
            <Tabs.List>
              <Tabs.Tab value="profile">Профиль</Tabs.Tab>
              <Tabs.Tab value="editor">Редактор</Tabs.Tab>
              <Tabs.Tab value="account">Аккаунт</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="profile">
              <ProfileTab />
            </Tabs.Panel>
            <Tabs.Panel value="editor">
              <EditorTab />
            </Tabs.Panel>
            <Tabs.Panel value="account">
              <AccountTab />
            </Tabs.Panel>
          </Tabs>
        </Box>
      </Container>
      <AppFooter />
    </div>
  );
}
