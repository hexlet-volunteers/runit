import { Button, Group } from '@mantine/core';
import { GithubIcon } from '@mantinex/dev-icons';
import { useTranslation } from 'react-i18next';
import { SOCIAL_BUTTONS } from '../../../utils/socialButtons';

import styles from './styles/SocialButtons.module.scss';

/**
 * Компонент с кнопками входа через социальные сети (GitHub, VK, Яндекс ID).
 *
 * Используется в модалках входа и регистрации.
 * Кнопки рендерятся на основе массива SOCIAL_BUTTONS из utils.
 */

function SocialButtons() {
  const { t: signUpText } = useTranslation('translation', {
    keyPrefix: 'signUp',
  });

  return (
    <Group align="center" gap="sm" grow>
      {SOCIAL_BUTTONS.map(
        ({ key, icon: Icon, component: Component, size }) => (
          <Button
            key={key}
            size="md"
            className={styles.socialButton}
            variant="default"
            leftSection={
              Icon === GithubIcon ? <Icon size={size} /> : <Component />
            }
          >
            {signUpText(key)}
          </Button>
        ),
      )}
    </Group>
  )
}

export default SocialButtons;