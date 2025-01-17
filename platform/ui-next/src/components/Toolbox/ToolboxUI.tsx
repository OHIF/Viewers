import React, { useEffect, useRef } from 'react';
import { PanelSection } from '../../components';
// Migrate this file to the new UI eventually
import { ToolSettings } from '@ohif/ui';
import classnames from 'classnames';
import { ToolButtonSmall } from '../ToolButton';
const ItemsPerRow = 4;

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

function ToolboxUI(props: withAppTypes) {
  const {
    toolbarButtons,
    handleToolSelect,
    toolboxState,
    numRows,
    servicesManager,
    title,
    useCollapsedPanel = true,
  } = props;

  const { activeTool, toolOptions, selectedEvent } = toolboxState;
  const activeToolOptions = toolOptions?.[activeTool];

  const prevToolOptions = usePrevious(activeToolOptions);

  useEffect(() => {
    if (!activeToolOptions || Array.isArray(activeToolOptions) === false) {
      return;
    }

    activeToolOptions.forEach((option, index) => {
      const prevOption = prevToolOptions ? prevToolOptions[index] : undefined;
      if (!prevOption || option.value !== prevOption.value || selectedEvent) {
        const isOptionValid = option.condition
          ? option.condition({ options: activeToolOptions })
          : true;
        if (isOptionValid) {
          const { commands } = option;
          commands(option.value);
        }
      }
    });
  }, [activeToolOptions, selectedEvent]);

  const render = () => {
    return (
      <>
        <div className="flex flex-col bg-black">
          <div className="bg-muted mt-0.5 flex flex-wrap py-2">
            {toolbarButtons.map(toolDef => {
              if (!toolDef) {
                return null;
              }

              const { id, icon, label, componentProps } = toolDef;
              // Multiple items design
              if (componentProps?.items?.length) {
                return (
                  <div
                    key={id}
                    className="bg-popover ml-2 mb-2 inline-flex items-center space-x-0 rounded-md px-0 py-0"
                  >
                    {componentProps.items.map(subItem => {
                      const { id: subId, icon: subIcon, label: subLabel } = subItem;
                      const isActive = activeTool === subId;

                      return (
                        <ToolButtonSmall
                          key={subId}
                          id={subId}
                          icon={subIcon || 'MissingIcon'}
                          label={subLabel}
                          isActive={isActive}
                          disabled={subItem.disabled}
                          onClick={() => {
                            handleToolSelect(subId);
                            props.onInteraction?.({ itemId: subId, commands: subItem.commands });
                          }}
                        />
                      );
                    })}
                  </div>
                );
              }

              // Single button design
              const isActive = activeTool === id;
              return (
                <div
                  key={id}
                  className="ml-2 mb-2"
                >
                  <ToolButtonSmall
                    id={id}
                    icon={icon || 'MissingIcon'}
                    label={label}
                    isActive={isActive}
                    disabled={componentProps?.disabled}
                    onClick={() => {
                      handleToolSelect(id);
                      props.onInteraction?.({ itemId: id, commands: toolDef.commands });
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-primary-dark h-auto px-2">
          {activeToolOptions && <ToolSettings options={activeToolOptions} />}
        </div>
      </>
    );
  };

  return (
    <>
      {useCollapsedPanel ? (
        <PanelSection>
          <PanelSection.Header>
            <span>{title}</span>
          </PanelSection.Header>
          <PanelSection.Content className="flex-shrink-0">{render()}</PanelSection.Content>
        </PanelSection>
      ) : (
        render()
      )}
    </>
  );
}

export { ToolboxUI };
