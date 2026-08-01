import {
  CloseButton,
  Group,
  Title,
} from '@mantine/core';
import { RunitLogo } from '../../../shared/ui';

export default function FormHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Group gap="sm" wrap="nowrap">
        <RunitLogo size={32} />
        <Title order={3}>{title}</Title>
      </Group>
      <CloseButton aria-label="Закрыть" onClick={onClose} />
    </Group>
  );
}