import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { _ } from 'meteor/underscore';
import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';

/*
 * input: controls a select2 component
 */
OHIF.mixins.select2 = new OHIF.Mixin({
    dependencies: 'select',
    composition: {
        onCreated() {
            const instance = Template.instance();
            const { component, data } = instance;

            // Controls select2 initialization
            instance.isInitialized = false;

            // Set the custom focus flag
            component.isCustomFocus = true;

            const valueMethod = component.value;
            component.value = value => {
                if (_.isUndefined(value) && !instance.isInitialized) {
                    if (!_.isUndefined(instance.data.value)) return instance.data.value;
                    if (!_.isUndefined(component.defaultValue)) return component.defaultValue;
                    return;
                }

                return valueMethod(value);
            };

            // Utility function to get the dropdown jQuery element
            instance.getDropdownContainerElement = () => {
                const $select2 = component.$element.nextAll('.select2:first');
                const containerId = $select2.find('.select2-selection').attr('aria-owns');
                return $(`#${containerId}`).closest('.select2-container');
            };

            // Check if this select will include a placeholder
            const placeholder = data.options && data.options.placeholder;
            if (placeholder) {
                instance.autorun(() => {
                    // Get the option items
                    let items = data.items;

                    // Check if the items are reactive and get them if true
                    const isReactive = items instanceof ReactiveVar;
                    if (isReactive) {
                        items = items.get();
                    }

                    // Check if there is already an empty option on items list
                    // Note: If this is a multi-select input. Do not add a placeholder
                    const isMultiple = instance.data.options && instance.data.options.multiple;
                    if (!_.findWhere(items, { value: '' }) && isMultiple === false) {
                        // Clone the current items
                        const newItems = _.clone(items) || [];
                        newItems.unshift({
                            label: placeholder,
                            value: ''
                        });

                        // Set the new items list including the empty option
                        if (isReactive) {
                            data.items.set(newItems);
                        } else {
                            data.items = newItems;
                        }
                    }
                });
            }
        },

        onRendered() {
            const instance = Template.instance();
            const { component, data } = instance;

            // Destroy and re-create the select2 instance
            instance.rebuildSelect2 = () => {
                // Destroy the select2 instance if exists and re-create it
                if (component.select2Instance) {
                    component.select2Instance.destroy();
                }

                // Clone the options and check if the select2 should be initialized inside a modal
                const options = _.clone(data.options);
                const $closestModal = component.$element.closest('.modal');
                if ($closestModal.length) {
                    options.dropdownParent = $closestModal;
                }

                // Apply the select2 to the component
                component.$element.select2(options);

                // Store the select2 instance to allow its further destruction
                component.select2Instance = component.$element.data('select2');

                // Get the focusable elements
                const elements = [];
                const $select2 = component.$element.nextAll('.select2:first');
                const $select2Selection = $select2.find('.select2-selection');
                elements.push(component.$element[0]);
                elements.push($select2Selection[0]);

                // Attach focus and blur handlers to focusable elements
                $(elements).on('focus', event => {
                    instance.isFocused = true;
                    if (event.target === event.currentTarget) {
                        // Show the state message on elements focus
                        component.toggleMessage(true);
                    }
                }).on('blur', event => {
                    instance.isFocused = false;
                    if (event.target === event.currentTarget) {
                        // Hide the state message on elements blur
                        component.toggleMessage(false);
                    }
                });

                // Redirect keydown events from input to the select2 selection handler
                component.$element.on('keydown ', event => {
                    event.preventDefault();
                    $select2.find('.select2-selection').trigger(event);
                });

                // Keep focus on element if ESC was pressed
                $select2.on('keydown ', event => {
                    if (event.which === 27) {
                        instance.component.$element.focus();
                    }
                });

                // Handle dropdown opening when focusing the selection element
                $select2Selection.on('keydown ', event => {
                    const skipKeys = new Set([8, 9, 12, 16, 17, 18, 20, 27, 46, 91, 93]);
                    const functionKeysRegex = /F[0-9]([0-9])?$/;
                    const isFunctionKey = functionKeysRegex.test(event.key);
                    if (skipKeys.has(event.which) || isFunctionKey) {
                        return;
                    }

                    event.preventDefault();
                    event.stopPropagation();

                    // Open the select2 dropdown
                    instance.component.$element.select2('open');

                    // Check if the pressed key will produce a character
                    const searchSelector = '.select2-search__field';
                    const $search = component.select2Instance.$dropdown.find(searchSelector);
                    const isChar = OHIF.ui.isCharacterKeyPress(event);
                    const char = event.key;
                    if ($search.length && isChar && char.length === 1) {
                        // Event needs to be triggered twice to work properly with this plugin
                        $search.val(char).trigger('input').trigger('input');
                    }
                });

                // Set select2 as initialized
                instance.isInitialized = true;
            };

            instance.autorun(() => {
                // Run this computation every time the reactive items suffer any changes
                const isReactive = data.items instanceof ReactiveVar;
                if (isReactive) {
                    data.items.dep.depend();
                }

                if (isReactive) {
                    // Keep the current value of the component
                    const currentValue = component.value();
                    const wasFocused = instance.isFocused;

                    Tracker.afterFlush(() => {
                        component.$element.val(currentValue);
                        instance.rebuildSelect2();

                        if (wasFocused) {
                            component.$element.focus();
                        }
                    });
                } else {
                    instance.rebuildSelect2();
                }
            });
        },

        events: {
            // Focus element when selecting a value
            'select2:select'(event, instance) {
                instance.component.$element.focus();
            },

            // Focus the element when closing the dropdown container using ESC key
            'select2:open'(event, instance) {
                const { minimumResultsForSearch } = instance.data.options;
                if (minimumResultsForSearch === Infinity || minimumResultsForSearch === -1) return;
                const $container = instance.getDropdownContainerElement();

                if (!instance.data.wrapText) {
                    $container.addClass('select2-container-nowrap');
                }

                const $searchInput = $container.find('.select2-search__field');
                $searchInput.on('keydown.focusOnFinish', event => {
                    const keys = new Set([9, 13, 27]);
                    if (keys.has(event.which)) {
                        $searchInput.off('keydown.focusOnFinish');
                        instance.component.$element.focus();
                    }
                });
            }
        },

        onDestroyed() {
            const instance = Template.instance();
            const { component } = instance;

            // Destroy the select2 instance to remove unwanted DOM elements
            if (component.select2Instance) {
                component.select2Instance.destroy();
            }
        }
    }
});
