import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';

import { GridFill } from 'react-bootstrap-icons';
import Nav from 'react-bootstrap/Nav';

import type { RootReducerType } from 'src/types/slices';
import { useAuth } from '../../hooks';
import routes from '../../routes';

function MySnippetsLink() {
  const { t: tN } = useTranslation('translation', { keyPrefix: 'navbar' });
  // const username = useSelector(
  //  (state: RootReducerType) => state.user.userInfo.username,
  // );

  return (
    <Nav.Item as="li">
      <Nav.Link
        as={Link}
        className="icon-link"
        eventKey={routes.profilePageNew()}
        to={routes.profilePageNew()}
      >
        <span>
          <GridFill className="bi me-1" />
          {tN('mySnippets')}
        </span>
      </Nav.Link>
    </Nav.Item>
  );
}

function AboutLink() {
  const { t: tN } = useTranslation('translation', { keyPrefix: 'navbar' });

  return (
    <Nav.Item as="li">
      <Nav.Link
        as={Link}
        eventKey={routes.aboutPagePath()}
        to={routes.aboutPagePath()}
      >
        {tN('about')}
      </Nav.Link>
    </Nav.Item>
  );
}

function NavMenu() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();

  return (
    <Nav activeKey={location.pathname} as="ul">
      {isLoggedIn ? <MySnippetsLink /> : null}
      <AboutLink />
    </Nav>
  );
}

export default NavMenu;
