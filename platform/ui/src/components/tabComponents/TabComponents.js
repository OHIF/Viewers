import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

// Style
import './TabComponents.styl';

/**
 * Take name of the tab and create the data-cy value for it
 *
 * @param {string} [name=''] tab name
 * @returns {string} data-cy value
 */
const getDataCy = (name = '') => {
  return name
    .split(' ')
    .join('-')
    .toLowerCase();
};

/**
 * Single tab data information
 *
 * @typedef {Object} tabData
 * @property {string} name - name of the tab
 * @property {Object} Component - tab component to be rendered
 * @property {Object} customProps - tab custom properties
 * @property {bool} hidden - bool to define if tab is hidden of not
 */

/**
 * Take a list of components data and render then into tabs
 *
 * @param {Object} props
 * @param {[tabData]} props.tabs array of tab data
 * @param {Object} props.customProps common custom properties
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
                  const { name, hidden = false } = tab;
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
                        data-cy={getDataCy(name)}
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
          const {
            Component,
            customProps: tabCustomProps,
            hidden = false,
          } = tab;
          return (
            !hidden && (
              <div
                key={index}
                className={classnames(
                  'TabComponents_content',
                  index === currentTabIndex && 'active'
                )}
              >
                <Component {...customProps} {...tabCustomProps} />
              </div>
            )
          );
        })}
      </div>
    )
  );
}

TabComponents.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      Component: PropTypes.any,
      customProps: PropTypes.object,
      hidden: PropTypes.bool,
    })
  ),
  customProps: PropTypes.object,
};

export { TabComponents };
