import Synchronizer from './Synchronizer_CSToolsFork';

const createSynchronizer = (eventName, eventHandler) => {
  return new Synchronizer(eventName, eventHandler);
};

export default createSynchronizer;
