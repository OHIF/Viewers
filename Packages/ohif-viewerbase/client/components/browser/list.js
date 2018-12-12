import { Template } from 'meteor/templating';

Template.studyBrowserList.onCreated(() => {
    const instance = Template.instance();

    if (instance.data.studiesData) {
        instance.studiesData = instance.data.studiesData;
    }
});

Template.studyBrowserList.helpers({
    getStudiesInformation() {
        const instance = Template.instance();

        let studiesInformation;
        if (instance.studiesData) {
            studiesInformation = instance.studiesData.get() || [];
        } else {
            studiesInformation = instance.data.studiesInformation || [];
        }

        const result = new Map();
        studiesInformation.forEach(item => result.set(item.studyInstanceUid, item));
        return Array.from(result.values());
    }
});
