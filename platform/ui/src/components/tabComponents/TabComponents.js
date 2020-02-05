import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

// Style
import './TabComponents.styl';

/**
 * Take a list of components data and render then into tabs
 *
 * @param {Object} props
 * @param {array} props.tabs
 * @param {Object} props.customProps
 */
function TabComponents({ tabs, customProps = {} }) {
  const [currentTabIndex, setCurrentTabIndex] = useState(0);

  return (
    tabs.length > 0 && (
      <div className="TabComponents">
        <div className="TabComponents_tabHeader">
          <div className="TabComponents_tabHeader_selector">
            <div className="dialog-separator-after">
              <ul className="nav nav-tabs">
                {tabs.map((tab, index) => {
                  const { name, hidden } = tab;
                  return (
                    !hidden && (
                      <li
                        key={index}
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
          const { Component, hidden } = tab;
          return (
            !hidden && (
              <div
                key={index}
                className={classnames(
                  'TabComponents_content',
                  index === currentTabIndex && 'active'
                )}
              >
                <Component {...customProps} />
              </div>
            )
          );
        })}
      </div>
    )
  );
}

TabComponents.propTypes = {
  tabs: PropTypes.array,
  customProps: PropTypes.object,
};

export { TabComponents };
