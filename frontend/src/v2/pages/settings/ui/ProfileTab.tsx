import {
  Alert,
  Avatar,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Tooltip,
  TextInput,
  Textarea,
} from '@mantine/core';
import { initialsOf, publicBaseUrl } from '../../../shared/lib';
import { useSession } from '../../../entities/user';

/**
 * Вкладка «Профиль»: аватар, имя, username, био.
 *
 * Поля неактивны намеренно. Сохранения профиля на сервере пока нет (#718/#832),
 * а поля были обычными: человек правил имя, нажимал «Сохранить» (кнопка тоже
 * заглушка) и уходил, считая, что изменения приняты. Пустое поле, в которое
 * нельзя ввести, честнее поля, которое молча забывает ввод.
 */
export default function ProfileTab() {
  const { user } = useSession();
  /**
   * Адрес профиля показывается настоящий. Раньше здесь был текст
   * «runit.hexlet.io/@» — и домен прибит в код (на стейджинге он другой), и
   * такого адреса не существует: профиль живёт по /u/:username.
   */
  const profilePrefix = `${publicBaseUrl().replace(/^https?:\/\//, '')}/u/`;

  return (
    <Card withBorder radius="lg" p="xl" mt="lg">
      <Stack gap="lg">
        <Group gap="lg">
          <Avatar color="blue" radius="xl" size={72}>
            {initialsOf(user?.username ?? '')}
          </Avatar>
          <Group gap="sm">
            {/* TODO(#536): загрузка аватара (сейчас — только инициалы) */}
            <Tooltip label="В разработке (#536)">
              <Button
                variant="default"
                data-disabled
                onClick={(e) => e.preventDefault()}
              >
                Загрузить фото
              </Button>
            </Tooltip>
            <Tooltip label="В разработке (#536)">
              <Button
                variant="subtle"
                color="red"
                data-disabled
                onClick={(e) => e.preventDefault()}
              >
                Удалить
              </Button>
            </Tooltip>
          </Group>
        </Group>

        <Alert color="gray" radius="md">
          <Text fz="sm">
            Редактирование профиля пока не работает — изменения не сохранятся
            (#718/#832). Имя пользователя ниже — текущее.
          </Text>
        </Alert>

        <TextInput
          label="Имя"
          placeholder="Как вас зовут"
          value=""
          disabled
        />
        <TextInput
          label="Имя пользователя"
          leftSection={
            <Text fz="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
              {profilePrefix}
            </Text>
          }
          leftSectionWidth={160}
          styles={{ input: { paddingLeft: 160 } }}
          value={user?.username ?? ''}
          disabled
        />
        <Textarea
          label="О себе"
          placeholder="Пара слов о том, чем занимаетесь"
          minRows={3}
          autosize
          value=""
          disabled
        />

        <Group justify="flex-end">
          {/* TODO(#718, #832): сохранение профиля (имя, био) на сервере */}
          <Tooltip label="В разработке (#718/#832)">
            <Button data-disabled onClick={(e) => e.preventDefault()}>
              Сохранить
            </Button>
          </Tooltip>
        </Group>
      </Stack>
    </Card>
  );
}