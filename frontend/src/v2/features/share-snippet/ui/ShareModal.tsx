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
import { copyToClipboard } from '../../../shared/lib';
import { useTRPCClient } from '../../../shared/api';
import { type Props } from '..'

/** Модальное окно со ссылкой на сниппет и кодом для встраивания на сайт. */
export default function ShareModal({
  opened,
  onClose,
  username,
  slug,
  saved,
  snippetId,
  shortCode,
  visibility,
}: Props) {
  const trpc = useTRPCClient();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [height, setHeight] = useState('380');
  // Оптимистичное состояние тумблера: сервер подтверждает мутацией.
  const [shared, setShared] = useState((visibility ?? 'private') !== 'private');
  const [saving, setSaving] = useState(false);

  const origin = window.location.origin;
  // Короткая ссылка — основная: её удобно диктовать, и по ней работает
  // встраивание по ссылке (oEmbed). Путь с username/slug остаётся рабочим.
  const pagePath = shortCode ? `/s/${shortCode}` : `/s/${username}/${slug}`;
  const shareUrl = `${origin}${pagePath}`;
  const embedSrc = shortCode
    ? `${origin}/embed/s/${shortCode}?theme=${theme}&height=${height}`
    : `${origin}/embed/${username}/${slug}?theme=${theme}&height=${height}`;
  const embedCode = `<iframe src="${embedSrc}" width="100%" height="${height}" style="border:0;border-radius:12px" title="Runit"></iframe>`;

  /** Публикация и снятие публикации. */
  const toggleShared = async (next: boolean) => {
    if (snippetId == null) return;
    setShared(next);
    setSaving(true);
    try {
      await trpc.snippets.setVisibility.mutate({
        id: snippetId,
        visibility: next ? 'link' : 'private',
      });
      notifications.show({
        message: next ? 'Сниппет доступен по ссылке' : 'Сниппет снова приватный',
      });
    } catch {
      setShared(!next);
      notifications.show({ message: 'Не удалось изменить доступ', color: 'red' });
    } finally {
      setSaving(false);
    }
  };

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
              {shared
                ? 'Просматривать могут все, у кого есть ссылка'
                : 'Сниппет приватный — ссылка и встраивание не работают'}
            </Text>
          </div>
          <Switch
            size="md"
            checked={shared}
            disabled={saving || snippetId == null}
            onChange={(event) => toggleShared(event.currentTarget.checked)}
          />
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

        {/* Встраивание по ссылке (oEmbed) — как у YouTube: площадка сама
            разворачивает ссылку в виджет, iframe писать не нужно. */}
        <div>
          <Text fz={11} fw={700} c="dimmed" mb={6} style={{ letterSpacing: '0.08em' }}>
            ИЛИ ПРОСТО ВСТАВЬТЕ ССЫЛКУ
          </Text>
          <Text fz="sm" c="dimmed" mb="xs">
            В WordPress, Notion, Discourse и мессенджерах достаточно вставить ссылку на
            сниппет — виджет появится сам, без кода. Ссылка та же, что выше.
          </Text>
          <Group gap="sm" wrap="nowrap">
            <TextInput value={shareUrl} readOnly style={{ flex: 1 }} ff="monospace" />
            <Button
              variant="light"
              disabled={!shared}
              onClick={() => copyToClipboard(shareUrl, 'Ссылка скопирована')}
            >
              Копировать
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
