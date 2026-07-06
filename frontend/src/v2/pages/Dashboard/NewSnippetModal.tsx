import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Modal,
  SegmentedControl,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { langMeta } from '../../theme';
import { useSession } from '../../session';
import { useTRPCClient } from '../../../utils/trpc';
import { sampleCode, SNIPPETS_QUERY_KEY } from './lib';

function FieldLabel({ children }: { children: string }) {
  return (
    <Text fz="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: 0.8 }}>
      {children}
    </Text>
  );
}

const VISIBILITY_HINTS: Record<string, string> = {
  private: 'Виден только вам',
  link: 'Доступен всем, у кого есть ссылка',
  public: 'Виден в вашем профиле и в поиске',
};

type Props = {
  opened: boolean;
  onClose: () => void;
};

export default function NewSnippetModal({ opened, onClose }: Props) {
  const trpc = useTRPCClient();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useSession();

  const [name, setName] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [visibility, setVisibility] = useState('link');
  const [withExample, setWithExample] = useState(true);
  const [rolling, setRolling] = useState(false);

  const rollName = async () => {
    setRolling(true);
    try {
      const generated = await trpc.snippets.generateSnippetName.query();
      setName(generated.name);
    } catch {
      notifications.show({ message: 'Не удалось сгенерировать имя', color: 'red' });
    } finally {
      setRolling(false);
    }
  };

  // При открытии — сброс формы и сразу сгенерированное имя, как в макете.
  useEffect(() => {
    if (!opened) return;
    setLanguage('javascript');
    setVisibility('link');
    setWithExample(true);
    setName('');
    rollName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const createMutation = useMutation({
    mutationFn: () =>
      trpc.snippets.createSnippet.mutate({
        name: name.trim(),
        code: withExample ? (sampleCode[language] ?? '') : '',
        language,
        userId: user!.id,
      }),
    onSuccess: (created: { id: number }) => {
      queryClient.invalidateQueries({ queryKey: SNIPPETS_QUERY_KEY });
      onClose();
      navigate(`/editor/${created.id}`);
    },
    onError: () => {
      notifications.show({ message: 'Не удалось создать сниппет', color: 'red' });
    },
  });

  // TODO(#641): реальный выбор версии среды исполнения; пока статичное значение.
  const envOptions =
    language === 'javascript'
      ? ['Node.js 20 LTS']
      : [`${langMeta[language]?.label ?? language} — стандартная среда`];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Text fw={800} fz="xl">
          Новый сниппет
        </Text>
      }
      radius="lg"
      size="lg"
      centered
    >
      <Stack gap="md">
        <Stack gap={6}>
          <FieldLabel>Название</FieldLabel>
          <Group gap="xs" wrap="nowrap">
            <TextInput
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="имя-сниппета"
              style={{ flex: 1 }}
              data-autofocus
            />
            <ActionIcon
              size="lg"
              variant="default"
              radius="md"
              onClick={rollName}
              loading={rolling}
              aria-label="Сгенерировать название"
            >
              🎲
            </ActionIcon>
          </Group>
        </Stack>

        <Stack gap={6}>
          <FieldLabel>Язык</FieldLabel>
          <SimpleGrid cols={3} spacing="xs">
            {Object.entries(langMeta).map(([key, meta]) => {
              const active = key === language;
              return (
                <UnstyledButton
                  key={key}
                  onClick={() => setLanguage(key)}
                  px="sm"
                  py={10}
                  style={{
                    border: active
                      ? '2px solid var(--mantine-color-blue-5)'
                      : '1px solid #dee2e6',
                    background: active ? 'var(--mantine-color-blue-0)' : '#fff',
                    borderRadius: 10,
                  }}
                >
                  <Group gap={8} wrap="nowrap">
                    <Box
                      w={10}
                      h={10}
                      style={{ borderRadius: '50%', background: meta.dot, flexShrink: 0 }}
                    />
                    <Text fz="sm" fw={active ? 700 : 500}>
                      {meta.label}
                    </Text>
                  </Group>
                </UnstyledButton>
              );
            })}
          </SimpleGrid>
        </Stack>

        <Stack gap={6}>
          <FieldLabel>Версия среды</FieldLabel>
          <Select data={envOptions} value={envOptions[0]} allowDeselect={false} />
        </Stack>

        <Stack gap={6}>
          {/* TODO(#828): реальное поле видимости на сервере; пока только визуально. */}
          <FieldLabel>Видимость</FieldLabel>
          <SegmentedControl
            fullWidth
            value={visibility}
            onChange={setVisibility}
            data={[
              { label: 'Приватный', value: 'private' },
              { label: 'По ссылке', value: 'link' },
              { label: 'Публичный', value: 'public' },
            ]}
          />
          <Text c="dimmed" fz="sm">
            {VISIBILITY_HINTS[visibility]}
          </Text>
        </Stack>

        <Group justify="space-between" wrap="nowrap" mt={4}>
          <Box>
            <Text fw={600}>Начать с примера кода</Text>
            <Text c="dimmed" fz="sm">
              Стартовый пример для выбранного языка вместо пустого файла
            </Text>
          </Box>
          <Switch
            size="md"
            checked={withExample}
            onChange={(e) => setWithExample(e.currentTarget.checked)}
            aria-label="Начать с примера кода"
          />
        </Group>

        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            loading={createMutation.isPending}
            disabled={!name.trim()}
          >
            Создать сниппет
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
