import { OHIF } from 'meteor/ohif:core';
import { Session } from 'meteor/session';
import { Servers, CurrentServer } from 'meteor/ohif:servers/both/collections';

/**
 * Recreates a current server with GCloud config
 */
OHIF.servers.applyCloudServerConfig = (config) => {
    Session.set('GCP_HEALTHCARE_CONFIG', config);
    CurrentServer.remove({});
    if (!config)
        return;
    config.name = "gcs";
    config.imageRendering = "wadors";
    config.origin = "json";
    config.thumbnailRendering = "wadors";
    config.qidoSupportsIncludeField = false;
    config.type = "dicomweb";
    config.requestOptions = {};
    config.requestOptions.requestFromBrowser = true;
    config.origin = 'json';
    config.type = 'dicomWeb';
    config.isCloud = true;
    const serverId = Servers.insert(config);
    CurrentServer.insert({
        serverId
    });
};