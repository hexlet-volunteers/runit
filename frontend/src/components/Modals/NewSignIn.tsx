import { Anchor, Button, Divider, Group, Modal, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { GithubIcon } from '@mantinex/dev-icons';

import NewSignInForm from '../Forms/SignInForm/NewSignInForm';
import { actions } from '../../slices';
import { SOCIAL_BUTTONS } from '../../utils/socialButtons';

function NewSignInModal({ handleClose, isOpen }) {
  const { t: signInText } = useTranslation('translation', {
    keyPrefix: 'signIn',
  });
  const { t: signUpText } = useTranslation('translation', {
    keyPrefix: 'signUp',
  });

  const dispatch = useDispatch();

  return (
    <Modal
      centered
      onClose={handleClose}
      opened={isOpen}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      radius="md"
      styles={{
        content: {
          height: 'auto',
        },
      }}
      title={
        <Title fw={700} order={3}>
          {signInText('header')}
        </Title>
      }
    >
      <NewSignInForm />
      <Group justify="space-between">
        <Anchor c="dimmed" href="" mt="md" size="sm">
          {signInText('forgotPass')}
        </Anchor>
        <Anchor
          c="dimmed"
          mt="md"
          onClick={() => dispatch(actions.openModal({ type: 'signingUp' }))}
          size="sm"
        >
          {signInText('createAnAccount')}
        </Anchor>
      </Group>
      <Divider label={signUpText('or')} labelPosition="center" my="md" />
      <Group align="center" gap="sm" grow>
        {SOCIAL_BUTTONS.map(
          ({ key, icon: Icon, component: Component, size }) => (
            <Button
              key={key}
              leftSection={
                Icon === GithubIcon ? <Icon size={size} /> : <Component />
              }
              size="md"
              styles={{
                label: {
                  whiteSpace: 'normal',
                  textAlign: 'center',
                },
              }}
              variant="default"
            >
              {signUpText(key)}
            </Button>
          ),
        )}
      </Group>
    </Modal>
  );
}

export default NewSignInModal;
