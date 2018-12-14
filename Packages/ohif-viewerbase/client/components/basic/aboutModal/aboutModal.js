import { OHIF } from 'ohif-core';

Template.aboutModal.helpers({
    githubUrl() {
        return 'https://github.com/OHIF/Viewers';
    },

    gitSHA() {
        return OHIF.info.sha;
    },

    gitVersion() {
        return OHIF.info.version;
    }
});
