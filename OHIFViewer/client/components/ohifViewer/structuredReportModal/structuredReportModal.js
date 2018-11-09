import { $ } from 'meteor/jquery';

Template.structuredReportModal.onRendered(() => {
    const instance = Template.instance()
    const { structuredReport } = instance.data;
    
    render(structuredReport);
})

function render(structureReport) {
    const root = $('#root');

    if (structureReport) {
        root.append(getMainDataHtml(structureReport));
        root.append(getContentSequenceHtml(structureReport.contentSequence));
    } else {
        root.append('No data');
    }

}

function getMainDataItemHtml(key, value) {
    return $(`<div><b>${key}</b>: ${value}</div>`)
}

function getMainDataHtml(data) {
    const root = $('<div></div>');

    const { completionFlag, verificationFlag, manufacturer, contentDateTime } = data

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
    const header = data.header
    const items = data.items || []

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