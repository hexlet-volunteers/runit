import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Anchor, Center, Flex, Modal, Title } from '@mantine/core';

import { actions } from '../../slices';
import NewForgotPasswordForm from '../Forms/ForgotPasswordForm/NewForgotPasswordForm';

/**
 * Модальное окно сброса пароля.
 *
 * Содержит форму для сброса пароля и
 * ссылку на окно входа.
 */


function NewForgotPasswordModal({ handleClose, isOpen }) {
  const { t: tFP } = useTranslation('translation', { keyPrefix: 'forgotPass' });
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
          {tFP('modalHeader')}
        </Title>
       }
    >
      <Flex gap="lg" direction="column">
        {tFP('description')}
        <NewForgotPasswordForm />
        <Center>
          <Anchor
            c="dimmed"
            mt="md"
            size="sm"
            onClick={() => dispatch(actions.openModal({ type: 'signingIn' }))}
          >
            {tFP('returnToSignIn')}
          </Anchor>
        </Center>
      </Flex>
    </Modal>
  )
}

export default NewForgotPasswordModal