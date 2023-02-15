import React, { useEffect } from 'react';
import { useLocation, matchPath, Link as RouterLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';

import StepItem from './StepItem';
import {
  BrainApplicationSteps,
  LungApplicationSteps,
} from '../../../../core/src/redux/reducers/steps';
import NavigateIcons from './NavigateIcons';
import { BrainMode, lungMode } from '../../utils/constants';

const currentMode = BrainMode;

export const navConfig = Object.values(
  currentMode == BrainMode ? BrainApplicationSteps : LungApplicationSteps
);

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
      icon={item.icon}
    />
  );
  // }

  return acc;
};

const renderNavItems = ({ items, pathname, depth = 0 }) => {
  return (
    // <div className="steps-container">
    <ul className="stepper">
      {items.reduce(
        (acc, item) => reduceChildRoutes({ acc, item, pathname, depth }),
        []
      )}
    </ul>
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
    <section
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        // alignContent: 'center',
      }}
    >
      {renderNavItems({
        items: navConfig,
        pathname: location.pathname,
      })}
    </section>
  );

  const applicationTitle =
    currentMode == BrainMode ? 'Brain Mode' : 'Lung Mode';

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        position: 'fixed',
        alignItems: 'center',
        top: 0,
        left: 0,
        borderBottom: '1px  #87878780 solid',
        background: '#1A1C21',
        paddingRight: '6px',
        paddingTop: '6px',
        flexDirection: 'row',
        zIndex: 9,
      }}
    >
      <div
        style={{
          color: '#fff',
          // flex: 1,
        }}
      >
        <div
          style={{
            fontweight: '400',
            marginLeft: '45px',
            fontSize: '22px',
            paddingTop: '6px',
            paddingBottom: '6px',
            paddingLeft: '18px',
            paddingRight: '18px',
            display: 'flex',
            border: '1px #878787 solid',
            borderRadius: '4px',
            flexDirection: 'row',
            letterSpacing: '-0.05em',
            lineHeight: '31px',
          }}
        >
          <h4>{applicationTitle}</h4>
        </div>
      </div>

      <div className="portal__header">{content}</div>
      <div
        style={{
          color: '#fff',
          // flex: 1,
        }}
      >
        <NavigateIcons />
      </div>
    </div>
  );
};

export default Header;
