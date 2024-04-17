import React from 'react';
import { PanelSection, ToolSettings, Tooltip } from '../../components';
import classnames from 'classnames';

const ItemsPerRow = 4;

/**
 * Just refactoring from the toolbox component to make it more readable
 */
function ToolboxUI(props) {
  const {
    toolbarButtons,
    handleToolSelect,
    activeToolOptions,
    numRows,
    servicesManager,
    title,
    useCollapsedPanel = true,
  } = props;

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
                handleToolSelect(itemId || id);
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
                  {componentProps.disabled ? (
                    <Tooltip
                      position="bottom"
                      content={componentProps.label}
                      secondaryContent={componentProps.disabledText}
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
                    </Tooltip>
                  ) : (
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
                  )}
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
