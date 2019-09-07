/**
 * Module: pubSub.js
 * This module aims to provide a simple means to create regular/plain
 * JavaScript objects that support the pub/sub interface;
 */

const TOPICS_MAP = Symbol('PubSubTopicsMap');

const pubSubProto = {
  subscribe(topic, listener) {
    return subscribe(this, topic, listener);
  },
  unsubscribe(topic, listener) {
    return unsubscribe(this, topic, listener);
  },
  publish(topic, data) {
    return publish(this, topic, data);
  },
};

function subscribe(source, topic, listener) {
  const listeners = getTopicListeners(source, topic);
  listeners.push(listener);
}

function unsubscribe(source, topic, listener) {
  const listeners = getTopicListeners(source, topic);
  for (let i = listeners.length - 1; i >= 0; --i) {
    if (listeners[i] === listener) {
      listeners.splice(i, 1);
    }
  }
}

function publish(source, topic, data) {
  const listeners = getTopicListeners(source, topic).slice();
  const count = listeners.length;
  for (let i = 0; i < count; ++i) {
    notifyListener(listeners[i], data, source, topic);
  }
}

function getTopicListeners(source, topic) {
  const topicsMap = getTopicsMap(source);
  let listeners = topicsMap[topic];
  if (!listeners) {
    listeners = [];
    topicsMap[topic] = listeners;
  }
  return listeners;
}

function getTopicsMap(source) {
  let topicsMap = source[TOPICS_MAP];
  if (!topicsMap) {
    topicsMap = Object.create(null);
    Object.defineProperty(source, TOPICS_MAP, { value: topicsMap });
  }
  return topicsMap;
}

function notifyListener(listener, data, source, topic) {
  if (typeof listener === 'function') {
    listener.call(source, data, source, topic);
  }
}

function makePubSub(properties) {
  const pubSub = Object.create(pubSubProto);
  return Object.assign(pubSub, properties);
}

function isPubSub(subject) {
  return pubSubProto.isPrototypeOf(subject);
}

export { makePubSub, isPubSub };
