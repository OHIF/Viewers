import React, { useState } from 'react';
import PropTypes from 'prop-types';

import './UserPreferencesTabs.styl';

/**
 * Render tab component
 * @param {object} tab TabObject containing tab data
 * @param {function} onTabStateChanged Callback Function in case tab changes its state
 * @param {function} onTabErrorChanged Callback Function in case any error on tab
 */
const renderTab = (
  tab = {},
  tabsState,
  tabsError,
  onTabStateChanged,
  onTabErrorChanged
) => {
  const { props, Component, name, hidden = false } = tab;

  const tabState = tabsState[name];
  const tabError = tabsError[name];

  return !hidden ? (
    <form className="form-themed themed tabs">
      <div className="form-content">
        <Component
          key={name}
          {...tabState}
          {...props}
          name={name}
          tabError={tabError}
          onTabStateChanged={onTabStateChanged}
          onTabErrorChanged={onTabErrorChanged}
        ></Component>
      </div>
    </form>
  ) : null;
};

const renderTabsHeader = (tabs, activeTabIndex, onHeaderChanged) => {
  return tabs.length > 0
    ? tabs.map((tab, index) => {
        const { name, hidden = false } = tab;

        const cypressSelectorId = name.toLowerCase();
        const tabClass =
          index === activeTabIndex ? 'nav-link active' : 'nav-link';
        return !hidden ? (
          <li
            key={name}
            onClick={() => {
              onHeaderChanged(index);
            }}
            className={tabClass}
            data-cy={cypressSelectorId}
          >
            <button>{name}</button>
          </li>
        ) : null;
      })
    : null;
};
/**
 * Component to render tabs based on currentActiveTabIndex
 *
 * In case any tab changes its state this current component tells parent through function callback
 * @param {object} props Component props
 */
function UserPreferencesTabs({
  tabs,
  tabsState,
  tabsError,
  onTabStateChanged,
  onTabErrorChanged,
}) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  return (
    <div className="UserPreferencesTabs">
      <div className="UserPreferencesTabs__selector">
        <div className="dialog-separator-after">
          <ul className="nav nav-tabs">
            {renderTabsHeader(tabs, activeTabIndex, setActiveTabIndex)}
          </ul>
        </div>
      </div>
      {renderTab(
        tabs[activeTabIndex],
        tabsState,
        tabsError,
        onTabStateChanged,
        onTabErrorChanged
      )}
    </div>
  );
}

UserPreferencesTabs.propTypes = {
  tabs: PropTypes.array.isRequired,
  tabsState: PropTypes.object.isRequired,
  tabsError: PropTypes.object.isRequired,
  onTabStateChanged: PropTypes.func.isRequired,
  onTabErrorChanged: PropTypes.func.isRequired,
};

export { UserPreferencesTabs };
