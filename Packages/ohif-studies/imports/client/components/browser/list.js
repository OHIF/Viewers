import { Template } from 'meteor/templating';

Template.studyBrowserList.helpers({
    getStudiesInformation() {
        const instance = Template.instance();
        const studiesInformation = instance.data.studiesInformation || [];
        const result = new Map();
        studiesInformation.forEach(item => result.set(item.studyInstanceUid, item));
        return Array.from(result.values());
    }
});
