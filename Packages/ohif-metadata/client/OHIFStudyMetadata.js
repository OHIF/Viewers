import { Viewerbase } from 'meteor/ohif:viewerbase';
import { OHIFSeriesMetadata } from './OHIFSeriesMetadata';

export class OHIFStudyMetadata extends Viewerbase.metadata.StudyMetadata {

    /**
     * @param {Object} Study object.
     */
    constructor(data) {
        super(data);
        this.init();
    }

    init() {
        const data = this.getData();

        // set protected property...
        this._studyInstanceUID = data.studyInstanceUid;
        // populate internal list of series...
        data.seriesList.forEach(series => {
            this.addSeries(new OHIFSeriesMetadata(series));
        });
    }

}
