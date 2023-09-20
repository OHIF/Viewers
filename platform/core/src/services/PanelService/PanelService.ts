import { ActivatePanelTriggers } from '../../types';
import { Subscription } from '../../types/IPubSub';
import { PubSubService } from '../_shared/pubSubServiceInterface';

export const EVENTS = {
  ACTIVATE_PANEL: 'event::panelService:activatePanel',
};

export default class PanelService extends PubSubService {
  public static REGISTRATION = {
    name: 'panelService',
    create: (): PanelService => {
      return new PanelService();
    },
  };

  constructor() {
    super(EVENTS);
  }

  /**
   * Activates the panel with the given id. If the forceActive flag is false
   * then it is up to the component containing the panel whether to activate
   * it immediately or not. For instance, the panel might not be activated when
   * the forceActive flag is false in the case where the user might have
   * activated/displayed and then closed the panel already.
   * Note that this method simply fires a broadcast event: ActivatePanelEvent.
   * @param panelId the panel's id
   * @param forceActive optional flag indicating if the panel should be forced to be activated or not
   */
  activatePanel(panelId: string, forceActive = false): void {
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
  addActivatePanelTriggers(
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
