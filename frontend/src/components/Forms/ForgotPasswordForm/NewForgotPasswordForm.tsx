import { Button, Notification, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDispatch } from 'react-redux';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { actions } from '../../../slices/modalSlice';
import { createTranslatedResolver } from './translatedYupResolver';
import { ForgotPasswordUserInputData } from '../../../types/components';

function NewForgotPasswordForm() {
    
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { t: tFP } = useTranslation('translation', { keyPrefix: 'forgotPass' });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    initialValues: {
      email: '',
    } satisfies ForgotPasswordUserInputData,
    validate: createTranslatedResolver(t),
  });

  const handleSubmit = (values: ForgotPasswordUserInputData) => {
    setSubmitError(null);
    setIsLoading(true);

    try {
      // TODO: добавить функцию отправки email 
      dispatch(actions.closeModal());
    } catch (error) {
      setSubmitError(t('errors.signInFailed'));
    }
    finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <TextInput
        label={tFP('email')}
        placeholder="you@example.com"
        radius="md"
        {...form.getInputProps('email')}
      />
      <Button
        disabled={isLoading}
        fullWidth
        loading={isLoading}
        mt="lg"
        radius="md"
        size="md"
        type="submit"
        variant="filled"
      >
        {tFP('submit')}
      </Button>
      {submitError && (
        <Notification color="red" onClose={() => setSubmitError(null)}>
          {submitError}
        </Notification>
        )}
    </form>
  )
}

export default NewForgotPasswordForm