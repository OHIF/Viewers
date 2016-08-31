Template.serverInformationDimse.onCreated(() => {
    const instance = Template.instance();
    instance.peers = new ReactiveVar([]);
    instance.autorun(() => {
        const currentItem = instance.data.currentItem.get();
        if (currentItem) {
            instance.peers.set(currentItem.peers || []);
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

Template.serverInformationDimse.events({
    'click .js-new-peer'(event, instance) {
        event.preventDefault();
        const peers = instance.peers.get();
        peers.push({});
        instance.peers.set(peers);
    }
});
