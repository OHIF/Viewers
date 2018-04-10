import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';

let zIndexBackdrop = 1060;
let zIndexModal = 1061;

OHIF.ui.showDialog = (templateName, dialogData={}) => {
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
    if (dialogData && dialogData.promise instanceof Promise) {
        // Use the given promise to control the modal
        promise = dialogData.promise;
        templateData = dialogData;
    } else {
        // Create a new promise to control the modal and store its resolve and reject callbacks
        let promiseResolve;
        let promiseReject;
        promise = new Promise((resolve, reject) => {
            promiseResolve = resolve;
            promiseReject = reject;
        });

        // Render the dialog with the given template passing the promise object and callbacks
        templateData = _.extend({}, dialogData, {
            promise,
            promiseResolve,
            promiseReject
        });
    }

    const view = Blaze.renderWithData(template, templateData, document.body);

    const node = view.firstNode();
    const $node = node && $(node);

    let $modal;
    if ($node && $node.hasClass('modal')) {
        $modal = $node;
    } else if ($node && $node.has('.modal')) {
        $modal = $node.find('.modal:first');
    }

    $modal.one('show.bs.modal', function() {
        setTimeout(() => {
            const $modal = $(this);
            const modal = $modal.data('bs.modal');
            if (!modal) return;
            const { $backdrop } = modal;
            if (!$backdrop) return;
            $backdrop.css('z-index', zIndexBackdrop);
            $modal.css('z-index', zIndexModal);
            zIndexBackdrop += 2;
            zIndexModal += 2;
        });
    });

    // Destroy the created dialog view when the promise is either resolved or rejected
    const dismissModal = (hideFirst=false) => {
        if (hideFirst || (dialogData && dialogData.promise && $modal)) {
            $modal.one('hidden.bs.modal', () => Blaze.remove(view)).modal('hide');
        } else {
            Blaze.remove(view);
        }
    };

    // Create a handler to dismiss the modal on navigation
    const $body = $(document.body);
    const navigationHandler = () => {
        dismissModal(true);
        $body.off('ohif.navigated', navigationHandler);
    };

    promise.then(() => dismissModal(false)).catch(() => dismissModal(false));

    // Dismiss the modal if navigation occurs and it should not be kept opened
    if (!dialogData.keepOpenOnNavigation) {
        $body.on('ohif.navigated', navigationHandler);
    }

    // Return the promise to allow callbacks stacking from outside
    return promise;
};
