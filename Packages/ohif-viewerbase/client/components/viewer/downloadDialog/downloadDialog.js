import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { OHIF } from 'meteor/ohif:core';
import { viewportUtils } from '../../../lib/viewportUtils';

Template.downloadDialog.onCreated(() => {
    const instance = Template.instance();

    instance.autorun(() => {
        Session.get('UpdateDownloadViewport');
        const activeViewport = viewportUtils.getActiveViewportElement();

        if (activeViewport) {
          const enabledElement = cornerstone.getEnabledElement(activeViewport);

          cornerstone.loadImage(enabledElement.image.imageId).then(function (image) {
            cornerstone.displayImage(instance.$elementDownload, image);
            cornerstone.resize(instance.$elementDownload, true);
          });
        }
    })
});

Template.downloadDialog.onRendered(() => {
    const instance = Template.instance();
    const $dialog = instance.$('#downloadDialog');
    const singleRowLayout = OHIF.uiSettings.displayEchoUltrasoundWorkflow;

    instance.$elementDownload = $('#downloadElement')[0];
    instance.showAnnotations = false;
    instance.availableTools = ['length', 'probe', 'simpleAngle', 'arrowAnnotate', 'ellipticalRoi', 'rectangleRoi'];

    cornerstone.enable(instance.$elementDownload);
    instance.$downloadCanvas = $('#downloadElement canvas')[0];

    // Make the CINE dialog bounded and draggable
    $dialog.draggable({ defaultElementCursor: 'move' });

    // Polyfill for older browsers
    dialogPolyfill.registerDialog($dialog.get(0));

    // // Prevent dialog from being dragged when user clicks any button
    const $controls = $dialog.find('.form-group, .instructions, #downloadElement');
    $controls.on('mousedown touchstart', event => event.stopPropagation());
});

Template.downloadDialog.events({
    'click .dropdown-menu .dropdown-item'(event, instance) {
        const extension = $(event.currentTarget).text();
        const $extensionButton = $('.btn.extension');

        $extensionButton.text(extension);
    },

    'click button.download'(event, instance) {
        const fileName = $('.fileName').val();
        const extension = $('.btn.extension').text().trim();

        if (!fileName || !extension) {
          return;
        }

        const height = $('.form-group input[name=height]').val();
        const width = $('.form-group input[name=width]').val();
        const lnk = document.createElement('a');
        const $dynamicCanvas = document.createElement('canvas');
        const $downloadCanvas = instance.$downloadCanvas;

        $dynamicCanvas.width = width;
        $dynamicCanvas.height = height;
        $dynamicCanvas.getContext('2d').drawImage($downloadCanvas, 0, 0, $downloadCanvas.width, $downloadCanvas.height, 0, 0, width, height);

        lnk.download = `${fileName}.${extension}`;
        lnk.href = $dynamicCanvas.toDataURL(`image/${extension}`, 1.0);

        if (document.createEvent) {
            const e = document.createEvent('MouseEvents');
            e.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            lnk.dispatchEvent(e);
        } else if (lnk.fireEvent) {
            lnk.fireEvent('onclick');
        }
    },

    'change #downloadDialog .form-group .form-check input[type=checkbox]'(event, instance) {
        const $element = instance.$elementDownload;

        instance.showAnnotations = !instance.showAnnotations;

        if (instance.showAnnotations) {
            instance.availableTools.forEach(tool => cornerstoneTools[tool].enable($element));
        } else {
            instance.availableTools.forEach(tool => cornerstoneTools[tool].disable($element));
        }
    },

    'click button.cancel'(event, instance) {
        viewportUtils.toggleDownloadDialog();
    }
});