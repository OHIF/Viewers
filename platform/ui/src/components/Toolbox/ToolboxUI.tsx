import React from 'react';
import { PanelSection, ToolSettings, Tooltip } from '../../components';
import classnames from 'classnames';

const ItemsPerRow = 4;

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
                    'flex flex-col items-center justify-center': true,
                  })}
                >
                  {componentProps.disabled ? (
                    <Tooltip
                      position="bottom"
                      content={componentProps.label}
                      secondaryContent={'Not available on the current viewport'}
                    >
                      <Component
                        {...componentProps}
                        {...props}
                        id={id}
                        servicesManager={servicesManager}
                        onInteraction={onInteraction}
                        size="toolbox"
                      />
                    </Tooltip>
                  ) : (
                    <Component
                      {...componentProps}
                      {...props}
                      id={id}
                      servicesManager={servicesManager}
                      onInteraction={onInteraction}
                      size="toolbox"
                    />
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

  return useCollapsedPanel ? <PanelSection title={title}>{render()}</PanelSection> : render();
}

export { ToolboxUI };
