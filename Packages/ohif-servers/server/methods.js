import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

Meteor.methods({
    serverFind: query => OHIF.servers.control.find(query),
    serverSave: serverSettings => OHIF.servers.control.save(serverSettings),
    serverSetActive: serverId => OHIF.servers.control.setActive(serverId),
    serverRemove: serverId => OHIF.servers.control.remove(serverId)
});
