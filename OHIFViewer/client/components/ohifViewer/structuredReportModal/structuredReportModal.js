import { $ } from 'meteor/jquery';
import { OHIF } from 'meteor/ohif:core';

Template.structuredReportModal.onRendered(() => {
    const structuredReport = getStructureReport();

    render(structuredReport);
});

// FIXME: we use just 1st SR for current study for now
function getStructureReport() {
    let structuredReport;

    OHIF.viewer.StudyMetadataList.find(studyMetadata => {

        structuredReport = studyMetadata.findInstance(instance => instance.getData().modality === 'SR');

        // If SR is found stop the search
        return !!structuredReport;
    });

    return structuredReport;
}

function render(structureReport) {
    const root = $('#root');

    if (structureReport) {
        renderStructuredReport(root, structureReport.getData());
    } else {
        renderNoData(root);
    }

}

function renderStructuredReport(root, data) {
    root.append(getMainDataHtml(data));
    root.append(getContentSequenceHtml(data.contentSequence));
}

function renderNoData(root) {
    root.append('<div>No structured report found</div>');
}

function getMainDataHtml(data) {
    const root = $('<div></div>');

    const { completionFlag, verificationFlag, manufacturer, contentDateTime } = data;

    if (completionFlag) {
        root.append(getMainDataItemHtml('Completion flag', completionFlag));
    }

    if (verificationFlag) {
        root.append(getMainDataItemHtml('Verification flag', verificationFlag));
    }

    if (manufacturer) {
        root.append(getMainDataItemHtml('Manufacturer', manufacturer));
    }

    if (contentDateTime) {
        root.append(getMainDataItemHtml('Content Date/Time', contentDateTime));
    }

    return root;
}

const getContentSequenceHtml = (data, level = 1) => {
    const root = $('<div></div>');
    const header = data.header;
    const items = data.items || [];

    if (header) {
        root.append(`<h${level}>${header}</h${level}>`);
    }

    items.forEach(item => {
        root.append(
            item instanceof Object
                ? getContentSequenceHtml(item, level + 1)
                : `<div>${item}</div>`
        );
    });

    return root;
}

function getMainDataItemHtml(key, value) {
    return $(`<div><b>${key}</b>: ${value}</div>`);
}