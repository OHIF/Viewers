import React, { useState } from 'react';
import PropTypes from 'prop-types';

import './UserPreferencesTabs.styl';

/**
 * Render tab component
 * @param {object} tab TabObject containing tab data
 * @param {function} onTabStateChanged Callback Function in case tab changes its state
 */
const renderTab = (tab = {}, onTabStateChanged) => {
  const { props, Component, name, hidden = false, initialState } = tab;

  return !hidden ? (
    <form className="form-themed themed">
      <div className="form-content">
        <Component
          key={name}
          {...initialState}
          {...props}
          name={name}
          onTabStateChanged={onTabStateChanged}
        ></Component>
      </div>
    </form>
  ) : null;
};

const renderTabsHeader = (tabs, activeTabIndex, onHeaderChanged) => {
  return tabs.length > 0
    ? tabs.map((tab, index) => {
        const { name, hidden = false } = tab;

        const tabClass =
          index === activeTabIndex ? 'nav-link active' : 'nav-link';
        return !hidden ? (
          <li
            key={name}
            onClick={() => {
              onHeaderChanged(index);
            }}
            className={tabClass}
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
function UserPreferencesTabs({ tabs, onTabStateChanged }) {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  return (
    <div>
      <div className="dialog-separator-after">
        <ul className="nav nav-tabs">
          {renderTabsHeader(tabs, activeTabIndex, setActiveTabIndex)}
        </ul>
      </div>
      {renderTab(tabs[activeTabIndex], onTabStateChanged)}
    </div>
  );
}

UserPreferencesTabs.prototype = {
  tabs: PropTypes.array.isRequired,
  onTabStateChanged: PropTypes.func.isRequired,
};

export { UserPreferencesTabs };
