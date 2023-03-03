import { ServicesManager } from "../services";

type PanelContentReadyCallback = () => void;

type Panel = {
  name: string;
  iconName: string;
  iconLabel: string;
  label: string;
  component: React.FC;

  /**
   * Sets the panel's content ready callback. Implementations MUST unsubscribe and clear the previous
   * callback for every call made to this method. The callback can be null, in which case the
   * previous callback is simply unsubscribed and cleared.
   * @param callback the callback to invoke when the panel is ready to show
   * @param servicesManager the ServicesManager
   */
  setContentReadyCallback?: (callback: PanelContentReadyCallback, servicesManager: ServicesManager) => void;
};

type PanelDefaultState = {
  closed: boolean; // indicates if default state of panel should be hidden/closed
  openWhenContentReady: boolean; // if the default state is closed, indicates if panel should be shown when it is ready
}

export type {
  Panel,
  PanelDefaultState,
  PanelContentReadyCallback,
};
