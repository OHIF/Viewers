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
        },
        quality: {
            type: Number,
            defaultValue: 100
        }
    });

    instance.changeObserver = new Tracker.Dependency();

    instance.keepAspect = new ReactiveVar(true);
    instance.showAnnotations = new ReactiveVar(false);

    instance.lastImage = {};

    instance.getConfirmCallback = () => () => {
        instance.downloadImage();
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
                const quality = formData.type === 'png' ? 1 : formData.quality / 100;
                const dataUrl = instance.downloadCanvas.toDataURL(type, quality);
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

    // TODO: Add quality parameter to cornerstoneTools' saveAs method
    instance.downloadImage = () => {
        const formData = instance.form.value();
        const link = document.createElement('a');
        link.download = `${formData.name}.${formData.type}`;
        link.href = instance.viewportPreview.src;

        // Create a 'fake' click event to trigger the download
        if (document.createEvent) {
            const event = document.createEvent('MouseEvents');
            event.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            link.dispatchEvent(event);
        } else if (link.fireEvent) {
            link.fireEvent('onclick');
        }
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

Template.imageDownloadDialog.events({
    'click .js-keep-aspect'(event, instance) {
        const currentState = instance.keepAspect.get();
        instance.keepAspect.set(!currentState);
        instance.$('[data-key=width]').trigger('input');
    },

    'change [data-key=showAnnotations], change [data-key=type]'(event, instance) {
        instance.changeObserver.changed();
    },

    'input [data-key=quality]'(event, instance) {
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
    },

    showQuality() {
        const instance = Template.instance();
        instance.changeObserver.depend();
        if (!instance.form) return true;
        return instance.form.item('type').value() === 'jpeg';
    }
});
