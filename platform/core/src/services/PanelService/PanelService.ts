import { Subscription } from '../../types/IPubSub';
import { PanelEvent } from '../../types/PanelModule';
import { PubSubService } from '../_shared/pubSubServiceInterface';

export const EVENTS = {
  ACTIVATE_PANEL: 'event::panelService:activatePanel',
};

export default class PanelService {
  public static REGISTRATION = {
    name: 'panelService',
    create: (): PanelService => {
      return new PanelService();
    },
  };

  EVENTS = EVENTS;

  private panelPubSub: Map<string, PubSubService> = new Map();

  /**
   * Activates the panel with the given id. If the forceActive flag is false
   * then it is up to the component displaying the panel whether to activate
   * it immediately or not. For instance, the panel might not be activated when
   * the forceActive flag is false in the case where the user might have
   * activated/displayed and then closed the panel already.
   * <p>
   * Note that this method simply fires a broadcast event: ActivatePanelEvent.
   * @param panelId the panel's id
   * @param forceActive optional flag indicating if the panel should be forced to be activated or not
   */
  activatePanel(panelId: string, forceActive = false): void {
    this.panelPubSub
      .get(panelId)
      ?._broadcastEvent(EVENTS.ACTIVATE_PANEL, { panelId, forceActive });
  }

  /**
   * Subscribes to the given event for the specified panel.
   * @param eventName the name of the event to subscribe to
   * @param panelId the id of the panel for the event to subscribe to
   * @param callback the callback for when the event is fired
   * @returns the Subscription
   */
  subscribe(
    eventName: string,
    panelId: string,
    callback: (event: PanelEvent) => void
  ): Subscription {
    if (!this.panelPubSub.has(panelId)) {
      this.panelPubSub.set(panelId, new PubSubService(EVENTS));
    }

    return this.panelPubSub.get(panelId).subscribe(eventName, callback);
  }

  /**
   * Adds a mapping of events (sourceTriggerEvents) broadcasted by sourcePubService that
   * when fired/broadcasted must in turn activate the panel with the given id.
   * <p>
   * The subscriptions created are returned such that they can be managed and unsubscribed
   * as appropriate.
   * @param panelId the id of the panel to activate
   * @param sourcePubService the source broadcast service firing the source trigger events
   * @param sourceTriggerEvents the source trigger events
   * @param forceActive optional flag indicating if the panel should be forced to be activated or not
   * @returns an array of the subscriptions subscribed to
   */
  addActivatePanelTriggers(
    panelId: string,
    sourcePubService: PubSubService,
    sourceTriggerEvents: string[],
    forceActive = false
  ): Subscription[] {
    const activatePanelBound = this.activatePanel.bind(
      this,
      panelId,
      forceActive
    );

    return sourceTriggerEvents.map(eventName =>
      sourcePubService.subscribe(eventName, () => activatePanelBound())
    );
  }
}
