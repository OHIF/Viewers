import React, { useContext, useEffect } from 'react';
import {} from 'react-router-dom';
import { Link as RouterLink, useLocation, matchPath } from 'react-router-dom';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import NavItem from './NavItem';
import UserManagerContext from '../../context/UserManagerContext';
import { useDispatch, useSelector } from 'react-redux';
import { BrainMode, lungMode } from '../../utils/constants';

export const navConfig = [
  {
    title: 'Viewer',
    href: '/studylist',
  },
  {
    title: 'Upload Dicom',
    href: '/uplouder',
    onClick: () => {
      window.open(
        'https://production.d22vmj66kp0f97.amplifyapp.com/',
        '_blank'
      );
    },
  },
  {
    title: 'User',
    href: '/profile',
  },
];

const reduceChildRoutes = ({ acc, pathname, item, onMobileClose, depth }) => {
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
      onClick={item.onClick}
      onMobileClose={onMobileClose}
    />
  );

  return acc;
};

const renderNavItems = ({ items, pathname, onMobileClose, depth = 0 }) => {
  return (
    <div>
      {items.reduce(
        (acc, item) =>
          reduceChildRoutes({ acc, item, pathname, depth, onMobileClose }),
        []
      )}
    </div>
  );
};

const Sidebar = ({ onMobileClose, onMobileNavOpen, openMobile }) => {
  const location = useLocation();
  const userManager = useContext(UserManagerContext);
  const { active: currentMode } = useSelector(state => state && state.mode);
  const dispatch = useDispatch();

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

  const toggleMode = () => {
    onMobileClose();
    const action = {
      type: 'SET_APPLICATION_MODE',
      mode: currentMode === BrainMode ? lungMode : BrainMode,
    };
    dispatch(action);
  };

  const handleLogout = () => userManager.signoutRedirect();

  const content = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div
        style={{
          flex: 1,
        }}
      >
        <div
          style={{
            marginBottom: '2rem',
          }}
        >
          <RouterLink to="/">
            <div style={{}}>
              <h2
                style={{
                  fontweight: '400',
                  // fontSize: '24px',
                  borderRadius: '4px',
                  padding: '4px',
                  // marginRight: '80px',
                  border: '1px #878787 solid',
                }}
              >
                Thetatech
              </h2>
            </div>
          </RouterLink>
        </div>

        <div>
          {renderNavItems({
            items: navConfig,
            pathname: location.pathname,
            onMobileClose,
          })}
        </div>
        <div>
          <button
            onClick={toggleMode}
            className="btn btn-small btn-primary pull-left"
          >
            Toggle Mode
          </button>
        </div>
      </div>

      <div style={{}}>
        <button onClick={handleLogout} className="btn btn-danger pull-right">
          Log out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div
        className={classNames('main__menu--bar', {
          expand: openMobile,
          // expand: openMobile,
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
