import React, { useContext, useEffect } from 'react';
import {} from 'react-router-dom';
import { Link as RouterLink, useLocation, matchPath } from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import NavItem from './NavItem';
import UserManagerContext from '../../context/UserManagerContext';

export const navConfig = [
  {
    title: 'Viewer',
    href: '/studylist',
  },
  {
    title: 'Uplouder',
    href: '/uplouder',
  },
  {
    title: 'user ',
    href: '/profile',
  },
];

const reduceChildRoutes = ({ acc, pathname, item, depth }) => {
  const key = item.title + depth;
  const open = matchPath(pathname, {
    path: item.href,
    exact: false,
  });

  acc.push(
    <NavItem
      open={Boolean(open)}
      href={item.href}
      key={key}
      title={item.title}
    />
  );

  return acc;
};

const renderNavItems = ({ items, pathname, depth = 0 }) => {
  return (
    <div>
      {items.reduce(
        (acc, item) => reduceChildRoutes({ acc, item, pathname, depth }),
        []
      )}
    </div>
  );
};

const Sidebar = ({ onMobileClose, onMobileNavOpen, openMobile }) => {
  const location = useLocation();
  const userManager = useContext(UserManagerContext);

  useEffect(() => {
    if (openMobile && onMobileClose) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleMenu = () => {
    if (openMobile) onMobileClose();
    else onMobileNavOpen();
  };

  const handleLogout = () => userManager.signoutRedirect();

  const content = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'column',
        height: '80%',
      }}
    >
      <div style={{}}>
        <div
          style={{
            marginBottom: '2rem',
          }}
        >
          <RouterLink to="/">
            <h2
              style={{
                color: 'grey',
              }}
            >
              ThetaTech
            </h2>
          </RouterLink>
        </div>
        <div>
          {renderNavItems({
            items: navConfig,
            pathname: location.pathname,
          })}
        </div>
      </div>

      <div style={{}}>
        <button onClick={handleLogout} className="primary-btn">
          Log out{' '}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={classNames('main__menu--bar', {
          expand: openMobile,
        })}
      >
        <a
          onClick={toggleMenu}
          className={classNames('menu-toggle', {
            active: openMobile,
          })}
        >
          <span className="line a"></span>
          <span className="line b"></span>
          <span className="line c"></span>
        </a>
        <div className="sidebar__menu">{content}</div>
      </div>
    </>
  );
};

Sidebar.propTypes = {
  onMobileNavOpen: PropTypes.func,
  onMobileClose: PropTypes.func,
  openMobile: PropTypes.bool,
};

export default Sidebar;
