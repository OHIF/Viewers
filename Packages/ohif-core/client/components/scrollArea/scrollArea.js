import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Template.scrollArea.onCreated(() => {
    const instance = Template.instance();
    const { data } = instance;
    const defaultConfig = {
        hideScrollbar: true,
        scrollY: true,
        scrollX: false,
        scrollStep: 100
    };

    instance.config = _.defaults(data || {}, defaultConfig);
});

Template.scrollArea.onRendered(() => {
    const instance = Template.instance();

    instance.adjustMargins = _.throttle(() => {
        const { config } = instance;
        if (config.hideScrollbar) {
            const $scrollable = instance.$('.scrollable').first();
            const x = config.scrollX ? 1 : 0;
            const y = config.scrollY ? 1 : 0;
            const scrollbarSize = OHIF.ui.getScrollbarSize();
            $scrollable.css({
                'margin-right': 0 - (scrollbarSize[0]) * y,
                'margin-bottom': 0 - (scrollbarSize[1]) * x
            });
        }
    }, 150);

    instance.$scrollable = instance.$('.scrollable').first();
    instance.scrollHandler = _.throttle(event => {
        const $scrollable = event ? $(event.currentTarget) : instance.$scrollable;
        const $scrollArea = $scrollable.closest('.scroll-area');
        if ($scrollable[0] !== instance.$('.scrollable')[0]) return;
        $scrollArea.removeClass('can-scroll-up can-scroll-down');
        const height = $scrollable.outerHeight();
        const scrollTop = $scrollable.scrollTop();
        const { scrollHeight } = $scrollable[0];

        // Stop here if unable to scroll
        if (scrollHeight <= height) return;

        // Check if can scroll up
        if (scrollTop) {
            $scrollArea.addClass('can-scroll-up');
        }

        // Check if can scroll down
        if (scrollTop + height < scrollHeight) {
            $scrollArea.addClass('can-scroll-down');
        }
    }, 150);

    instance.scrollHandler();

    instance.adjustMargins();
    $(window).on('resize', instance.adjustMargins);
});

Template.scrollArea.onDestroyed(() => {
    const instance = Template.instance();
    $(window).off('resize', instance.adjustMargins);
});

Template.scrollArea.events({
    'scroll .scrollable, mouseenter .scrollable, transitionend .scrollable'(event, instance) {
        instance.scrollHandler(event);
    },

    'click .scroll-nav-down'(event, instance) {
        const $scrollable = $(event.currentTarget).siblings('.scrollable');
        const height = $scrollable.outerHeight();
        const currentTop = $scrollable.scrollTop();
        const { scrollHeight } = $scrollable[0];
        const limit = scrollHeight - height;
        let scrollTop = currentTop + instance.data.scrollStep;
        scrollTop = scrollTop > limit ? limit : scrollTop;
        $scrollable.stop().animate({ scrollTop }, 150, 'swing');
    },

    'click .scroll-nav-up'(event, instance) {
        const $scrollable = $(event.currentTarget).siblings('.scrollable');
        const currentTop = $scrollable.scrollTop();
        let scrollTop = currentTop - instance.data.scrollStep;
        scrollTop = scrollTop < 0 ? 0 : scrollTop;
        $scrollable.stop().animate({ scrollTop }, 150, 'swing');
    },
});
