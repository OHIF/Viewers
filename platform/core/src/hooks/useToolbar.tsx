import { useCallback, useEffect, useState } from 'react';

export function useToolbar({ servicesManager, buttonSection = 'primary' }: withAppTypes) {
  const { toolbarService, viewportGridService } = servicesManager.services;
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
    const events = [
      viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
      viewportGridService.EVENTS.VIEWPORTS_READY,
    ];

    const subscriptions = events.map(event => {
      return viewportGridService.subscribe(event, ({ viewportId }) => {
        viewportId = viewportId || viewportGridService.getActiveViewportId();
        toolbarService.refreshToolbarState({ viewportId });
      });
    });

    return () => subscriptions.forEach(sub => sub.unsubscribe());
  }, [viewportGridService, toolbarService]);

  return { toolbarButtons, onInteraction };
}
