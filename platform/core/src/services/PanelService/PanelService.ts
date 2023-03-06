import { Subscription } from '../../types/IPubSub';
import { PubSubService } from '../_shared/pubSubServiceInterface';

export const EVENTS = {
  ACTIVATE_PANEL: 'event::panelService:activatePanel',
};

export type ActivatePanelEvent = {
  panelId: string;
  forceActive: boolean;
};

export default class PanelService extends PubSubService {
  public static REGISTRATION = {
    name: 'panelService',
    altName: 'PanelService',
    create: (): PanelService => {
      return new PanelService();
    },
  };

  _panelIdToActivateTriggerSubscriptions: Map<
    string,
    Subscription[]
  > = new Map();

  constructor() {
    super(EVENTS);
  }

  reset(): void {
    const panelIds = this._panelIdToActivateTriggerSubscriptions.keys();
    for (const panelId of panelIds) {
      this.removeActivatePanelTriggers(panelId);
    }
  }

  onModeExit(): void {
    this.reset();
  }

  /**
   * Activates the panel with the given id. If the forceActive flag is false
   * then it is up to the component displaying the panel whether to activate
   * it immediately or not. For instance, the panel might not be activated when
   * the forceActive flag is false in the case where the user might have
   * activated/displayed and then closed the panel already.
   * @param panelId the panel's id
   * @param forceActive flag indicating if the panel should be forced to be activated or not
   */
  activatePanel(panelId: string, forceActive: boolean): void {
    this._broadcastEvent(EVENTS.ACTIVATE_PANEL, { panelId, forceActive });
  }

  /**
   * Adds a mapping of events (sourceTriggerEvents) broadcasted by sourcePubService that
   * when fired/broadcasted must in turn activate the panel with the given id.
   * @param panelId
   * @param forceActive
   * @param sourcePubService
   * @param sourceTriggerEvents
   */
  addActivatePanelTriggers(
    panelId: string,
    forceActive: boolean,
    sourcePubService: PubSubService,
    sourceTriggerEvents: string[]
  ): void {
    const activatePanelBound = this.activatePanel.bind(
      this,
      panelId,
      forceActive
    );

    const activatePanelSubscriptions =
      this._panelIdToActivateTriggerSubscriptions.get(panelId) ?? [];

    activatePanelSubscriptions.push(
      ...sourceTriggerEvents.map(eventName =>
        sourcePubService.subscribe(eventName, () => activatePanelBound())
      )
    );

    this._panelIdToActivateTriggerSubscriptions.set(
      panelId,
      activatePanelSubscriptions
    );
  }

  removeActivatePanelTriggers(panelId: string): void {
    this._panelIdToActivateTriggerSubscriptions
      .get(panelId)
      ?.forEach(sub => sub.unsubscribe());
    this._panelIdToActivateTriggerSubscriptions.delete(panelId);
  }
}
