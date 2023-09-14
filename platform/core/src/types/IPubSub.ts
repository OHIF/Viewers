import Consumer from './Consumer';

export default interface IPubSub {
  subscribe: (eventName: string, callback: Consumer) => void;
  _broadcastEvent: (eventName: string, callbackProps: Record<string, unknown>) => void;
  _unsubscribe: (eventName: string, listenerId: string) => void;
  _isValidEvent: (eventName: string) => boolean;
}

export type Subscription = {
  unsubscribe: () => void;
};
