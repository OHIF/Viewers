import React, { useEffect, useRef } from 'react';
import { PanelSection, ToolSettings } from '../../components';
import classnames from 'classnames';

const ItemsPerRow = 4;

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

/**
 * Just refactoring from the toolbox component to make it more readable
 */
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
          <div className="bg-primary-dark mt-0.5 flex flex-wrap py-2">
            {toolbarButtons.map((toolDef, index) => {
              if (!toolDef) {
                return null;
              }

              const { id, Component, componentProps } = toolDef;
              const isLastRow = Math.floor(index / ItemsPerRow) + 1 === numRows;

              const toolClasses = `ml-1 ${isLastRow ? '' : 'mb-2'}`;

              const onInteraction = ({ itemId, id, commands }) => {
                const idToUse = itemId || id;
                handleToolSelect(idToUse);
                props.onInteraction({
                  itemId,
                  commands,
                });
              };

              return (
                <div
                  key={id}
                  className={classnames({
                    [toolClasses]: true,
                    'border-secondary-light flex flex-col items-center justify-center rounded-md border':
                      true,
                  })}
                >
                  <div className="flex rounded-md bg-black">
                    <Component
                      {...componentProps}
                      {...props}
                      id={id}
                      servicesManager={servicesManager}
                      onInteraction={onInteraction}
                      size="toolbox"
                    />
                  </div>
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

  return useCollapsedPanel ? (
    <PanelSection
      childrenClassName="flex-shrink-0"
      title={title}
    >
      {render()}
    </PanelSection>
  ) : (
    render()
  );
}

export { ToolboxUI };
