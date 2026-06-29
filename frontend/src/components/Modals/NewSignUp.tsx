import { Anchor, Divider, Group, Modal, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import NewSignUpForm from '../Forms/SignUpForm/NewSignUpForm';
import SocialButtons from './SocialButtons/SocialButtons';
import { actions } from '../../slices';

/**
 * Модальное окно регистрации.
 *
 * Содержит форму регистрации, ссылку на сброс пароля,
 * ссылку на модальное окно входа и кнопки социальных сетей.
 */

function NewSignUpModal({ handleClose, isOpen }) {
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
          {signUpText('pageHeader')}
        </Title>
      }
    >
      <NewSignUpForm />
      <Group justify="center">
        <Anchor
          c="dimmed"
          mt="md"
          onClick={() => dispatch(actions.openModal({ type: 'signingIn' }))}
          size="sm"
        >
          {signUpText('haveAnAccount')}
        </Anchor>
      </Group>
      <Divider label={signUpText('or')} labelPosition="center" my="md" />
      <SocialButtons />
    </Modal>
  );
}

export default NewSignUpModal;
