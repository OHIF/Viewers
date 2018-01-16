import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone } from 'meteor/ohif:cornerstone';

Template.imageDownloadDialog.onCreated(() => {
    const instance = Template.instance();

    instance.schema = new SimpleSchema({
        width: { type: Number },
        height: { type: Number },
        name: {
            type: String,
            defaultValue: 'image'
        },
        type: {
            type: String,
            allowedValues: ['jpeg', 'png'],
            valuesLabels: ['JPEG', 'PNG'],
            defaultValue: 'jpeg'
        },
        showAnnotations: {
            type: Boolean,
            label: 'Show Annotations',
            defaultValue: false
        }
    });

    instance.keepAspect = new ReactiveVar(true);
    instance.showAnnotations = new ReactiveVar(false);
});

Template.imageDownloadDialog.onRendered(() => {
    const instance = Template.instance();
    const { viewportUtils } = OHIF.viewerbase;

    instance.quality = 1;
    instance.$viewportElement = instance.$('.viewport-element');
    instance.viewportElement = instance.$viewportElement[0];
    instance.$viewportPreview = instance.$('.viewport-preview');
    instance.viewportPreview = instance.$viewportPreview[0];

    cornerstone.enable(instance.viewportElement);
    instance.downloadCanvas = $(instance.viewportElement).find('canvas')[0];

    instance.form = instance.$('form').data('component');

    instance.setElementSize = (element, canvas, size, value) => {
        $(element)[size](value);
        canvas[size] = value;
        canvas.style[size] = `${value}px`;

        instance.form.item(size).value(value);
    };

    instance.updateViewportPreview = () => {
        instance.$viewportElement.one('CornerstoneImageRendered', (event, enabledElement) => {
            const image = instance.viewportPreview;
            const type = 'image/' + instance.form.item('type').value();
            const dataUrl = instance.downloadCanvas.toDataURL(type, instance.quality);
            image.src = dataUrl;

            const $element = $(enabledElement.element);
            let width = $element.width();
            let height = $element.height();
            if (width > 512 || height > 512) {
                const multiplier = 512 / Math.max(width, height);
                height *= multiplier;
                width *= multiplier;
            }

            image.width = width;
            image.height = height;
        });
    };

    instance.autorun(() => {
        Session.get('UpdateDownloadViewport');
        const activeViewport = viewportUtils.getActiveViewportElement();

        if (activeViewport) {
            const enabledElement = cornerstone.getEnabledElement(activeViewport);
            const { width, height } = enabledElement.image;

            const viewport = Object.assign({}, enabledElement.viewport);
            delete viewport.scale;
            viewport.translation = {
                x: 0,
                y: 0
            };

            cornerstone.loadImage(enabledElement.image.imageId).then(image => {
                cornerstone.displayImage(instance.viewportElement, image);
                cornerstone.setViewport(instance.viewportElement, viewport);
                cornerstone.resize(instance.viewportElement, true);

                instance.setElementSize(instance.viewportElement, instance.downloadCanvas, 'width', width);
                instance.setElementSize(instance.viewportElement, instance.downloadCanvas, 'height', height);

                cornerstone.fitToWindow(instance.viewportElement);
                instance.updateViewportPreview();
            });
        }
    });
});

Template.imageDownloadDialog.helpers({
    keepAspect() {
        return Template.instance().keepAspect.get();
    }
});

Template.imageDownloadDialog.events({
    'click .js-keep-aspect'(event, instance) {
        const currentState = instance.keepAspect.get();
        instance.keepAspect.set(!currentState);
    }
});

// import { Template } from 'meteor/templating';
// import { Session } from 'meteor/session';
// import { OHIF } from 'meteor/ohif:core';
// import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';
//
// function setElementSize(element, canvas, size, value) {
//     $(element)[size](value);
//     canvas[size] = value;
//     canvas.style[size] = `${value}px`;
// }
//
// Template.imageDownloadDialog.onCreated(() => {
//     const instance = Template.instance();
//     const { viewportUtils } = OHIF.viewerbase;
//
//     instance.autorun(() => {
//         Session.get('UpdateDownloadViewport');
//         const activeViewport = viewportUtils.getActiveViewportElement();
//
//         if (activeViewport) {
//             const enabledElement = cornerstone.getEnabledElement(activeViewport);
//
//             cornerstone.loadImage(enabledElement.image.imageId).then(function(image) {
//                 cornerstone.displayImage(instance.$previewElement, image);
//                 cornerstone.displayImage(instance.$downloadElement, image);
//                 cornerstone.resize(instance.$previewElement, true);
//
//                 setElementSize(instance.$downloadElement, instance.$downloadCanvas, 'width', 300);
//                 setElementSize(instance.$downloadElement, instance.$downloadCanvas, 'height', 200);
//
//                 cornerstone.fitToWindow(instance.$downloadElement);
//             });
//         }
//     });
// });
//
// Template.imageDownloadDialog.onRendered(() => {
//     const instance = Template.instance();
//     const $dialog = instance.$('#imageDownloadDialog');
//
//     instance.$previewElement = $('#previewElement')[0];
//     instance.$downloadElement = document.createElement('div');
//     instance.availableTools = ['length', 'probe', 'simpleAngle', 'arrowAnnotate', 'ellipticalRoi', 'rectangleRoi'];
//     instance.showAnnotations = false;
//
//     cornerstone.enable(instance.$previewElement);
//     cornerstone.enable(instance.$downloadElement);
//     instance.$downloadCanvas = $(instance.$downloadElement).find('canvas')[0];
//
//     // Make the dialog bounded and draggable
//     $dialog.draggable({ defaultElementCursor: 'move' });
//
//     // Polyfill for older browsers
//     dialogPolyfill.registerDialog($dialog.get(0));
//
//     // // Prevent dialog from being dragged when user clicks any button
//     const $controls = $dialog.find('.form-group, .instructions');
//     $controls.on('mousedown touchstart', event => event.stopPropagation());
// });
//
// Template.imageDownloadDialog.events({
//     'change .form-group input[name=width]'(event, instance){
//         const width = $(event.currentTarget).val();
//
//         setElementSize(instance.$downloadElement, instance.$downloadCanvas, 'width', width);
//         cornerstone.fitToWindow(instance.$downloadElement);
//     },
//
//     'change .form-group input[name=height]'(event, instance){
//         const height = $(event.currentTarget).val();
//
//         setElementSize(instance.$downloadElement, instance.$downloadCanvas, 'height', height);
//         cornerstone.fitToWindow(instance.$downloadElement);
//     },
//
//     'change #imageDownloadDialog .form-group .form-check input[type=checkbox]'(event, instance) {
//         const $previewElement = instance.$previewElement;
//         const $downloadElement = instance.$downloadElement;
//
//         instance.showAnnotations = !instance.showAnnotations;
//
//         const action = (instance.showAnnotations) ? 'enable' : 'disable';
//
//         instance.availableTools.forEach(tool => {
//             cornerstoneTools[tool][action]($previewElement);
//             cornerstoneTools[tool][action]($downloadElement);
//         });
//     },
//
//     'click .dropdown-menu .dropdown-item'(event, instance) {
//         const extension = $(event.currentTarget).text();
//         const $extensionButton = $('.btn.extension');
//
//         $extensionButton.text(extension);
//     },
//
//     'click button.download'(event, instance) {
//         const fileName = $('.fileName').val();
//         const extension = $('.btn.extension').text().trim();
//
//         if (!fileName || !extension) return;
//
//         cornerstoneTools.saveAs(instance.$downloadElement, `${fileName}.${extension}`, `image/${extension}`);
//     },
//
//     'click button.cancel'(event, instance) {
//         const { viewportUtils } = OHIF.viewerbase;
//         viewportUtils.toggleDownloadDialog();
//     }
// });
