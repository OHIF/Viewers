import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';

/*
 * dropdown: controls a dropdown
 */
OHIF.mixins.dropdown = new OHIF.Mixin({
    dependencies: 'form',
    composition: {
        onRendered() {
            const instance = Template.instance();
            const { event, centered, marginTop } = instance.data.options;
            // Get the dropdown element to enable position manipulation
            const $dropdown = instance.$('.dropdown');
            const dropdown = $dropdown[0];
            const $dropdownMenu = $dropdown.children('.dropdown-menu');

            // Destroy the Blaze created view (either created with template calls or with renderWithData)
            instance.destroyView = () => {
                const destroyHandle = () => {
                    if (typeof instance.data.destroyView === 'function') {
                        instance.data.destroyView();
                    } else {
                        Blaze.remove(instance.view);
                    }
                };

                const timeout = setTimeout(destroyHandle, 500);
                $dropdownMenu.one('transitionend', () => {
                    destroyHandle();
                    clearTimeout(timeout);
                });
                $dropdown.removeClass('open');
            };

            // Destroy the view when the promise is fullfilled
            instance.data.promise.then(instance.destroyView, instance.destroyView);

            // Close the dropdown resolving or rejecting the promise
            instance.close = (isResolve, result) => {
                const method = instance.data[isResolve ? 'promiseResolve' : 'promiseReject'];
                method(result);
            };

            // Stop here and destroy the view if no items was given
            if (!instance.data.items.length) {
                return instance.close(false);
            }

            dropdown.oncontextmenu = () => false;

            const cssBefore = { 'z-index': 10000 };
            if (event) {
                cssBefore.position = 'fixed';
                $dropdownMenu.bounded();
            }

            if (marginTop) {
                cssBefore['margin-top'] = marginTop;
            }

            $dropdownMenu.css(cssBefore);

            // Postpone visibility change to allow CSS transitions
            Meteor.defer(() => {
                // Show the dropdown and focus the first option
                $dropdown.addClass('open').find('a:first').focus();

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
            'click .form-action'(event, instance) {
                event.stopPropagation();
                const $target = $(event.currentTarget);
                const isDisabled = $target.hasClass('disabled');
                if (isDisabled) {
                    instance.close(false);
                } else {
                    const component = $target.data('component');
                    instance.close(true, component.actionResult);
                }
            },

            'click .dropdown'(event, instance) {
                const $target = $(event.target);
                if ($target.hasClass('disabled')) {
                    event.preventDefault();
                    event.stopPropagation();
                } else {
                    instance.close(false);
                }
            },

            'blur .dropdown'(event, instance) {
                Meteor.defer(() => {
                    const $focus = $(':focus');
                    if (!$focus.length || !$.contains(event.currentTarget, $focus[0])) {
                        instance.close(false);
                    }
                });
            }
        }
    }
});
