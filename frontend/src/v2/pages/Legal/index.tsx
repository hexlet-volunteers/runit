import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Group,
  Paper,
  Stack,
  Tabs,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import AppHeader from '../../components/AppHeader';
import AppFooter from '../../components/AppFooter';

type LegalTab = 'terms' | 'privacy';

function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Title order={4} mb={6}>
        {title}
      </Title>
      <Text c="dark.6" style={{ lineHeight: 1.65 }}>
        {children}
      </Text>
    </Box>
  );
}

const termsSections: Array<{ title: string; body: string }> = [
  {
    title: '1. О сервисе',
    body:
      'Runit («Сервис») — среда для написания, выполнения и распространения кода: сниппеты ' +
      'можно редактировать онлайн, публиковать по ссылке и встраивать на сторонние сайты. ' +
      'Правообладатель Сервиса — ООО «Хекслет Рус».',
  },
  {
    title: '2. Аккаунт',
    body:
      'Для сохранения сниппетов, шаринга и совместного редактирования нужна учётная запись. ' +
      'Вы отвечаете за сохранность данных для входа и за действия, совершённые в вашем аккаунте.',
  },
  {
    title: '3. Ваш контент',
    body:
      'Права на код остаются за вами. Публикуя сниппет по ссылке или через виджет встраивания, ' +
      'вы разрешаете неограниченному кругу лиц просматривать, запускать и форкать его.',
  },
  {
    title: '4. Ограничения',
    body:
      'Запрещено использовать среду выполнения для вредоносного кода, майнинга, сетевых атак ' +
      'и обхода ресурсных лимитов. Нарушение ведёт к блокировке сниппета или аккаунта.',
  },
  {
    title: '5. Гарантии и ответственность',
    body:
      'Сервис предоставляется «как есть». Мы стремимся к непрерывной доступности, но не ' +
      'отвечаем за убытки из-за перерывов в работе. Ответственность Сервиса в любом случае ' +
      'ограничена суммой, фактически уплаченной вами за использование Сервиса. ' +
      'Вопросы — support@hexlet.io.',
  },
];

const privacySections: Array<{ title: string; body: string }> = [
  {
    title: '1. Какие данные мы храним',
    body:
      'Мы храним минимум: адрес электронной почты, имя пользователя и созданные вами сниппеты ' +
      '(код, название, язык, даты изменений). Платёжные данные и телефон мы не запрашиваем.',
  },
  {
    title: '2. Cookies и сессии',
    body:
      'Cookies используются только для поддержания сессии входа и запоминания настроек ' +
      'интерфейса. Рекламных и сторонних трекинговых cookies Сервис не устанавливает.',
  },
  {
    title: '3. Кому мы не передаём данные',
    body:
      'Мы не продаём и не передаём ваши данные третьим лицам, за исключением случаев, прямо ' +
      'предусмотренных законодательством. Публичными являются только сниппеты, которыми вы ' +
      'сами поделились по ссылке.',
  },
  {
    title: '4. Ваши права',
    body:
      'Вы можете в любой момент изменить или удалить свои сниппеты, а также удалить аккаунт ' +
      'целиком — вместе с ним будут удалены все связанные данные.',
  },
  {
    title: '5. Контакт',
    body:
      'По вопросам обработки персональных данных пишите на support@hexlet.io — ответим ' +
      'в течение 10 рабочих дней.',
  },
];

export default function LegalPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const tab: LegalTab = rawTab === 'privacy' ? 'privacy' : 'terms';

  const handleTabChange = (value: string | null) => {
    const next: LegalTab = value === 'privacy' ? 'privacy' : 'terms';
    setSearchParams(next === 'terms' ? {} : { tab: next }, { replace: true });
  };

  const sections = tab === 'privacy' ? privacySections : termsSections;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppHeader />
      <Container size="lg" py={40} style={{ flex: 1, width: '100%' }}>
        <Box maw={900} mx="auto">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <Box>
              <Title order={1}>Правовая информация</Title>
              <Text c="dimmed" mt={4}>
                Редакция от 12 мая 2026 года · ООО «Хекслет Рус»
              </Text>
            </Box>
            {/* TODO(#844): экспорт правовых документов в PDF (генерация на бэкенде). */}
            <Tooltip label="В разработке (#844)">
              <Button variant="light" color="gray" data-disabled onClick={(e) => e.preventDefault()}>
                Скачать PDF
              </Button>
            </Tooltip>
          </Group>

          <Tabs value={tab} onChange={handleTabChange} mt="xl">
            <Tabs.List>
              <Tabs.Tab value="terms">Условия использования</Tabs.Tab>
              <Tabs.Tab value="privacy">Конфиденциальность</Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <Paper withBorder radius="lg" p={{ base: 'lg', sm: 36 }} mt="lg">
            <Stack gap="xl">
              {sections.map((s) => (
                <LegalSection key={s.title} title={s.title}>
                  {s.body}
                </LegalSection>
              ))}
            </Stack>
          </Paper>
        </Box>
      </Container>
      <AppFooter />
    </div>
  );
}
