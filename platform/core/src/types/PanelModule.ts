import { PubSubService } from '../services';

type Panel = {
  id?: string;
  name: string;
  iconName: string;
  iconLabel: string;
  label: string;
  component: React.FC;
  /**
   * The contexts in which the panel is available. if not provided,
   * internals of OHIF will add 'VIEWER' context to the panel by default.
   * If the panel is not available in any context, you should
   * provide the contexts explicitly. e.g., the 4D panel is only
   * available if the active viewport is a 4D viewport.
   */
  contexts?: string[];
};

type ActivatePanelTriggers = {
  sourcePubSubService: PubSubService;
  sourceEvents: string[];
};

interface PanelEvent {
  panelId: string;
}

interface ActivatePanelEvent extends PanelEvent {
  forceActive: boolean;
}

export type { ActivatePanelEvent, ActivatePanelTriggers, Panel, PanelEvent };
