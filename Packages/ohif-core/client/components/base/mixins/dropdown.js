import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { OHIF } from 'meteor/ohif:core';

/*
 * dropdown: controls a dropdown
 */
OHIF.mixins.dropdown = new OHIF.Mixin({
    dependencies: 'form',
    composition: {
        onRendered() {
            const instance = Template.instance();
            const { event, centered } = instance.data.options;

            // Destroy the Blaze created view (either created with template calls or with renderWithData)
            instance.destroyView = () => {
                if (typeof instance.data.destroyView === 'function') {
                    instance.data.destroyView();
                } else {
                    Blaze.remove(instance.view);
                }
            };

            // Get the dropdown element to enable position manipulation
            const $dropdown = instance.$('.dropdown');
            const dropdown = $dropdown[0];
            const $dropdownMenu = $dropdown.children('.dropdown-menu');

            dropdown.oncontextmenu = () => false;

            const cssBefore = {
                'z-index': 10000
            };
            if (event) {
                cssBefore.position = 'fixed';
                $dropdownMenu.bounded();
            }

            $dropdownMenu.css(cssBefore).focus();

            // Postpone visibility change to allow CSS transitions
            Meteor.defer(() => {
                // Show the dropdown
                $dropdown.addClass('open');

                // Change the dropdown position if mouse event was given
                if (event) {
                    const position = {
                        left: event.clientX,
                        top: event.clientY
                    };

                    if (centered) {
                        position.left -= $dropdownMenu.outerWidth() / 2;
                        position.top -= $dropdownMenu.outerHeight() / 2;
                    }

                    $dropdownMenu.css(position).trigger('spatialChanged');
                }
            });
        },

        events: {
            'click .form-action.disabled'(event, instance) {
                event.preventDefault();
                event.stopPropagation();
            },

            'click .dropdown'(event, instance) {
                const $target = $(event.target);
                if ($target.hasClass('disabled')) {
                    event.preventDefault();
                    event.stopPropagation();
                } else {
                    instance.destroyView();
                }
            }
        }
    }
});
