import { UnstyledButton } from '@mantine/core';
import { editorColors } from '../../../shared/theme';

export default function TabButton({
  active,
  label,
  onClick,
  title,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  /** Подсказка при наведении: объясняет назначение вкладки. */
  title?: string;
}) {
  return (
    <UnstyledButton
      onClick={onClick}
      title={title}
      px={4}
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.08em',
        color: active ? editorColors.text : editorColors.dim,
        borderBottom: `2px solid ${active ? editorColors.accent : 'transparent'}`,
      }}
    >
      {label}
    </UnstyledButton>
  );
}