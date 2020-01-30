import React, { useState, useReducer, useContext } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

// Style
import './UserPreferences.styl';

import { useSelector } from 'react-redux';

// Tabs
import { HotKeysPreferences } from './HotKeysPreferences';
import { WindowLevelPreferences } from './WindowLevelPreferences';
import { GeneralPreferences } from './GeneralPreferences';

import { useTranslation } from 'react-i18next';

const tabs = [
  {
    name: 'Hotkeys',
    Component: HotKeysPreferences,
    getProps({ hotkeysManager = {} }) {
      const { hotkeyDefinitions, hotkeyDefaults, setHotkeys } = hotkeysManager;
      return {
        hotkeyDefinitions,
        hotkeyDefaults,
        setHotkeys,
      };
    },
  },
  {
    name: 'General',
    Component: GeneralPreferences,
    getProps({ preferencesState = {} }) {
      const { generalPreferences } = preferencesState;
      return {
        generalPreferences,
      };
    },
  },
  {
    name: 'Window Level',
    Component: WindowLevelPreferences,
    getProps({ hotkeysManager, preferencesState }) {
      return {
        hotkeysManager,
        preferencesState,
      };
    },
  },
];

function UserPreferences({ hide, hotkeysManager }) {
  const { t, ready: translationsAreReady } = useTranslation(
    'UserPreferencesModal'
  );

  const [currentTabIndex, setCurrentTabIndex] = useState(0);

  const { preferences: preferencesState } = useSelector(state => {
    const { preferences } = state;

    return {
      preferences,
    };
  });

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
          const { name, Component, getProps, hidden } = tab;
          const props = getProps({ hotkeysManager, preferencesState });
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
