import { Viewerbase } from 'meteor/ohif:viewerbase';
import { OHIFInstanceMetadata } from './OHIFInstanceMetadata';

export class OHIFSeriesMetadata extends Viewerbase.metadata.SeriesMetadata {

    /**
     * @param {Object} Series object.
     */
    constructor(data) {
        super(data);
        this.init();
    }

    init() {
        const data = this.getData();

        // set protected property...
        this._seriesInstanceUID = data.seriesInstanceUid;
        // populate internal list of instances...
        data.instances.forEach(instance => {
            this.addInstance(new OHIFInstanceMetadata(instance));
        });
    }

}

