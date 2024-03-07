import { useCallback, useEffect, useState } from 'react';

export function useToolbar({ servicesManager, buttonSection = 'primary' }) {
  const { toolbarService, viewportGridService, cornerstoneViewportService } =
    servicesManager.services;
  const { EVENTS } = toolbarService;

  const [toolbarButtons, setToolbarButtons] = useState(
    toolbarService.getButtonSection(buttonSection)
  );

  // Callback function for handling toolbar interactions
  const onInteraction = useCallback(
    args => {
      const viewportId = viewportGridService.getActiveViewportId();
      const refreshProps = {
        viewportId,
      };
      toolbarService.recordInteraction(args, {
        refreshProps,
      });
    },
    [toolbarService, viewportGridService]
  );

  // Effect to handle toolbar modification events
  useEffect(() => {
    const handleToolbarModified = () => {
      setToolbarButtons(toolbarService.getButtonSection(buttonSection));
    };

    const subs = [EVENTS.TOOL_BAR_MODIFIED, EVENTS.TOOL_BAR_STATE_MODIFIED].map(event => {
      return toolbarService.subscribe(event, handleToolbarModified);
    });

    return () => {
      subs.forEach(sub => sub.unsubscribe());
    };
  }, [toolbarService]);

  // Effect to handle active viewportId change event
  useEffect(() => {
    const subscription = viewportGridService.subscribe(
      viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
      ({ viewportId }) => {
        toolbarService.refreshToolbarState({ viewportId });
      }
    );

    return () => subscription.unsubscribe();
  }, [viewportGridService, toolbarService]);

  // Effect to handle viewport data change event
  useEffect(() => {
    const subscription = cornerstoneViewportService.subscribe(
      cornerstoneViewportService.EVENTS.VIEWPORT_DATA_CHANGED,
      ({ viewportId }) => {
        toolbarService.refreshToolbarState({ viewportId });
      }
    );

    return () => subscription.unsubscribe();
  }, [cornerstoneViewportService, toolbarService, viewportGridService]);

  return { toolbarButtons, onInteraction };
}
