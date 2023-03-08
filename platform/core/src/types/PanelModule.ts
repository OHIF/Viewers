type Panel = {
  id: string;
  name: string;
  iconName: string;
  iconLabel: string;
  label: string;
  component: React.FC;
};

type PanelDefaultState = {
  closed: boolean; // indicates if the default state of the panel should be hidden/closed
  openWhenPanelActivated: boolean; // if the default state is closed, indicates if panel should be shown when it requests to be activated
}

interface PanelEvent {
  panelId: string;
}

interface ActivatePanelEvent extends PanelEvent {
  forceActive: boolean;
}

export type {
  ActivatePanelEvent,
  Panel,
  PanelEvent,
  PanelDefaultState,
};
