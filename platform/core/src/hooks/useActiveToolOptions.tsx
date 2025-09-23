import { useSystem } from '../contextProviders/SystemProvider';
import { ButtonProps } from '../services/ToolBarService/types';
import { useToolbar } from './useToolbar';

type UseActiveToolOptionsProps = {
  buttonSectionId: string;
};

export function useActiveToolOptions({ buttonSectionId }: UseActiveToolOptionsProps) {
  const { servicesManager } = useSystem();
  const { toolbarService } = servicesManager.services;

  const { toolbarButtons } = useToolbar({
    buttonSection: buttonSectionId,
  });

  // Helper to check a list of buttons for an active tool.
  const findActiveOptions = (buttons: any[]): unknown => {
    for (const tool of buttons) {
      if (tool.componentProps.isActive) {
        return {
          activeToolOptions: tool.componentProps.options,
          activeToolButtonId: tool.componentProps.id,
        };
      }
      if (tool.componentProps.buttonSection) {
        const nestedButtons = toolbarService.getButtonPropsInButtonSection(
          tool.componentProps.buttonSection
        ) as ButtonProps[];
        const activeNested = nestedButtons.find(nested => nested.isActive);
        if (activeNested) {
          return {
            activeToolOptions: activeNested.options,
            activeToolButtonId: activeNested.id,
          };
        }
      }
    }
    return null;
  };

  // Look for active tool options across all sections.
  const activeOptions = toolbarButtons.reduce((activeOptions, button) => {
    if (activeOptions) {
      return activeOptions;
    }
    const sectionId = button.componentProps.buttonSection;
    const buttons = sectionId ? toolbarService.getButtonSection(sectionId) : [button];
    return findActiveOptions(buttons);
  }, null);

  return activeOptions ?? {};
}
