import { Template } from 'meteor/templating';

Template.structuredReportOpener.onCreated(() => {
    const instance = Template.instance();
    instance.structuredReport = getStructureReport();
});

Template.structuredReportOpener.helpers({
    hasStructuredReport() {
        const instance = Template.instance();
        return !!instance.structuredReport;
    }
});

Template.structuredReportOpener.events({
    'click .openModalBtn'(event, template) {
        const { structuredReport } = template;
        OHIF.ui.showDialog('structuredReportModal', { structuredReport });
    }
});

// FIXME: we use just 1st SR for current study for now
function getStructureReport() {
    let structuredReport;

    OHIF.viewer.StudyMetadataList.find(studyMetadata => {
        const data = studyMetadata.getData();
        const series = data.seriesList || [];
        const srSeries = series.find(series => series.modality === 'SR');
        structuredReport = srSeries && srSeries.instances[0];
    });

    return structuredReport;
}