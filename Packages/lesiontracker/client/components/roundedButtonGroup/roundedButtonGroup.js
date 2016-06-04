Template.roundedButtonGroup.onRendered(() => {
    const instance = Template.instance();
    const value = instance.data.value;
    if (!value.get()) {
        value.set(instance.data.options[0].key);
    }
});

Template.roundedButtonGroup.events({
    'click [data-key]'(event, instance) {
        const $element = $(event.currentTarget);
        const key = $element.attr('data-key');
        instance.data.value.set(key);
    }
});
