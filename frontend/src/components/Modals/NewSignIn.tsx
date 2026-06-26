import { Anchor, Divider, Group, Modal, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import NewSignInForm from '../Forms/SignInForm/NewSignInForm';
import SocialButtons from './SocialButtons/SocialButtons';
import { actions } from '../../slices';

/**
 * Модальное окно входа.
 *
 * Содержит форму входа, ссылку на сброс пароля,
 * ссылку на регистрацию и кнопки социальных сетей.
 */

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
      size="md"
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
      <SocialButtons />
    </Modal>
  );
}

export default NewSignInModal;