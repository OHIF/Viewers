import { OHIF } from 'meteor/ohif:core';
import { Servers, CurrentServer } from 'meteor/ohif:servers/both/collections';

const devModeMediator = {};
export default devModeMediator;

const DEMO_SERVER_NAME = "demo-dcm4chee";

devModeMediator.login = () => sessionStorage.setItem('isDemoUserSignedIn', true);

devModeMediator.logout = () => sessionStorage.remove('isDemoUserSignedIn');

devModeMediator.userLoggedIn = () => sessionStorage.getItem('isDemoUserSignedIn');

devModeMediator.setDemoServerConfig = () => {
    CurrentServer.remove({});
    const demoServer = Servers.findOne({ name: DEMO_SERVER_NAME });
    if (!demoServer)
        throw new Error("demoServer is not found");
    CurrentServer.insert({
        serverId: demoServer._id
    });
};