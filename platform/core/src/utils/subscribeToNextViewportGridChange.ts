import { ViewportGridService } from '../services';

/**
 * Subscribes to the very next LAYOUT_CHANGED event that
 * is not currently on the event queue. The subscriptions are made on a 'zero'
 * timeout so as to avoid responding to any of those events currently on the event queue.
 * The subscription persists only for a single invocation of either event.
 * Once either event is fired, the subscriptions are unsubscribed.
 * @param viewportGridService the viewport grid service to subscribe to
 * @param gridChangeCallback the callback
 */
function subscribeToNextViewportGridChange(
  viewportGridService: ViewportGridService,
  gridChangeCallback: (arg: unknown) => void
): void {
  const subscriber = () => {
    const callback = (callbackProps: unknown) => {
      subscriptions.forEach(subscription => subscription.unsubscribe());
      gridChangeCallback(callbackProps);
    };

    const subscriptions = [
      viewportGridService.subscribe(viewportGridService.EVENTS.LAYOUT_CHANGED, callback),
    ];
  };

  window.setTimeout(subscriber, 0);
}

export { subscribeToNextViewportGridChange };
