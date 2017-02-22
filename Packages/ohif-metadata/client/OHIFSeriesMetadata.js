import { Viewerbase } from 'meteor/ohif:viewerbase';
import { OHIFInstanceMetadata } from './OHIFInstanceMetadata';

export class OHIFSeriesMetadata extends Viewerbase.metadata.SeriesMetadata {

    /**
     * @param {Object} Series object.
     */
    constructor(data, study, uid) {
        super(data, uid);
        this.init(study);
    }

    init(study) {
        const series = this.getData();

        // define "_seriesInstanceUID" protected property...
        Object.defineProperty(this, '_seriesInstanceUID', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: series.seriesInstanceUid
        });

        // populate internal list of instances...
        series.instances.forEach(instance => {
            this.addInstance(new OHIFInstanceMetadata(instance, series, study));
        });
    }

}

