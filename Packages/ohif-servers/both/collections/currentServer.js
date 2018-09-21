import { Mongo } from 'meteor/mongo';
import { OHIF } from 'meteor/ohif:core';

// CurrentServer is a single document collection to describe which of the Servers is being used
let collectionName = 'currentServer';
if (Meteor.settings && Meteor.settings.public && Meteor.settings.public.clientOnly === true) {
    collectionName = null;
}

const CurrentServer = new Mongo.Collection(collectionName);
CurrentServer._debugName = 'CurrentServer';
OHIF.servers.collections.currentServer = CurrentServer;

export { CurrentServer };
