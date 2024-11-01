import { EventEmitter } from 'events';

class CustomEventEmitter {
  private eventEmitter = new EventEmitter();
  private lastDisplaySets: any = null;

  emitDisplaySets(displaySets: any) {
    this.lastDisplaySets = displaySets;
    this.eventEmitter.emit('viewportDataLoaded', displaySets);
  }
  getLastDisplaySets() {
    return this.lastDisplaySets;
  }

  // Attach an event listener
  on(event: string, listener: (...args: any[]) => void) {
    this.eventEmitter.on(event, listener);
  }

  // Remove an event listener
  off(event: string, listener: (...args: any[]) => void) {
    this.eventEmitter.off(event, listener);
  }
}
const eventEmitter = new CustomEventEmitter();
export default eventEmitter;
