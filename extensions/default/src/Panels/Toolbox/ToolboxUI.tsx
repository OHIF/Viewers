import React from 'react';
import { PanelSection, ToolSettings, Tooltip } from '@ohif/ui';
import classnames from 'classnames';

const ItemsPerRow = 4;

function ToolboxUI(props) {
  const { toolbarButtons, handleToolSelect, activeTool, toolOptions, numRows, servicesManager } =
    props;
  return (
    <PanelSection title={'Segmentation Tools'}>
      <div className="flex flex-col bg-black">
        <div className="bg-primary-dark mt-0.5 flex flex-wrap py-2">
          {toolbarButtons.map((toolDef, index) => {
            if (!toolDef) {
              return null;
            }

            const { id, Component, componentProps } = toolDef;
            const isLastRow = Math.floor(index / ItemsPerRow) + 1 === numRows;

            const toolClasses = `ml-1 ${isLastRow ? '' : 'mb-2'}`;
            const onClick = () => handleToolSelect(id);

            return (
              <div
                key={id}
                className={classnames({
                  [toolClasses]: true,
                  'flex flex-col items-center justify-center': true,
                })}
                onClick={onClick}
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
                    />
                  </Tooltip>
                ) : (
                  <Component
                    {...componentProps}
                    {...props}
                    id={id}
                    servicesManager={servicesManager}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-primary-dark h-auto px-2">
        {activeTool && toolOptions[activeTool] && (
          <ToolSettings options={toolOptions[activeTool]} />
        )}
      </div>
    </PanelSection>
  );
}

export { ToolboxUI };
