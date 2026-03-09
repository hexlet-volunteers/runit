import {
  Button,
  Notification,
  PasswordInput,
  Stack,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { SignInUserInputData } from '../../../types/components';
import routes from '../../../routes';
import { actions } from '../../../slices/modalSlice';
import { setCurrentUser } from '../../../slices/userSlice';
import { createTranslatedResolver } from './translatedYupResolver';

function NewSignInForm() {
  const { t } = useTranslation();
  const { t: signInText } = useTranslation('translation', {
    keyPrefix: 'signIn',
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
    } satisfies SignInUserInputData,
    validate: createTranslatedResolver(t),
  });

  const handleSubmit = (values: SignInUserInputData) => {
    setSubmitError(null);
    try {
      // после реализации процедуры авторизации добавить функцию signIn
      dispatch(setCurrentUser(values));
      dispatch(actions.closeModal());
      navigate(routes.profilePageNew());
    } catch (error) {
      setSubmitError(t('errors.signInFailed'));
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
          label={signInText('email')}
          placeholder="you@example.com"
          radius="md"
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...form.getInputProps('email')}
        />
        <PasswordInput
          label={signInText('password')}
          placeholder="••••••••"
          radius="md"
          // eslint-disable-next-line react/jsx-props-no-spreading
          {...form.getInputProps('password')}
        />
      </Stack>
      <Button
        disabled={false}
        fullWidth
        loading={false}
        mt="lg"
        radius="md"
        size="md"
        type="submit"
        variant="filled"
      >
        {signInText('signInButton')}
      </Button>
      {submitError && (
        <Notification color="red" onClose={() => setSubmitError(null)}>
          {submitError}
        </Notification>
      )}
    </form>
  );
}

export default NewSignInForm;
