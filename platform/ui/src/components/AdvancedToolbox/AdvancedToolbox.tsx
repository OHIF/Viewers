import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { PanelSection, Icon, Tooltip } from '../../components';
import ToolSettings from './ToolSettings';

const AdvancedToolbox = ({ title, items, name }) => {
  const [isActive, setIsActive] = useState(null);

  useEffect(() => {
    // see if any of the items are active from the outside
    const activeItem = items?.find(item => item.active);
    if (activeItem) {
      setIsActive(activeItem.name);
    }
  }, [items]);

  return (
    <PanelSection title={title}>
      <div className="bg-black flex flex-col">
        <div className="flex mt-0.5 flex-wrap bg-primary-dark py-2">
          {items?.map(item => {
            return (
              <div
                className=" ml-2 mb-2"
                key={item.name}
                onClick={() => {
                  setIsActive(item.name);
                  item.onClick(item.name);
                }}
              >
                <Tooltip
                  position="bottom"
                  delay={1750}
                  content={
                    <span className="text-white text-xs">{item.name}</span>
                  }
                >
                  <div
                    className={classnames(
                      'w-[40px] h-[40px] text-primary-active bg-black grid place-items-center hover:bg-primary-light hover:text-black hover:cursor-pointer rounded-md',
                      isActive === item.name && 'bg-primary-light text-black'
                    )}
                  >
                    <Icon name={item.icon} className="" />
                  </div>
                </Tooltip>
              </div>
            );
          })}
        </div>
        <div className="h-auto bg-black px-2">
          <ToolSettings
            options={items?.find(item => item.name === isActive)?.options}
          />
        </div>
      </div>
    </PanelSection>
  );
};

AdvancedToolbox.propTypes = {};

export default AdvancedToolbox;
