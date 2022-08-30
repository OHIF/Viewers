import React, { useEffect } from 'react';
import { useLocation, matchPath, Link as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';

import StepItem from './StepItem';
import { ApplicationSteps } from '../../../../core/src/redux/reducers/steps';

export const navConfig = Object.values(ApplicationSteps);

const reduceChildRoutes = ({ acc, pathname, item, depth }) => {
  const key = item.title + depth;
  const open = matchPath(pathname, {
    path: item.href,
    exact: false,
  });

  acc.push(
    <StepItem
      open={Boolean(open)}
      href={item.href}
      key={key}
      title={item.title}
    />
  );
  // }

  return acc;
};

const renderNavItems = ({ items, pathname, depth = 0 }) => {
  return (
    <div className="steps-container">
      {items.reduce(
        (acc, item) => reduceChildRoutes({ acc, item, pathname, depth }),
        []
      )}
    </div>
  );
};

const Header = ({ onMobileClose, openMobile }) => {
  const location = useLocation();

  useEffect(() => {
    if (openMobile && onMobileClose) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const content = (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'center',
      }}
    >
      {renderNavItems({
        items: navConfig,
        pathname: location.pathname,
      })}
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        position: 'fixed',
        alignItems: 'center',
        top: 0,
        left: 0,
        padding: '16px 16px 16px 15px',
        flexDirection: 'row',
        zIndex: 9,
      }}
    >
      <div
        style={{
          color: '#fff',
          flex: 1,
        }}
      >
        <div
          style={{
            fontweight: '400',
            marginLeft: '45px',
            fontSize: '28px',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          {/* <Icon name="ohif-logo" className="header-logo-image" /> */}
          <h4>ThetaTech</h4>
        </div>
      </div>

      <div className="portal__header">{content}</div>
    </div>
  );
};

export default Header;
