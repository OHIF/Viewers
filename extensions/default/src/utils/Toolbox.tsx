import React, { useState } from 'react';
import { Icons, PanelSection, ToolSettings } from '@ohif/ui-next';
import { useSystem, useToolbar, useActiveToolOptions } from '@ohif/core';
import { useTranslation } from 'react-i18next';

/**
 * Props for the Toolbox component that renders a collection of toolbar button sections.
 */
interface ToolboxProps {
  /**
   * The unique identifier of the button section this toolbox represents.
   */
  buttonSectionId: string;

  /**
   * The display title for the toolbox.
   */
  title: string;
}

/**
 * A toolbox is a collection of buttons and commands that they invoke, used to provide
 * custom control panels to users. This component is a generic UI component that
 * interacts with services and commands in a generic fashion. While it might
 * seem unconventional to import it from the UI and integrate it into the JSX,
 * it belongs in the UI components as there isn't anything in this component that
 * couldn't be used for a completely different type of app. It plays a crucial
 * role in enhancing the app with a toolbox by providing a way to integrate
 * and display various tools and their corresponding options
 */
export function Toolbox({ buttonSectionId, title }: ToolboxProps) {
  const { servicesManager } = useSystem();
  const { t } = useTranslation();

  const { toolbarService, customizationService } = servicesManager.services;
  const [showConfig, setShowConfig] = useState(false);

  const { toolbarButtons: toolboxSections, onInteraction } = useToolbar({
    buttonSection: buttonSectionId,
  });

  const { activeToolOptions } = useActiveToolOptions({ buttonSectionId });

  if (!toolboxSections.length) {
    return null;
  }

  // Ensure we have proper button sections at the top level.
  if (!toolboxSections.every(section => section.componentProps.buttonSection)) {
    throw new Error(
      'Toolbox accepts only button sections at the top level, not buttons. Create at least one button section.'
    );
  }

  // Define the interaction handler once.
  const handleInteraction = ({ itemId }: { itemId: string }) => {
    onInteraction?.({ itemId });
  };

  const CustomConfigComponent = customizationService.getCustomization(`${buttonSectionId}.config`);

  return (
    <PanelSection>
      <PanelSection.Header className="flex items-center justify-between">
        <span>{t(title)}</span>
        {CustomConfigComponent && (
          <div className="ml-auto mr-2">
            <Icons.Settings
              className="text-primary h-4 w-4"
              onClick={e => {
                e.stopPropagation();
                setShowConfig(!showConfig);
              }}
            />
          </div>
        )}
      </PanelSection.Header>

      <PanelSection.Content className="bg-muted flex-shrink-0 border-none">
        {showConfig && <CustomConfigComponent />}
        {toolboxSections.map(section => {
          const sectionId = section.componentProps.buttonSection;
          const buttons = toolbarService.getButtonSection(sectionId) as any[];

          return (
            <div
              key={sectionId}
              className="bg-muted flex flex-wrap gap-2 py-2 px-1"
            >
              {buttons.map(tool => {
                // Skip over tools that are not visible. The visible flag is typically set to
                // false as a result of the evaluator function. The evaluator might explicitly
                // set visible to false. Alternatively, the ToolbarService will set the visible flag to
                // false when the evaluator sets disabled to true and the tool has the hideWhenDisabled flag set to true.
                if (!tool || !tool.componentProps.visible) {
                  return null;
                }
                const { id, Component, componentProps } = tool;

                return (
                  <div key={id}>
                    <Component
                      {...componentProps}
                      id={id}
                      onInteraction={handleInteraction}
                      size="toolbox"
                      servicesManager={servicesManager}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
        {activeToolOptions && (
          <div className="bg-primary-dark mt-1 h-auto px-2">
            <ToolSettings options={activeToolOptions} />
          </div>
        )}
      </PanelSection.Content>
    </PanelSection>
  );
}
