import { Template } from 'meteor/templating';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { OHIF } from 'meteor/ohif:core';
import { cornerstone, cornerstoneTools } from 'meteor/ohif:cornerstone';

OHIF.viewerbase.getImageDownloadDialogAnnotationTools = () => {
    return ['length', 'probe', 'simpleAngle', 'arrowAnnotate', 'ellipticalRoi', 'rectangleRoi'];
};

/**
 * Converts a base64 data to a blob. This is needed to enabled JPEG images downloading on IE11.
 * Source: https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript/16245768
 */
const b64toBlob = (b64Data, contentType='', sliceSize=512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
};

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
            defaultValue: true
        }
    });

    instance.changeObserver = new Tracker.Dependency();

    instance.keepAspect = new ReactiveVar(true);
    instance.showAnnotations = new ReactiveVar(false);

    instance.lastImage = {};

    instance.getConfirmCallback = () => () => {
        return instance.downloadImage();
    };
});

Template.imageDownloadDialog.onRendered(() => {
    const instance = Template.instance();
    const { viewportUtils } = OHIF.viewerbase;

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

        instance.form.item(size).$element.val(value);
    };

    instance.toggleAnnotations = toggle => {
        const action = toggle ? 'enable' : 'disable';
        const annotationTools = OHIF.viewerbase.getImageDownloadDialogAnnotationTools();
        annotationTools.forEach(tool => cornerstoneTools[tool][action](instance.viewportElement));
    };

    instance.updateViewportPreview = () => {
        instance.$viewportElement.one('cornerstoneimagerendered', event => {
            // Wait for the tools to handle CornerstoneImageRendered event
            Tracker.afterFlush(() => {
                const enabledElement = cornerstone.getEnabledElement(event.currentTarget);
                const formData = instance.form.value();
                const image = instance.viewportPreview;
                const type = 'image/' + formData.type;
                const dataUrl = instance.downloadCanvas.toDataURL(type, 1);
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
        });
    };

    instance.downloadImage = () => {
        const formData = instance.form.value();
        const filename = `${formData.name}.${formData.type}`;
        const mimetype = `image/${formData.type}`;

        // Handles JPEG images for IE11
        if (instance.downloadCanvas.msToBlob && formData.type === 'jpeg') {
            const image = instance.downloadCanvas.toDataURL(mimetype, 1);
            const blob = b64toBlob(image.replace('data:image/jpeg;base64,', ''), mimetype);
            return window.navigator.msSaveBlob(blob, filename);
        }

        return cornerstoneTools.saveAs(instance.viewportElement, filename, mimetype);
    };

    instance.autorun(() => {
        instance.changeObserver.depend();
        Session.get('UpdateDownloadViewport');
        const activeViewport = viewportUtils.getActiveViewportElement();

        if (activeViewport) {
            const enabledElement = cornerstone.getEnabledElement(activeViewport);

            const viewport = Object.assign({}, enabledElement.viewport);
            delete viewport.scale;
            viewport.translation = {
                x: 0,
                y: 0
            };

            cornerstone.loadImage(enabledElement.image.imageId).then(image => {
                instance.lastImage = image;
                const { viewportElement, downloadCanvas } = instance;
                const formData = instance.form.value();

                cornerstone.displayImage(viewportElement, image);
                cornerstone.setViewport(viewportElement, viewport);
                cornerstone.resize(viewportElement, true);

                instance.toggleAnnotations(formData.showAnnotations);

                const width = Math.min(formData.width || image.width, 16384);
                const height = Math.min(formData.height || image.height, 16384);
                instance.setElementSize(viewportElement, downloadCanvas, 'width', width);
                instance.setElementSize(viewportElement, downloadCanvas, 'height', height);

                cornerstone.fitToWindow(viewportElement);
                instance.updateViewportPreview();
            });
        }
    });
});

Template.imageDownloadDialog.onDestroyed(() => {
    const instance = Template.instance();

    cornerstone.disable(instance.viewportElement);
});

Template.imageDownloadDialog.events({
    'click .js-keep-aspect'(event, instance) {
        const currentState = instance.keepAspect.get();
        instance.keepAspect.set(!currentState);
        instance.$('[data-key=width]').trigger('input');
    },

    'change [data-key=showAnnotations], change [data-key=type]'(event, instance) {
        instance.changeObserver.changed();
    },

    'input [data-key=width]'(event, instance) {
        const { viewportElement, downloadCanvas } = instance;
        const formData = instance.form.value();
        const { width, height } = instance.lastImage;
        const newWidth = formData.width;
        instance.setElementSize(viewportElement, downloadCanvas, 'width', newWidth);
        if (instance.keepAspect.get()) {
            const multiplier = newWidth / width;
            const newHeight = Math.round(height * multiplier);
            instance.setElementSize(viewportElement, downloadCanvas, 'height', newHeight);
        }

        instance.changeObserver.changed();
    },

    'input [data-key=height]'(event, instance) {
        const { viewportElement, downloadCanvas } = instance;
        const formData = instance.form.value();
        const { width, height } = instance.lastImage;
        const newHeight = formData.height;
        instance.setElementSize(viewportElement, downloadCanvas, 'height', newHeight);
        if (instance.keepAspect.get()) {
            const multiplier = newHeight / height;
            const newWidth = Math.round(width * multiplier);
            instance.setElementSize(viewportElement, downloadCanvas, 'width', newWidth);
        }

        instance.changeObserver.changed();
    }
});

Template.imageDownloadDialog.helpers({
    keepAspect() {
        return Template.instance().keepAspect.get();
    }
});
