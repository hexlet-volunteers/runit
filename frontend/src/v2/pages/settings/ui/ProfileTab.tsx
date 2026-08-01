import { useState } from 'react';import {
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
import { initialsOf } from '../../../shared/lib';
import { useSession } from '../../../entities/user';

/** Вкладка «Профиль»: аватар, имя, username, био. */
export default function ProfileTab() {
  const { user } = useSession();
  const [name, setName] = useState('');
  const [username, setUsername] = useState(user?.username ?? '');
  const [about, setAbout] = useState('');

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

        <TextInput
          label="Имя"
          placeholder="Как вас зовут"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <TextInput
          label="Имя пользователя"
          leftSection={
            <Text fz="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
              runit.hexlet.io/@
            </Text>
          }
          leftSectionWidth={140}
          styles={{ input: { paddingLeft: 140 } }}
          value={username}
          onChange={(e) => setUsername(e.currentTarget.value)}
        />
        <Textarea
          label="О себе"
          placeholder="Пара слов о том, чем занимаетесь"
          minRows={3}
          autosize
          value={about}
          onChange={(e) => setAbout(e.currentTarget.value)}
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