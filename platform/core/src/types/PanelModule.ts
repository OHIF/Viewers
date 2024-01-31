import { PubSubService } from '../services';

type Panel = {
  id?: string;
  name: string;
  iconName: string;
  iconLabel: string;
  label: string;
  component: React.FC;
};

type EventTriggers = {
  event: string;
  // if callback is not provided, the event will be triggered
  // if callback is provided, the event will be triggered only if callback returns true
  callback?: (event: PanelEvent) => boolean;
}[];

type ActivatePanelTriggers = {
  service: PubSubService;
  // triggers are either list of events (String[]), or a custom
  // event and callback that returns true if the event should be triggered
  triggers: EventTriggers | string[];
};

interface PanelEvent {
  panelId: string;
}

interface ActivatePanelEvent extends PanelEvent {
  forceActive: boolean;
}

export type { ActivatePanelEvent, ActivatePanelTriggers, Panel, PanelEvent };
