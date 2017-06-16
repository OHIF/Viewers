import { Mongo } from 'meteor/mongo';
import { OHIF } from 'meteor/ohif:core';

// CurrentServer is a single document collection to describe which of the Servers is being used
const CurrentServer = new Mongo.Collection('currentServer');
CurrentServer._debugName = 'CurrentServer';
OHIF.servers.collections.currentServer = CurrentServer;

export { CurrentServer };
