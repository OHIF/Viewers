import { Viewerbase } from 'meteor/ohif:viewerbase';
import { OHIFSeriesMetadata } from './OHIFSeriesMetadata';

export class OHIFStudyMetadata extends Viewerbase.metadata.StudyMetadata {

    /**
     * @param {Object} Study object.
     */
    constructor(data, uid) {
        super(data, uid);
        this.init();
    }

    init() {
        const study = this.getData();

        // define "_studyInstanceUID" protected property
        Object.defineProperty(this, '_studyInstanceUID', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: study.studyInstanceUid
        });

        // populate internal list of series
        study.seriesList.forEach(series => {
            this.addSeries(new OHIFSeriesMetadata(series, study));
        });
    }

}
