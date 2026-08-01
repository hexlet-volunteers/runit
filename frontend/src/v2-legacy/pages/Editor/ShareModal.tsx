import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Anchor,
  Button,
  Code,
  Divider,
  Group,
  Modal,
  SegmentedControl,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';

type Props = {
  opened: boolean;
  onClose: () => void;
  username: string;
  slug: string;
  saved: boolean;
};

function copyToClipboard(value: string, message: string) {
  navigator.clipboard
    .writeText(value)
    .then(() => notifications.show({ message, color: 'teal' }))
    .catch(() =>
      notifications.show({ message: 'Не удалось скопировать', color: 'red' }),
    );
}

export default function ShareModal({ opened, onClose, username, slug, saved }: Props) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [height, setHeight] = useState('380');

  const origin = window.location.origin;
  const pagePath = `/s/${username}/${slug}`;
  const shareUrl = `${origin}${pagePath}`;
  const embedCode = `<iframe src="${origin}/embed/${username}/${slug}?theme=${theme}&height=${height}" width="100%" height="${height}" style="border:0;border-radius:12px" title="Runit"></iframe>`;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={800} fz="lg">Поделиться сниппетом</Text>}
      centered
      radius="lg"
      size="lg"
    >
      <Stack gap="md">
        <Group justify="space-between" wrap="nowrap">
          <div>
            <Text fw={600}>Доступ по ссылке</Text>
            <Text fz="sm" c="dimmed">
              Просматривать могут все, у кого есть ссылка
            </Text>
          </div>
          {/* TODO(#643, #828): реальное управление приватностью — тумблер пока визуальный */}
          <Switch defaultChecked size="md" />
        </Group>

        <div>
          <Text fz={11} fw={700} c="dimmed" mb={6} style={{ letterSpacing: '0.08em' }}>
            ССЫЛКА
          </Text>
          <Group gap="sm" wrap="nowrap">
            <TextInput value={shareUrl} readOnly style={{ flex: 1 }} ff="monospace" />
            <Button
              variant="light"
              onClick={() => copyToClipboard(shareUrl, 'Ссылка скопирована')}
            >
              Копировать
            </Button>
          </Group>
          {!saved && (
            <Text fz="xs" c="dimmed" mt={4}>
              Ссылка станет активной после сохранения сниппета
            </Text>
          )}
        </div>

        <Divider />

        <div>
          <Text fz={11} fw={700} c="dimmed" mb={6} style={{ letterSpacing: '0.08em' }}>
            ВСТРОИТЬ НА САЙТ
          </Text>
          <Group gap="sm" mb="sm">
            <SegmentedControl
              value={theme}
              onChange={(v) => setTheme(v as 'dark' | 'light')}
              data={[
                { value: 'dark', label: 'Тёмная' },
                { value: 'light', label: 'Светлая' },
              ]}
            />
            <Select
              value={height}
              onChange={(v) => setHeight(v ?? '380')}
              data={[
                { value: '280', label: 'Высота 280' },
                { value: '380', label: 'Высота 380' },
                { value: '520', label: 'Высота 520' },
              ]}
              w={150}
              allowDeselect={false}
            />
          </Group>
          {/* TODO(#841): опции «Показывать результат / Только чтение / Автозапуск» для embed */}
          <Code block style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {embedCode}
          </Code>
          <Group justify="space-between" mt="sm">
            <Text fz="sm" c="dimmed">
              Код обновляется при смене настроек
            </Text>
            <Button
              variant="default"
              onClick={() => copyToClipboard(embedCode, 'Код для вставки скопирован')}
            >
              Копировать код
            </Button>
          </Group>
        </div>

        <Divider />

        <Group justify="space-between">
          <Anchor component={Link} to={pagePath} fw={600}>
            Страница сниппета →
          </Anchor>
          <Button onClick={onClose}>Готово</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
