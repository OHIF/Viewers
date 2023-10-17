import { ActivatePanelTriggers } from '../../types';
import { Subscription } from '../../types/IPubSub';
import { PubSubService } from '../_shared/pubSubServiceInterface';
import { ExtensionManager } from '../../extensions';

export const EVENTS = {
  PANELS_CHANGED: 'event::panelService:panelsChanged',
  ACTIVATE_PANEL: 'event::panelService:activatePanel',
};

type PanelData = {
  id: string;
  iconName: string;
  iconLabel: string;
  label: string;
  name: string;
  content: unknown;
};

export enum PanelPosition {
  Left = 'left',
  Right = 'right',
  Bottom = 'bottom',
}

export default class PanelService extends PubSubService {
  private _extensionManager: ExtensionManager;

  public static REGISTRATION = {
    name: 'panelService',
    create: ({ extensionManager }): PanelService => {
      return new PanelService(extensionManager);
    },
  };

  private _panelsGroups: Map<PanelPosition, PanelData[]> = new Map();

  constructor(extensionManager: ExtensionManager) {
    super(EVENTS);
    this._extensionManager = extensionManager;
  }

  public get PanelPosition(): typeof PanelPosition {
    return PanelPosition;
  }

  private _getPanelComponent(panelId: string) {
    const entry = this._extensionManager.getModuleEntry(panelId);

    if (!entry) {
      throw new Error(
        `${panelId} is not a valid entry for an extension module, please check your configuration or make sure the extension is registered.`
      );
    }

    if (!entry?.component) {
      throw new Error(
        `No component found from extension ${panelId}. Check the reference string to the extension in your Mode configuration`
      );
    }

    const content = entry.component;

    return { entry, content };
  }

  private _getPanelData(panelId): PanelData {
    const { content, entry } = this._getPanelComponent(panelId);

    return {
      id: entry.id,
      iconName: entry.iconName,
      iconLabel: entry.iconLabel,
      label: entry.label,
      name: entry.name,
      content,
    };
  }

  public addPanel(position: PanelPosition, panelId: string): void {
    let panels = this._panelsGroups.get(position);

    if (!panels) {
      panels = [];
      this._panelsGroups.set(position, panels);
    }

    const panelComponent = this._getPanelData(panelId);

    panels.push(panelComponent);
    this._broadcastEvent(EVENTS.PANELS_CHANGED, { position });
  }

  public addPanels(position: PanelPosition, panelsIds: string[]): void {
    if (!Array.isArray(panelsIds)) {
      throw new Error('Invalid "panelsIds" array');
    }

    panelsIds.forEach(panelId => this.addPanel(position, panelId));
  }

  public setPanels(panels: { [key in PanelPosition]: string[] }): void {
    this.reset();

    Object.keys(panels).forEach((position: PanelPosition) => {
      this.addPanels(position, panels[position]);
    });
  }

  public getPanels(position: PanelPosition): PanelData[] {
    const panels = this._panelsGroups.get(position) ?? [];

    // Return a new array to preserve the internal state
    return [...panels];
  }

  public reset(): void {
    const affectedPositions = Array.from(this._panelsGroups.keys());

    this._panelsGroups.clear();

    affectedPositions.forEach(position =>
      this._broadcastEvent(EVENTS.PANELS_CHANGED, { position })
    );
  }

  public onModeExit(): void {
    this.reset();
  }

  /**5
   * Activates the panel with the given id. If the forceActive flag is false
   * then it is up to the component containing the panel whether to activate
   * it immediately or not. For instance, the panel might not be activated when
   * the forceActive flag is false in the case where the user might have
   * activated/displayed and then closed the panel already.
   * Note that this method simply fires a broadcast event: ActivatePanelEvent.
   * @param panelId the panel's id
   * @param forceActive optional flag indicating if the panel should be forced to be activated or not
   */
  public activatePanel(panelId: string, forceActive = false): void {
    this._broadcastEvent(EVENTS.ACTIVATE_PANEL, { panelId, forceActive });
  }

  /**
   * Adds a mapping of events (activatePanelTriggers.sourceEvents) broadcast by
   * activatePanelTrigger.sourcePubSubService that
   * when fired/broadcasted must in turn activate the panel with the given id.
   * The subscriptions created are returned such that they can be managed and unsubscribed
   * as appropriate.
   * @param panelId the id of the panel to activate
   * @param activatePanelTriggers an array of triggers
   * @param forceActive optional flag indicating if the panel should be forced to be activated or not
   * @returns an array of the subscriptions subscribed to
   */
  public addActivatePanelTriggers(
    panelId: string,
    activatePanelTriggers: ActivatePanelTriggers[],
    forceActive = false
  ): Subscription[] {
    return activatePanelTriggers
      .map(trigger =>
        trigger.sourceEvents.map(eventName =>
          trigger.sourcePubSubService.subscribe(eventName, () =>
            this.activatePanel(panelId, forceActive)
          )
        )
      )
      .flat();
  }
}
