import { OHIF } from 'meteor/ohif:core';
import { QIDO, WADO } from './services/';

OHIF.studies = {
    services: {
        QIDO,
        WADO
    }
};
