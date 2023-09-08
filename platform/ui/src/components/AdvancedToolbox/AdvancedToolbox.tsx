import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { PanelSection, Icon, Tooltip } from '../../components';
import ToolSettings from './ToolSettings';

const AdvancedToolbox = ({ title, items }) => {
  const [isActive, setIsActive] = useState(null);

  useEffect(() => {
    // see if any of the items are active from the outside
    const activeItem = items?.find(item => item.active);
    setIsActive(activeItem ? activeItem.name : null);
  }, [items]);

  const activeItemOptions = items?.find(item => item.name === isActive)?.options;

  return (
    <PanelSection title={title}>
      <div className="flex flex-col bg-black">
        <div className="bg-primary-dark mt-0.5 flex flex-wrap py-2">
          {items?.map(item => {
            return (
              <div
                className="ml-2 mb-2"
                key={item.name}
                onClick={() => {
                  setIsActive(item.name);
                  item.onClick(item.name);
                }}
              >
                <Tooltip
                  position="bottom"
                  delay={1750}
                  content={<span className="text-xs text-white">{item.name}</span>}
                >
                  <div
                    className={classnames(
                      'text-primary-active grid h-[40px] w-[40px] place-items-center rounded-md bg-black  ',
                      isActive === item.name && 'bg-primary-light text-black',
                      item.disabled && 'opacity-50',
                      !item.disabled &&
                        'hover:bg-primary-light cursor-pointer hover:cursor-pointer hover:text-black'
                    )}
                  >
                    <Icon
                      name={item.icon}
                      className=""
                    />
                  </div>
                </Tooltip>
              </div>
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
