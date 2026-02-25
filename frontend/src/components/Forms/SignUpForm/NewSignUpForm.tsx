import {
  Button,
  Checkbox,
  Group,
  Notification,
  PasswordInput,
  Space,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { useTRPC } from '../../../utils/trpc';
import routes from '../../../routes';
import convertFormDataForApi from './ConvertDataFunction';
import { setCurrentUser } from '../../../slices/userSlice';
import { actions } from '../../../slices/modalSlice';
import type { FetchedCurrentUser } from '../../../types/slices';
import type { SignUpFormValues } from './TranslatedYupResolver';
import { createTranslatedResolver } from './TranslatedYupResolver';
import CheckboxLinks from './CheckboxLinks';

function NewSignUpForm() {
  const { t } = useTranslation();
  const { t: signUpText } = useTranslation('translation', {
    keyPrefix: 'signUp',
  });

  const navigate = useNavigate();

  const dispatch = useDispatch();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const trpc = useTRPC();
  const createUserOptions = trpc.users.createUser.mutationOptions();
  const userCreator = useMutation({
    ...createUserOptions,
    onError: (error) => {
      console.error(error);
      setSubmitError(signUpText('signUpFailed'));
    },
    onSuccess: (data) => {
      const userData: FetchedCurrentUser = {
        id: data.id,
        username: data.username,
        email: data.email,
        password: '',
        isAdmin: data.isAdmin,
        created_at: data.createdAt || '',
        updated_at: data.createdAt || '',
        tempPassword: '',
        recover_hash: data.recoverHash || null,
        avatar_base64: null,
        theme: 'light',
      };
      dispatch(setCurrentUser(userData));
      dispatch(actions.closeModal());
      navigate(routes.editProfilePath());
    },
  });

  const form = useForm({
    initialValues: {
      username: '',
      email: '',
      password: '',
    } satisfies SignUpFormValues,
    validate: createTranslatedResolver(t),
  });

  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (values: SignUpFormValues) => {
    setSubmitError(null);
    if (!agreed) {
      setSubmitError(signUpText('agreementRequired'));
      return;
    }
    try {
      const apiData = convertFormDataForApi(values);
      userCreator.mutate(apiData);
    } catch (error) {
      setSubmitError(signUpText('signUpFailed'));
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack
        align="stretch"
        bg="var(--mantine-color-body)"
        gap="sm"
        justify="flex-start"
      >
        <TextInput
          label={signUpText('username')}
          placeholder="Иван"
          radius="md"
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...form.getInputProps('username')}
        />
        <TextInput
          label={signUpText('email')}
          placeholder="you@example.com"
          radius="md"
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...form.getInputProps('email')}
        />
        <PasswordInput
          label={signUpText('password')}
          placeholder="Минимум 8 символов"
          radius="md"
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...form.getInputProps('password')}
        />
      </Stack>
      <Checkbox
        checked={agreed}
        label={<CheckboxLinks t={signUpText} />}
        mb="md"
        mt="md"
        onChange={(event) => setAgreed(event.currentTarget.checked)}
      />
      <Space />
      <Group justify="center">
        <Button
          disabled={userCreator.isPending}
          fullWidth
          loading={userCreator.isPending}
          radius="md"
          size="md"
          type="submit"
          variant="filled"
        >
          {signUpText('registerButton')}
        </Button>
      </Group>
      {submitError && (
        <Notification color="red" onClose={() => setSubmitError(null)}>
          {submitError}
        </Notification>
      )}
      {userCreator.isSuccess && (
        <Notification color="green">{signUpText('success')}</Notification>
      )}
    </form>
  );
}

export default NewSignUpForm;
