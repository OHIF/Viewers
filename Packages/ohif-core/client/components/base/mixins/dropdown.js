import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { ReactiveVar } from 'meteor/reactive-var';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

/*
 * dropdown: controls a dropdown
 */
OHIF.mixins.dropdown = new OHIF.Mixin({
    dependencies: 'form',
    composition: {
        onRendered() {
            const instance = Template.instance();
            const { event, centered, marginTop, $parentLi, reactiveClose } = instance.data.options;
            // Get the dropdown element to enable position manipulation
            const $dropdown = instance.$('.dropdown');
            const dropdown = $dropdown[0];
            const $dropdownMenu = $dropdown.children('.dropdown-menu');

            // Get the timeout to dismiss the dropdown form
            let { dismissTimeout } = instance.data.options;
            if (_.isUndefined(dismissTimeout)) {
                dismissTimeout = 500;
            }

            // Set a opening state to the component
            instance.opening = true;

            // Destroy the Blaze created view (either created with template calls or with renderWithData)
            instance.destroyView = () => {
                const destroyHandle = () => {
                    if (typeof instance.data.destroyView === 'function') {
                        instance.data.destroyView();
                    } else {
                        Blaze.remove(instance.view);
                    }
                };

                const timeout = setTimeout(destroyHandle, dismissTimeout);
                $dropdownMenu.one('transitionend', () => {
                    destroyHandle();
                    clearTimeout(timeout);
                });
                $dropdown.removeClass('open');
            };

            // Destroy the view when the promise is fullfilled
            instance.data.promise.then(instance.destroyView, instance.destroyView);

            // Close submenu if exists
            instance.closeSubmenu = focusSelf => {
                if (instance.reactiveClose) {
                    if (focusSelf) {
                        $(instance.lastSubmenu).focus();
                    }

                    instance.reactiveClose.set(true);
                    delete instance.reactiveClose;
                    delete instance.lastSubmenu;
                }
            };

            // Close the dropdown resolving or rejecting the promise
            instance.close = (isResolve, result) => {
                const method = instance.data[isResolve ? 'promiseResolve' : 'promiseReject'];
                const param = result instanceof Promise ? null : result;
                method(param);
                instance.closeSubmenu(false);
                instance.closed = true;
            };

            // Close the dropdown if the reactiveClose suffered changes
            if (reactiveClose) {
                instance.autorun(() => {
                    const isClosed = reactiveClose.get();
                    if (!isClosed) return;
                    instance.close(false);
                });
            }

            // Stop here and destroy the view if no items was given
            if (!instance.data.items.length) {
                return instance.close(false);
            }

            dropdown.oncontextmenu = () => false;

            const cssBefore = {};
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

                // Add a handler to change the opening state
                $dropdownMenu.one('transitionend', event => {
                    instance.opening = false;
                });

                // Change the dropdown position if mouse event was given
                if (event) {
                    const originalEventTouches = event.originalEvent && event.originalEvent.touches;
                    const position = {
                        left: 0,
                        top: 0
                    };

                    if (originalEventTouches && originalEventTouches.length > 0) {
                        position.left = originalEventTouches[0].pageX;
                        position.top = originalEventTouches[0].pageY;
                    } else {
                        position.left = event.clientX;
                        position.top = event.clientY;
                    }

                    if (centered) {
                        // Center the dropdown menu based on the event mouse position
                        position.left -= $dropdownMenu.outerWidth() / 2;
                        position.top -= $dropdownMenu.outerHeight() / 2;
                    } else if ($parentLi) {
                        // Change the dropdown menu position based on the parent menu item
                        const $parentDm = $parentLi.closest('.dropdown-menu');
                        const dmWidth = $dropdownMenu.outerWidth();
                        const pdmWidth = $parentDm.outerWidth();
                        const pdmOffset = $parentDm.offset();
                        const pliOffset = OHIF.ui.getOffset($parentLi[0]);
                        Object.assign(position, {
                            left: pdmWidth + pdmOffset.left,
                            top: pliOffset.top
                        });

                        // Check if the element position is going beyond the window right boundary
                        let rightToLeft = false;
                        if (position.left < pdmOffset.left + pdmWidth || position.left > document.body.clientWidth - dmWidth) {
                            position.left -= pdmWidth + $dropdownMenu.outerWidth();
                            rightToLeft = true;
                        }

                        const menuClass = rightToLeft ? 'origin-top-right' : 'origin-top-left';
                        $dropdownMenu.addClass(menuClass);
                    }

                    // Fix dropdown position if it is going outside the window boundaries
                    $dropdownMenu.css(position).trigger('spatialChanged');

                    // Check if scrolling will be needed
                    const isFixed = $dropdownMenu.css('position') === 'fixed';
                    if (isFixed && $dropdownMenu.outerHeight() > window.innerHeight) {
                        $dropdownMenu.css({
                            'overflow-y': 'scroll',
                            'max-height': window.innerHeight
                        });
                    }
                }
            });
        },

        events: {
            'click .form-action'(event, instance) {
                const $target = $(event.currentTarget);
                const isDisabled = $target.hasClass('disabled');

                if (isDisabled) {
                    instance.close(false);
                } else {
                    const component = $target.data('component');
                    instance.close(true, component.actionResult);
                }
            },

            'mouseenter .form-action, openSubmenu .form-action'(event, instance) {
                // Postpone the submenu opening if it's still being animated
                if (instance.opening) {
                    instance.$('.dropdown-menu').one('transitionend', event => {
                        $(event.currentTarget).trigger('openSubmenu');
                    });

                    return;
                }

                // Stop here if dropdown is already closed or event was triggered in child elements
                if (instance.closed || event.target !== event.currentTarget) return;

                // Close the submenu if a sibling element was hovered
                if (instance.lastSubmenu && instance.lastSubmenu !== event.currentTarget) {
                    instance.closeSubmenu(!this.items);
                }

                // Stop here if submenu is already opened for the current menu item
                if (!this.items || instance.lastSubmenu === event.currentTarget) return;

                // Close the current opened submenu (if exists) in order to open another one
                instance.closeSubmenu(!this.items);

                // Set the reactive closing elementcontroller and the last submenu element trigger
                const reactiveClose = new ReactiveVar(false);
                instance.reactiveClose = reactiveClose;
                instance.lastSubmenu = event.currentTarget;

                // Get the triggering li element and render the submenu
                const $parentLi = $(event.currentTarget).closest('li');
                OHIF.ui.showDropdown(this.items, {
                    event,
                    reactiveClose: instance.reactiveClose,
                    $parentLi,
                    parentInstance: instance,
                    dismissTimeout: instance.data.options && instance.data.options.dismissTimeout
                }).then(instance.data.promiseResolve).catch(() => {});
            },

            'keydown .form-action'(event, instance) {
                event.stopPropagation();
                const key = event.which;
                const $target = $(event.currentTarget);

                // Allow navigation using DOWN and UP arrow keys
                if (key === 38 || key === 40) {
                    const $parentLi = $target.closest('li');
                    const $liList = $parentLi.parent().children();
                    const index = $parentLi.index();

                    let $newLi;
                    if (key === 38) {
                        // Control the UP key
                        if (index === 0) {
                            $newLi = $liList.eq($liList.length - 1);
                        } else {
                            $newLi = $parentLi.prev();
                        }
                    } else {
                        // Control the DOWN key
                        if (index === $liList.length - 1) {
                            $newLi = $liList.eq(0);
                        } else {
                            $newLi = $parentLi.next();
                        }
                    }

                    // Focus the link inside the new li element
                    event.preventDefault();
                    $newLi.find('a:first').focus();
                    return;
                }

                // Close the submenu if LEFT, BACKSPACE or ESC key was pressed
                const { parentInstance } = instance.data.options;
                if (parentInstance && (key === 37 || key === 8 || key === 27)) {
                    event.preventDefault();
                    return parentInstance.closeSubmenu(true);
                }

                // Close the dropdown if there's no submenu open and ESC key was pressed
                if (!parentInstance && key === 27) {
                    return instance.close(false);
                }

                // Stop here if it's not a submenu trigger
                if (!this.items) return;

                // Open the submenu if RIGHT, ENTER or SPACE key was pressed
                if (key === 39 || key === 13 || key === 32) {
                    $target.trigger('openSubmenu');
                    event.preventDefault();
                }
            },

            'mousedown .dropdown'(event) {
                // This is required to stop blur event which is fired before click event
                // when a dropdown item is clicked, otherwise click event is not fired
                event.stopPropagation();
            },

            'blur .dropdown'(event, instance) {
                // Stop here if it's closed or if it's a submenu not being closed
                if (instance.closed) return;
                if (instance.reactiveClose && !instance.reactiveClose.get()) return;

                // Postpone the execution to enable getting the focused element
                Meteor.defer(() => {
                    const $focus = $(':focus');

                    // Iterate over all parent dropdowns and check if one of them has the focus
                    let hasFocus = false;
                    let currentInstance = instance;
                    do {
                        if ($.contains(currentInstance.$('.dropdown')[0], $focus[0])) {
                            hasFocus = true;
                            break;
                        }

                        if (!currentInstance.data.options.parentInstance) {
                            break;
                        } else {
                            currentInstance = currentInstance.data.options.parentInstance;

                            // Close the current instance's submenu as it has no focus
                            currentInstance.closeSubmenu(false);
                        }
                    } while (currentInstance);

                    // Close all dropdown levels if it lost the focus
                    if (!hasFocus) {
                        currentInstance.close(false);
                    }
                });
            }
        }
    }
});
