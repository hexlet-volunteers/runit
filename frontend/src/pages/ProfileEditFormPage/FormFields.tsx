import {
  TextInput,
  PasswordInput,
  Group,
  Stack,
  Space,
  Anchor,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { EditFormFieldsProps } from '../../types/components';

function FormFields({
  form,
  emailConfirmed = false,
  isSubmitting = false,
}: EditFormFieldsProps) {
  const { t: profileEditText } = useTranslation('translation', {
    keyPrefix: 'profileEdit',
  });

  return (
    <>
      <Stack
        align="stretch"
        gap="xl"
        justify="flex-start"
        style={{ fontSize: '14px' }}
      >
        <Group grow justify="flex-start">
          <TextInput
            disabled={isSubmitting}
            label={profileEditText('name')}
            radius="lg"
            size="md"
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...form.getInputProps('name')}
          />
          <TextInput
            disabled={isSubmitting}
            label={profileEditText('login')}
            radius="lg"
            size="md"
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...form.getInputProps('login')}
          />
        </Group>
        <Group grow justify="flex-start">
          <TextInput
            disabled={isSubmitting}
            label={profileEditText('email')}
            radius="lg"
            size="md"
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...form.getInputProps('email')}
          />
          <PasswordInput
            disabled={isSubmitting}
            label={profileEditText('currentPassword')}
            radius="lg"
            size="md"
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...form.getInputProps('currentPassword')}
          />
        </Group>
      </Stack>
      {!emailConfirmed && (
        <Group gap="xs" justify="flex-start" mt="md">
          <Anchor c="orange" size="xs" underline="never">
            {profileEditText('notConfirmed')}
          </Anchor>
          <Anchor c="orange" size="xs" underline="always">
            {profileEditText('sendLetterAgain')}
          </Anchor>
        </Group>
      )}
      <Stack align="stretch" gap="xl" justify="flex-start" mt="md">
        <Group grow justify="flex-start">
          <PasswordInput
            disabled={isSubmitting}
            label={profileEditText('newPassword')}
            radius="lg"
            size="md"
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...form.getInputProps('newPassword')}
          />
          <PasswordInput
            disabled={isSubmitting}
            label={profileEditText('confirmPassword')}
            radius="lg"
            size="md"
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...form.getInputProps('confirmPassword')}
          />
        </Group>
        <Space />
      </Stack>
    </>
  );
}

export default FormFields;
