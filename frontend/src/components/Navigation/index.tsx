import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Container from 'react-bootstrap/Container';
import Image from 'react-bootstrap/Image';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

import type { RootReducerType } from 'src/types/slices';
import { useAuth } from '../../hooks';
import routes from '../../routes';

import Logo from '../../assets/images/RunITLogo.svg';
import AuthButtons from './AuthButtons';
import LanguageSelector from './LanguageSelector';
import NavMenu from './NavMenu';
import ThemeSelector from './ThemeSelector';
import UserMenu from './UserMenu';
import GuestMenu from './GuestMenu';
import AdminPanelButton from './AdminPanelButton';

function Navigation() {
  const { isLoggedIn } = useAuth();
  const { t: tN } = useTranslation('translation', { keyPrefix: 'navbar' });
  //  const isAdmin = useSelector(
  //  (state: RootReducerType) => state.user.userInfo.isAdmin,
  // );
  const guestUser = localStorage.getItem('guestUserData');

  return (
    <Navbar
      bg="body-tertiary"
      className="navigation-container"
      data-bs-theme="dark"
      expand="sm"
    >
      <Container className="px-xl-3" fluid>
        <Navbar.Brand as={Link} to={routes.landingPath()}>
          <Image alt={tN('mainLabel')} className="logo-height" src={Logo} />
        </Navbar.Brand>
        <Navbar.Toggle
          aria-controls="responsive-navbar-nav"
          className="border-0"
        />
        <Navbar.Collapse id="responsive-navbar-nav">
          <NavMenu />
          <Nav
            as="ul"
            className="flex-sm-row flex-column flex-wrap ms-sm-auto align-items-sm-center align-items-start gap-2"
          >
            {isLoggedIn && <AdminPanelButton />}
            <LanguageSelector />
            <ThemeSelector />
            {isLoggedIn && !guestUser && <UserMenu />}
            {isLoggedIn && guestUser && <GuestMenu />}
            {!isLoggedIn && <AuthButtons />}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation;
