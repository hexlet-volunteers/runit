import { Link } from 'react-router';
import { Button, Tooltip, ActionIcon, Group } from '@mantine/core';

import { IconSettings, IconPlus, IconBell } from '@tabler/icons-react';

/** Меню кабинета: «+ Новый сниппет», колокольчик-заглушка уведомлений и шестерёнка настроек. */
export default function CabinetMenu() {
  return (
    <Group gap="lg">
      <Button component={Link} to="/editor">
        <Group gap="sm">
          <IconPlus size={14} /> Новый сниппет
        </Group>
      </Button>
      <Tooltip label="Уведомления появятся позже" withArrow>
        <ActionIcon
          aria-label="Уведомления"
          data-disabled
          onClick={(e) => e.preventDefault()}
          variant="subtle"
        >
          <IconBell color="gray" />
        </ActionIcon>
      </Tooltip>
      <ActionIcon
        aria-label="Настройки"
        component={Link}
        to="/settings"
        variant="transparent"
      >
        <IconSettings color="gray" />
      </ActionIcon>
    </Group>
  );
}
