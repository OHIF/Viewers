import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { _ } from 'meteor/underscore';

Template.serverInformationDimse.onCreated(() => {
    const instance = Template.instance();
    instance.peers = new ReactiveVar([]);
    instance.autorun(() => {
        const currentItem = instance.data.currentItem.get();
        if (currentItem) {
            instance.peers.set(currentItem.peers || []);
        }
    });
    const api = instance.data.api;
    _.extend(api, {
        newPeer() {
            const peers = instance.peers.get();
            peers.push({});
            instance.peers.set(peers);
        },

        removePeer(peerIndex) {
            const peers = instance.peers.get();
            peers.splice(peerIndex, 1);
            instance.peers.set(peers);

            const data = instance.data.currentItem.get();
            data.peers = peers;
            Tracker.afterFlush(() => instance.data.form.value(data));
        }
    });
});

Template.serverInformationDimse.onRendered(() => {
    const instance = Template.instance();
    instance.autorun(() => {
        const mode = instance.data.mode.get();
        if (mode === 'edit') {
            const data = instance.data.currentItem.get();
            instance.data.form.value(data);
        }
    });
});
