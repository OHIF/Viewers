import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { PanelSection, Icon, Tooltip } from '../../components';
import ToolSettings from './ToolSettings';

/**
 * Use Toolbox component instead of this although it doesn't have "Advanced" in its name
 * it is better to use it instead of this one
 */
const AdvancedToolbox = ({ title, items }) => {
  const [activeItemName, setActiveItemName] = useState(null);

  useEffect(() => {
    // see if any of the items are active from the outside
    const activeItem = items?.find(item => item.active);
    setActiveItemName(activeItem ? activeItem.name : null);
  }, [items]);

  const activeItemOptions = items?.find(item => item.name === activeItemName)?.options;

  return (
    <PanelSection
      title={title}
      childrenClassName="flex-shrink-0"
    >
      <div className="flex flex-col bg-black">
        <div className="bg-primary-dark mt-0.5 flex flex-wrap py-2">
          {items?.map(item => {
            return (
              <Tooltip
                position="bottom"
                content={<span className="text-white">{item.name}</span>}
                key={item.name}
              >
                <div
                  className="ml-2 mb-2"
                  onClick={() => {
                    if (item.disabled) {
                      return;
                    }
                    setActiveItemName(item.name);
                    item.onClick(item.name);
                  }}
                >
                  <div
                    className={classnames(
                      'text-primary-active grid h-[40px] w-[40px] place-items-center rounded-md bg-black  ',
                      activeItemName === item.name && 'bg-primary-light text-black',
                      item.disabled && 'opacity-50',
                      !item.disabled &&
                        'hover:bg-primary-light cursor-pointer hover:cursor-pointer hover:text-black'
                    )}
                  >
                    <Icon name={item.icon} />
                  </div>
                </div>
              </Tooltip>
            );
          })}
        </div>
        <div className="bg-primary-dark h-auto px-2">
          <ToolSettings options={activeItemOptions} />
        </div>
      </div>
    </PanelSection>
  );
};

AdvancedToolbox.propTypes = {};

export default AdvancedToolbox;
