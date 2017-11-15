import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { OHIF } from 'meteor/ohif:core';
import { viewportUtils } from '../../../lib/viewportUtils';

function setElementSize(element, canvas, size, value) {
    $(element)[size](value);
    canvas[size] = value;
    canvas.style[size] = `${value}px`;
}

Template.downloadDialog.onCreated(() => {
    const instance = Template.instance();

    instance.autorun(() => {
        Session.get('UpdateDownloadViewport');
        const activeViewport = viewportUtils.getActiveViewportElement();

        if (activeViewport) {
          const enabledElement = cornerstone.getEnabledElement(activeViewport);

          cornerstone.loadImage(enabledElement.image.imageId).then(function (image) {
            cornerstone.displayImage(instance.$previewElement, image);
            cornerstone.displayImage(instance.$downloadElement, image);
            cornerstone.resize(instance.$previewElement, true);

            setElementSize(instance.$downloadElement, instance.$downloadCanvas, 'width', 300);
            setElementSize(instance.$downloadElement, instance.$downloadCanvas, 'height', 200);

            cornerstone.fitToWindow(instance.$downloadElement);
          });
        }
    })
});

Template.downloadDialog.onRendered(() => {
    const instance = Template.instance();
    const $dialog = instance.$('#downloadDialog');

    instance.$previewElement = $('#previewElement')[0];
    instance.$downloadElement = document.createElement('div');
    instance.availableTools = ['length', 'probe', 'simpleAngle', 'arrowAnnotate', 'ellipticalRoi', 'rectangleRoi'];
    instance.showAnnotations = false;

    cornerstone.enable(instance.$previewElement);
    cornerstone.enable(instance.$downloadElement);
    instance.$downloadCanvas = $(instance.$downloadElement).find('canvas')[0];

    // Make the dialog bounded and draggable
    $dialog.draggable({ defaultElementCursor: 'move' });

    // Polyfill for older browsers
    dialogPolyfill.registerDialog($dialog.get(0));

    // // Prevent dialog from being dragged when user clicks any button
    const $controls = $dialog.find('.form-group, .instructions');
    $controls.on('mousedown touchstart', event => event.stopPropagation());
});

Template.downloadDialog.events({
    'change .form-group input[name=width]'(event, instance){
        const width = $(event.currentTarget).val();

        setElementSize(instance.$downloadElement, instance.$downloadCanvas, 'width', width);
        cornerstone.fitToWindow(instance.$downloadElement);
    },

    'change .form-group input[name=height]'(event, instance){
        const height = $(event.currentTarget).val();

        setElementSize(instance.$downloadElement, instance.$downloadCanvas, 'height', height);
        cornerstone.fitToWindow(instance.$downloadElement);
    },

    'change #downloadDialog .form-group .form-check input[type=checkbox]'(event, instance) {
        const $previewElement = instance.$previewElement;
        const $downloadElement = instance.$downloadElement;

        instance.showAnnotations = !instance.showAnnotations;

        const action = (instance.showAnnotations) ? 'enable' : 'disable';

        instance.availableTools.forEach(tool => {
            cornerstoneTools[tool][action]($previewElement);
            cornerstoneTools[tool][action]($downloadElement);
        });
    },

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

        cornerstoneTools.saveAs(instance.$downloadElement, `${fileName}.${extension}`, `image/${extension}`);
    },

    'click button.cancel'(event, instance) {
        viewportUtils.toggleDownloadDialog();
    }
});