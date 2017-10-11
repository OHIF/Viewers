import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';

Template.scrollArea.onCreated(() => {
    const instance = Template.instance();
    const { data } = instance;
    const defaultConfig = {
        hideScrollbar: true,
        scrollY: true,
        scrollX: false
    };

    instance.config = _.defaults(data || {}, defaultConfig);
});

Template.scrollArea.onRendered(() => {
    const instance = Template.instance();
    const { config } = instance;
    if (config.hideScrollbar) {
        const $scrollable = instance.$('.scrollable').first();
        const scrollable = $scrollable[0];
        const x = config.scrollX ? 1 : 0;
        const y = config.scrollY ? 1 : 0;
        $scrollable.css({
            right: 0 - (scrollable.offsetWidth - scrollable.clientWidth) * y,
            bottom: 0 - (scrollable.offsetHeight - scrollable.clientHeight) * x
        });
    }
});
