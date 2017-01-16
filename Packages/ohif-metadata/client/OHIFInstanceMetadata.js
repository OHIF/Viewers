import { Viewerbase } from 'meteor/ohif:viewerbase';

const InstanceMetadata = Viewerbase.metadata.InstanceMetadata;

export class OHIFInstanceMetadata extends InstanceMetadata {

    /**
     * @param {Object} Instance object.
     */
    constructor(data) {
        super(data);
        this.init();
    }

    init() {
        const data = this.getData();
        // set protected property...
        this._sopInstanceUID = data.sopInstanceUid;
    }

    // Override
    getRawValue(tagOrProperty, defaultValue) {
        const propertyName = OHIFInstanceMetadata.getPropertyName(tagOrProperty);

        const data = this.getData();
        const rawValue = data[propertyName];

        return rawValue !== void 0 ? rawValue : defaultValue;
    }

    // Override
    tagExists(tagOrProperty) {
        const propertyName = OHIFInstanceMetadata.getPropertyName(tagOrProperty);

        const data = this.getData();

        return (propertyName in data);
    }

    /**
     * Static methods
     */
    
    static getPropertyName(tagOrProperty) {
        const tagInfo = InstanceMetadata.getTagInfo(tagOrProperty);

        if(tagInfo.propertyName === null) {
            return;
        }

        let propertyName = tagInfo.propertyName.charAt(0).toLowerCase() + tagInfo.propertyName.substr(1);
        // TODO: Improve this: change retriveMetadata to use dicom standard names (see dicomTagDescriptions.js)
        propertyName = propertyName.replace(/^sop/, 'SOP');
        propertyName = propertyName.replace(/uid$/i, 'UID');

        return propertyName;
    }
}
