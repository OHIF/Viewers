// increase the event emitter limit
import { EventEmitter } from 'events';

EventEmitter.defaultMaxListeners = 25;

// process
process.setMaxListeners(1000);
