import { useDisclosure } from '@mantine/hooks';
import { useTernaryDarkMode } from 'usehooks-ts';
import {
  Box,
  Burger,
  Button,
  Divider,
  Drawer,
  Flex,
  Group,
  ScrollArea,
  Anchor,
  Text,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useDispatch } from 'react-redux';

import RunItLogoLight from './assets/HeaderLightThemeLogo.svg';
import RunItLogoDark from './assets/HeaderDarkThemeLogo.svg';

import LanguageSelector from '../../components/Navigation/LanguageSelector';
import ThemeSelector from '../../components/Navigation/ThemeSelector';

import routes from '../../routes';
import { actions } from '../../slices/index';

export function Header() {
  const { t: headerTextContent } = useTranslation('translation', {
    keyPrefix: 'landing.header',
  });
  const { t: profileTextContent } = useTranslation('translation', {
    keyPrefix: 'profileActions',
  });

  const redir = useNavigate();

  const dispatch = useDispatch();

  const handleOpenSignUpModal = () => {
    dispatch(actions.openModal({ type: 'signingUp' }));
  };

  const handleRedirToSignIn = () => {
    redir(routes.signInPagePath());
  };

  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);
  const { isDarkMode } = useTernaryDarkMode();
  const logo = isDarkMode ? RunItLogoDark : RunItLogoLight;

  const ComputedAnchorElements = () => {
    const anchorsKeys = {
      about: 'about',
      opportunities: 'opportunities',
      technologies: 'technologies',
      community: 'community',
      faq: 'faq',
    } as const;

    return Object.entries(anchorsKeys).map(([key, label]) => (
      <Anchor underline="never" key={key}>
        <Text c="dark">{headerTextContent(label)}</Text>
      </Anchor>
    ));
  };

  return (
    <Box mb={80} py={22}>
      <Group justify="space-between">
        <img src={logo} alt="hexletLogo" width="75px" />
        <Group h="100%" gap={18} visibleFrom="lg">
          {ComputedAnchorElements()}
        </Group>

        <Group visibleFrom="md">
          <LanguageSelector />
          <ThemeSelector />
          <Button
            variant="default"
            radius="xl"
            onClick={() => handleRedirToSignIn()}
          >
            {profileTextContent('signIn')}
          </Button>
          <Button radius="xl" onClick={() => handleOpenSignUpModal()}>
            {profileTextContent('signUp')}
          </Button>
        </Group>

        <Burger opened={drawerOpened} onClick={toggleDrawer} hiddenFrom="lg" />
      </Group>
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        title={<img src={logo} alt="hexletLogo" width="100px" />}
        size="100%"
        padding="md"
        zIndex={65535}
      >
        <ScrollArea h="calc(100vh - 80px)" mx="-md">
          <Divider my="sm" />
          <Flex
            mih={50}
            gap="sm"
            justify="center"
            align="flex-start"
            direction="column"
            wrap="wrap"
            px="md"
          >
            {ComputedAnchorElements()}
          </Flex>

          <Divider my="sm" />

          <Group justify="flex-start" pb="xl" px="md">
            <Button variant="default" onClick={() => handleOpenSignUpModal()}>
              <span>{profileTextContent('signUp')}</span>
            </Button>
            <Button onClick={() => handleRedirToSignIn()}>
              <span>{profileTextContent('signIn')}</span>
            </Button>
          </Group>
        </ScrollArea>
      </Drawer>
    </Box>
  );
}

export default Header;
