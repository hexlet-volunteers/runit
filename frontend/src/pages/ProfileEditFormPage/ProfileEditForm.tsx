import {
  AppShell,
  Box,
  Button,
  Grid,
  Group,
  Notification,
  Space,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { RootReducerType } from '../../types/slices';
import type { ProfileEditFormValues } from './TranslatedYupResolver';
import { useTRPC } from '../../utils/trpc';
import routes from '../../routes';
import Header from './Header';
import ProfileSnippetsSection from './ProfileSnippetsSection';
import { createTranslatedResolver } from './TranslatedYupResolver';
import convertFormDataForUpdating from './ConvertDataFunction';
import FormFields from './FormFields';
import { profileEditMockData } from './ProfileEditMockData';

function ProfileEditForm() {
  const { t } = useTranslation();
  const { t: profileEditText } = useTranslation('translation', {
    keyPrefix: 'profileEdit',
  });

  const currentUserId = useSelector(
    (state: RootReducerType) => state.user.userInfo?.id,
  );

  const [submitError, setSubmitError] = useState<string | null>(null);
  const emailConfirmed = false;
  const navigate = useNavigate();

  const trpc = useTRPC();

  const queryData = trpc.users.getUserById.queryOptions(currentUserId);
  const { data, isLoading, error, refetch } = useQuery(queryData);

  const userMutationOptions = trpc.users.updateUser.mutationOptions();
  const userUpdater = useMutation({
    ...userMutationOptions,
    onError: (err) => {
      setSubmitError(err.message || t('errors.userNotUpdated'));
    },
    onSuccess: () => {
      refetch();
      navigate(routes.profilePageNew());
    },
  });

  const initialFormValues: ProfileEditFormValues = {
    name: data?.username || '',
    login: data?.username || '',
    email: data?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  const form = useForm<ProfileEditFormValues>({
    initialValues: initialFormValues,
    validate: createTranslatedResolver(t),
  });

  useEffect(() => {
    if (data) {
      form.setValues({
        name: data.username || '',
        login: data.username || '',
        email: data.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } else if (!data && !isLoading && !currentUserId) {
      form.setValues({
        name: profileEditMockData.name,
        login: profileEditMockData.login,
        email: profileEditMockData.email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [data, isLoading, error, currentUserId]);

  const handleSubmit = async (values: ProfileEditFormValues) => {
    try {
      const apiData = convertFormDataForUpdating(values, currentUserId);
      userUpdater.mutate(apiData);
    } catch (err) {
      console.error(err);
      setSubmitError(t('errors.userNotUpdated'));
    }
  };

  if (isLoading) return <div>{profileEditText('loading')}</div>;
  // if (error) return <div>{error.message}</div>;

  return (
    <AppShell header={{ height: 70 }} style={{ height: '100vh' }}>
      <Header />
      <AppShell.Main bg="gray.1">
        <Box m="lg">
          <Grid align="flex-start" gutter="md" justify="center" m="lg">
            <Grid.Col h="110px" offset={0.1} span={1.5}>
              <ProfileSnippetsSection userId={currentUserId} />
            </Grid.Col>
            <Grid.Col h="400px" span={9}>
              <Box
                bdrs="md"
                bg="white"
                m="lg"
                p="lg"
                style={{ border: '1px gray' }}
              >
                <form onSubmit={form.onSubmit(handleSubmit)}>
                  <Title order={5}>{profileEditText('formHeader')}</Title>
                  <Space />
                  <FormFields
                    form={form}
                    emailConfirmed={emailConfirmed}
                    isSubmitting={userUpdater.isPending}
                  />
                  <Group justify="flex-start">
                    <Button
                      onClick={() => navigate(routes.profilePageNew())}
                      radius="lg"
                      variant="default"
                    >
                      {profileEditText('cancel')}
                    </Button>
                    <Button
                      disabled={userUpdater.isPending}
                      radius="lg"
                      type="submit"
                    >
                      {profileEditText('save')}
                    </Button>
                  </Group>

                  {submitError && (
                    <Notification
                      color="red"
                      onClose={() => setSubmitError(null)}
                    >
                      {submitError}
                    </Notification>
                  )}
                </form>
              </Box>
            </Grid.Col>
          </Grid>
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}

export default ProfileEditForm;
