import {
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';

// TODO(#823, #824): настоящий менеджер пакетов (поиск по npm, установка,
// runit.lock). Пока модалка-заглушка со статичным списком популярных пакетов.

const POPULAR_PACKAGES = [
  { name: 'lodash', version: '4.17.21', description: 'Утилиты для работы с данными' },
  { name: 'axios', version: '1.7.2', description: 'HTTP-клиент' },
  { name: 'dayjs', version: '1.11.11', description: 'Даты и время, 2 КБ' },
  { name: 'zod', version: '3.23.8', description: 'Валидация схем' },
  { name: 'nanoid', version: '5.0.7', description: 'Генератор коротких ID' },
];

type Props = {
  opened: boolean;
  onClose: () => void;
};

export default function AddPackageModal({ opened, onClose }: Props) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius="lg"
      size="md"
      title={
        <Group gap="xs">
          <Text fw={800} fz="lg">
            Добавить пакет
          </Text>
          <Badge variant="light" color="gray" radius="sm" tt="lowercase">
            npm
          </Badge>
        </Group>
      }
    >
      <Stack gap="md">
        <TextInput placeholder="Название пакета…" />

        <Stack gap="sm">
          {POPULAR_PACKAGES.map((pkg) => (
            <Group key={pkg.name} justify="space-between" wrap="nowrap">
              <div>
                <Group gap={8}>
                  <Text ff="monospace" fw={700} fz="sm">
                    {pkg.name}
                  </Text>
                  <Text fz="xs" c="dimmed">
                    {pkg.version}
                  </Text>
                </Group>
                <Text fz="sm" c="dimmed">
                  {pkg.description}
                </Text>
              </div>
              <Tooltip label="В разработке (#823/#824)" withArrow>
                <Button variant="outline" size="xs" data-disabled onClick={(e) => e.preventDefault()}>
                  Установить
                </Button>
              </Tooltip>
            </Group>
          ))}
        </Stack>

        <Text fz="sm" c="dimmed">
          Менеджер пакетов появится позже (#823/#824). Версии будут фиксироваться
          в runit.lock и подтягиваться при каждом запуске.
        </Text>
      </Stack>
    </Modal>
  );
}
