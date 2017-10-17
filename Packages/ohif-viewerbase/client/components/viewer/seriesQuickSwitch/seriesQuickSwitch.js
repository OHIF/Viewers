import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';

// FIXME >>>> REMOVE
$(document.body).on('keydown', e => (e.keyCode === 69 && $('.quickSwitchWrapper').toggle()) || 1);

Template.seriesQuickSwitch.helpers({
    shallDisplay() {
        const instance = Template.instance();
        const { rows, columns } = instance.data;
        return OHIF.uiSettings.displaySeriesQuickSwitch && rows === 1 && columns <= 2;
    },

    side() {
        const instance = Template.instance();
        const { columns, viewportIndex } = instance.data;
        if (columns === 1) return '';
        return viewportIndex === 0 ? 'left' : 'right';
    }
});

Template.seriesQuickSwitch.events({
    'mouseenter .series-switch'(event, instance) {
        const $switch = $(event.currentTarget);
        const browserWidth = $switch.offset().left + $switch.outerWidth();
        $switch.find('.series-browser').width(browserWidth);
    }
});
