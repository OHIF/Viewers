import React, { useEffect, useRef } from 'react';
import { PanelSection } from '../../components';
import { ToolSettings } from '../OHIFToolSettings';
import { ToolButtonSmall } from '../ToolButton';

/** usePrevious hook to track previous values */
function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

/**
 * ToolboxUI
 * Renders a panel of tool buttons (using the "toolbarButtons" array from toolbarService)
 * and, if there is an active tool, displays its tool options below.
 */
function ToolboxUI(props: withAppTypes) {
  const {
    toolbarButtons,
    handleToolSelect,
    toolboxState,
    servicesManager,
    title,
    useCollapsedPanel = true,
  } = props;

  const { activeTool, toolOptions, selectedEvent } = toolboxState;
  const activeToolOptions = toolOptions?.[activeTool];
  const prevToolOptions = usePrevious(activeToolOptions);

  useEffect(() => {
    if (!activeToolOptions || !Array.isArray(activeToolOptions)) {
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
  }, [activeToolOptions, prevToolOptions, selectedEvent]);

  /**
   * A small render function that builds the UI.
   * We return a <React.Fragment> so we can wrap everything neatly.
   */
  const renderContent = () => {
    return (
      <React.Fragment>
        {/* The top row (or rows) of tool buttons */}
        <div className="flex flex-col bg-black">
          <div className="bg-muted mt-0.5 flex flex-wrap py-2">
            {toolbarButtons.map(toolDef => {
              if (!toolDef) {
                return null;
              }

              // De-structure relevant fields, including isActive
              const { id, icon, label, componentProps, isActive, commands } = toolDef;

              // If it has sub-items (grouped buttons):
              if (componentProps?.items?.length) {
                return (
                  <div
                    key={id}
                    className="bg-popover ml-2 mb-2 space-x-1 rounded-md px-0 py-0"
                  >
                    {componentProps.items.map(subItem => {
                      // subItem may also have isActive set by evaluate()
                      const subIsActive = subItem.isActive ?? false;

                      return (
                        <ToolButtonSmall
                          key={subItem.id}
                          id={subItem.id}
                          icon={subItem.icon || 'MissingIcon'}
                          label={subItem.label}
                          isActive={subIsActive}
                          disabled={subItem.disabled}
                          onClick={() => {
                            handleToolSelect(subItem.id);
                            props.onInteraction?.({
                              itemId: subItem.id,
                              commands: subItem.commands,
                            });
                          }}
                        />
                      );
                    })}
                  </div>
                );
              }

              // Single button
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
                      props.onInteraction?.({ itemId: id, commands });
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* The tool options panel (sliders, etc) */}
        <div className="bg-primary-dark h-auto px-2">
          {activeToolOptions && <ToolSettings options={activeToolOptions} />}
        </div>
      </React.Fragment>
    );
  };

  // Return either a collapsible panel or the content directly
  return useCollapsedPanel ? (
    <PanelSection>
      <PanelSection.Header>
        <span>{title}</span>
      </PanelSection.Header>
      <PanelSection.Content className="flex-shrink-0">{renderContent()}</PanelSection.Content>
    </PanelSection>
  ) : (
    renderContent()
  );
}

export { ToolboxUI };
