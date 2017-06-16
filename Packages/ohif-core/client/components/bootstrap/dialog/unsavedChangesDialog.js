import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';

const MARGIN_RIGHT = 15;
const MARGIN_BOTTOM = 15;

Template.unsavedChangesDialog.onRendered(function() {

    const instance = Template.instance();
    const $modal = instance.$('.modal.unsavedChangesDialog');

    // Routine which effectively displays the BS modal...
    instance.displayModal = () => {

        // Make modal options extensible...
        const modalOptions = _.extend({
            backdrop: 'static',
            keyboard: false
        }, instance.data.modalOptions);

        // Set handler for "hidden" event... Simply remove the view!
        $modal.one('hidden.bs.modal', () => {
            Blaze.remove(instance.view);
        });

        // Create the bootstrap modal
        $modal.modal(modalOptions);

    };

    // Routine which repositions the modal before display...
    instance.displayModalWithPosition = (position) => {

        // Preserve original CSS rules...
        const origCSS = {
            display: $modal.css('display'),
            visibility: $modal.css('visibility')
        };

        // Make sure modal is propperly rendered before proceeding with math...
        if (origCSS.display === 'none') {
            $modal.css({
                visibility: 'hidden',
                display: 'block'
            });
        }

        // Run presentation code on next tick...
        setTimeout(() => {

            let dimension;
            const $dialog = $modal.find('.modal-dialog');

            const dialogRect = {
                position: {
                    x: parseInt(position.x) || 0,
                    y: parseInt(position.y) || 0
                },
                size: {
                    width: $dialog.outerWidth(),
                    height: $dialog.outerHeight()
                }
            };

            const modalSize = {
                width: $modal.width(),
                height: $modal.height()
            };

            dimension = dialogRect.position.x + dialogRect.size.width + MARGIN_RIGHT;
            if (dimension > modalSize.width) {
                dialogRect.position.x -= dimension - modalSize.width;
            }

            if (dialogRect.position.x < 0) {
                dialogRect.position.x = 0;
            }

            dimension = dialogRect.position.y + dialogRect.size.height + MARGIN_BOTTOM;
            if (dimension > modalSize.height) {
                dialogRect.position.y -= dimension - modalSize.height;
            }

            if (dialogRect.position.y < 0) {
                dialogRect.position.y = 0;
            }

            // Restore original CSS...
            $modal.css(origCSS);

            // Set new position...
            $dialog.css({
                position: 'fixed',
                margin: 0,
                left: dialogRect.position.x,
                top: dialogRect.position.y
            });

            instance.displayModal();

        }, 0);

    };

    // Check if modal will be presented with custom positioning...
    let position = instance.data.position;
    if (position && 'x' in position && 'y' in position) {
        instance.displayModalWithPosition(position);
    } else {
        instance.displayModal();
    }

});

Template.unsavedChangesDialog.events({

    'click button[data-choice]'(event) {

        const instance = Template.instance();
        const callback = instance.data.callback;
        const choice = $(event.currentTarget).attr('data-choice') || '';

        // if callback is a function, call it passing user choice...
        if (typeof callback === 'function') {
            callback.call(instance, choice);
        }

    }

});
