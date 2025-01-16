import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { PanelSection, Tooltip } from '../../components';
import ToolSettings from './ToolSettings';
import { Icons } from '@ohif/ui-next';
import { ToolButtonSmall } from '@ohif/ui-next';

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
      <div className="bg-popover flex flex-col">
        <div className="bg-popover mt-0.5 flex flex-wrap py-2">
          {items?.map(item => (
            <ToolButtonSmall
              key={item.name}
              id={item.name}
              icon={item.icon}
              label={item.name}
              tooltip={item.name}
              isActive={activeItemName === item.name}
              disabled={item.disabled}
              onInteraction={({ itemId }) => {
                if (item.disabled) {
                  return;
                }
                setActiveItemName(itemId);
                item.onClick?.(itemId);
              }}
            />
          ))}
        </div>
        <div className="bg-popover h-auto px-2">
          <ToolSettings options={activeItemOptions} />
        </div>
      </div>
    </PanelSection>
  );
};

AdvancedToolbox.propTypes = {};

export default AdvancedToolbox;
