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
import { IconDice5 } from '@tabler/icons-react';
import { langMeta } from '../../../shared/theme';
import FieldLabel from './FieldLabel';
import { VISIBILITY_HINTS, type Props, useCreateSnippet } from '..';

/** Модальное окно создания нового сниппета с выбором языка, видимости и генерацией названия. */
export default function NewSnippetModal({ opened, onClose }: Props) {
  const { 
    name,
    setName,
    language,
    setLanguage,
    visibility,
    setVisibility,
    withExample,
    setWithExample,
    rolling,
    rollName,
    createMutation,
  } = useCreateSnippet({ opened, onClose })

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
              c="dimmed"
            >
              <IconDice5 size={20}/>
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
