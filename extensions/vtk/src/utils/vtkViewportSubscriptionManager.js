const subscriptions = [];

// This is pretty hacky right now, but it makes sure we don't keep adding subscriptions.
// TODO -> Nuke this and move it up a layer once we have more vigorous layout support.

const vtkViewportSubscriptionManager = {
  subscriptions,
  pushSubscription(viewportIndex, subscription) {
    if (!Array.isArray(subscriptions[viewportIndex])) {
      subscriptions[viewportIndex] = [];
    }

    subscriptions[viewportIndex].push(subscription);
  },
  unsubscribe(viewportIndex) {
    if (!subscriptions[viewportIndex]) {
      return;
    }

    while (subscriptions[viewportIndex].length) {
      subscriptions[viewportIndex].pop().unsubscribe();
    }

    subscriptions[viewportIndex] = null;
  },
};

export default vtkViewportSubscriptionManager;
