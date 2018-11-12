import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { OHIF } from 'meteor/ohif:core';

OHIF.ui.showPopover = (templateName, popoverData, options={}) => {
    // Check if the given template exists
    const template = Template[templateName];
    if (!template) {
        throw {
            name: 'TEMPLATE_NOT_FOUND',
            message: `Template ${templateName} not found.`
        };
    }

    let promise;
    let templateData;
    if (popoverData && popoverData.promise instanceof Promise) {
        // Use the given promise to control the modal
        promise = popoverData.promise;
        templateData = popoverData;
    } else {
        // Create a new promise to control the modal and store its resolve and reject callbacks
        let promiseResolve;
        let promiseReject;
        promise = new Promise((resolve, reject) => {
            promiseResolve = resolve;
            promiseReject = reject;
        });

        // Render the dialog with the given template passing the promise object and callbacks
        templateData = Object.assign({}, popoverData, {
            promise,
            promiseResolve,
            promiseReject
        });
    }

    const { element, event } = options;
    const $element = $(element || event.currentTarget);

    const defaults = {
        content: '',
        html: true,
        trigger: 'manual',
        placement: 'auto',
        delay: {
            show: 300,
            hide: 300
        }
    };

    const popoverOptions = Object.assign({} , defaults, options);
    popoverOptions.content = Blaze.toHTMLWithData(template, popoverData);

    if (popoverOptions.hideOnClick) {
        $element.click(function() {
            $(this).popover('hide');
        });
    }

    $element.popover(popoverOptions);

    if (popoverOptions.trigger !== 'hover') {
        $element.one('shown.bs.popover', function(event) {
            const popoverId = $element.attr('aria-describedby');
            const popover = document.getElementById(popoverId);
            const $popover = $(popover);
            const $popoverContent = $popover.find('.popover-content');
            const dismissPopover = () => $element.popover('hide');

            $popoverContent.html('');

            const view = Blaze.renderWithData(template, templateData, $popoverContent[0]);
            $element.one('hidden.bs.popover', () => {
                Blaze.remove(view);
                $element.popover('destroy');
            });

            promise.then(dismissPopover).catch(dismissPopover);
        });
    }

    if (popoverOptions.trigger === 'manual') {
        $element.popover('show');
    }

    return promise;
};
