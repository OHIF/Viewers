import { PubSubService } from "../services";

type Panel = {
  id: string;
  name: string;
  iconName: string;
  iconLabel: string;
  label: string;
  component: React.FC;
};

type ActivatePanelTriggers = {
  sourcePubService: PubSubService;
  sourceTriggerEventNames: string[]
}

interface PanelEvent {
  panelId: string;
}

interface ActivatePanelEvent extends PanelEvent {
  forceActive: boolean;
}

export type {
  ActivatePanelEvent,
  ActivatePanelTriggers,
  Panel,
  PanelEvent,
};
