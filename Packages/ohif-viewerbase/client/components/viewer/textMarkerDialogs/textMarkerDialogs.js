/**
 * @TODO: add this to OHIF's Viewers
 */

import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';

import { toolManager } from '../../../lib/toolManager';
import { viewportUtils } from '../../../lib/viewportUtils';

Template.textMarkerDialogs.events({
    'change #startFrom'(e) {
        const config = cornerstoneTools.textMarker.getConfiguration();
        config.current = $(e.target).val();
        //console.log("Changed starting point to: " + config.current);
    },
    'change #ascending'(e) {
        const config = cornerstoneTools.textMarker.getConfiguration();
        config.ascending = $(e.target).is(':checked');

        const currentIndex = config.markers.indexOf(config.current);

        config.current = config.markers[currentIndex];
        const nextMarker = config.current;
        $('#startFrom').val(nextMarker).trigger('change');
        //console.log("Changed ascending to: " + config.ascending);
    },
    'click #clearLabels'() {
        const element = viewportUtils.getActiveViewportElement();
        const toolType = 'textMarker';
        const toolStateManager = cornerstoneTools.globalImageIdSpecificToolStateManager;
        const toolState = toolStateManager.toolState;

        // We might want to make this a convenience function in cornerstoneTools
        const stack = cornerstoneTools.getToolState(element, 'stack');
        if (stack && stack.data.length && stack.data[0].imageIds.length) {
            const imageIds = stack.data[0].imageIds;
            
            // Clear the tool data for each image in the stack
            imageIds.forEach( imageId => {
                if(toolState.hasOwnProperty(imageId)) {
                    const toolData = toolState[imageId];
                    if (toolData.hasOwnProperty(toolType)) {
                        delete toolData[toolType];
                    }
                }
            });
        }

        cornerstone.updateImage(element);
    },
    'click .closeTextMarkerDialogs'() {
        const defaultTool = toolManager.getDefaultTool();
        toolManager.setActiveTool(defaultTool);
        document.getElementById('textMarkerOptionsDialog').close();
        $('#spine').removeClass('active');
        $('#' + defaultTool).addClass('active');
    }

});

Template.textMarkerDialogs.onRendered(function() {
    const optionsDialog = $('#textMarkerOptionsDialog');
    optionsDialog.draggable();
    dialogPolyfill.registerDialog(optionsDialog.get(0));

    const relabelDialog = $('#textMarkerRelabelDialog');
    relabelDialog.draggable();
    dialogPolyfill.registerDialog(relabelDialog.get(0));

    $(document).on('click',  event => {
        if (!$(event.target).closest('.select2-wrapper').length) {
            setTimeout(() => {
                $('#startFrom, .relabelSelect').select2('close');
            }, 200);
        }
    });

    $(document).on('touchmove', event => {
        if (!$(event.target).closest('.select2-container').length) {
            setTimeout(() => {
                $('#startFrom, .relabelSelect').select2('close');
            }, 200);
        }
    });

    $(() => {

        FastClick.attach(document.body);

        const $customSelects = $('#startFrom, .relabelSelect')

        $customSelects.select2({
            /**
             * Adds needsclick class to all DOM elements in the Select2 results list
             * so they can be accessible on iOS mobile when FastClick is initiated too.
             */
            templateResult(result, container) {
                if (!result.id) {
                    return result.text;
                }
                container.className += ' needsclick';
                return result.text;
            },
            placeholder: 'C1',
            minimumResultsForSearch: -1,
            theme: 'viewerDropdown'
        });

        /**
         * Additional to tweaking the templateResult option in Select2,
         * add needsclick class to all DOM elements in the Select2 container,
         * so they can be accessible on iOS mobile when FastClick is initiated too.
         *
         * More info about needsclick:
         * https://github.com/ftlabs/fastclick#ignore-certain-elements-with-needsclick
         *
         */
        $customSelects.each( (index, el) =>{
            $(el).data('select2').$container.find('*').addClass('needsclick');
        });

    });
});