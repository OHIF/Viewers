import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

// Style
import './UserPreferences.styl';

// Tabs
// import { HotKeysPreferences } from './HotKeysPreferences';
// import { WindowLevelPreferences } from './WindowLevelPreferences';
import { Component as HotKeysPreferences } from './Component';
import { Component as WindowLevelPreferences } from './Component';
import { GeneralPreferences } from './GeneralPreferences';

import { useTranslation } from 'react-i18next';

function UserPreferences({
  hide,
  hotkeysManager,
  userPreferencesContext = {},
}) {
  const {
    generalPreferences = {},
    windowLevelHotkeys = {},
  } = userPreferencesContext;

  const { t, ready: translationsAreReady } = useTranslation(
    'UserPreferencesModal'
  );

  const tabs = [
    {
      name: 'Hotkeys',
      Component: HotKeysPreferences,
      props: { hotkeysManager },
    },
    {
      name: 'General',
      Component: GeneralPreferences,
      props: { generalPreferences },
    },
    {
      name: 'Window Level',
      Component: WindowLevelPreferences,
      props: { windowLevelHotkeys, hotkeysManager },
    },
  ];

  const [currentTabIndex, setCurrentTabIndex] = useState(0);

  return (
    translationsAreReady &&
    tabs.length > 0 && (
      <div className="UserPreferences">
        <div className="UserPreferencesTabs">
          <div className="UserPreferencesTabs__selector">
            <div className="dialog-separator-after">
              <ul className="nav nav-tabs">
                {tabs.map((tab, index) => {
                  const { name, hidden } = tab;
                  return (
                    !hidden && (
                      <li
                        key={name}
                        onClick={() => {
                          setCurrentTabIndex(index);
                        }}
                        className={classnames(
                          'nav-link',
                          index === currentTabIndex && 'active'
                        )}
                        data-cy={name.toLowerCase()}
                      >
                        <button>{name}</button>
                      </li>
                    )
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
        {tabs.map((tab, index) => {
          const { name, Component, props, hidden } = tab;
          return (
            !hidden && (
              <div
                key={name}
                className={classnames(
                  'tabsContent',
                  index === currentTabIndex && 'active'
                )}
              >
                <Component {...props} name={name} t={t} onClose={hide} />
              </div>
            )
          );
        })}
      </div>
    )
  );
}

UserPreferences.propTypes = {
  hide: PropTypes.func,
};

export { UserPreferences };
