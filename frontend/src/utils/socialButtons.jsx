import { GithubIcon } from '@mantinex/dev-icons';
import YandexLogo from '../assets/images/icons/yandexLogo.png';
import VkIcon from '../assets/images/icons/vk.svg?react';

function YandexIcon({ width = 18, height = 18 }) {
  return (
    <img alt="Yandex" src={YandexLogo} style={{ width, height }} />
  )
}

export const SOCIAL_BUTTONS = [
  { key: 'vkBtn', icon: VkIcon, component: VkIcon },
  { key: 'yandexBtn', icon: YandexIcon, component: YandexIcon },
  { key: 'gitHubBtn', icon: GithubIcon, component: GithubIcon, size: 16 },
];
