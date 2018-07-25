import { dcmjs } from 'meteor/ohif:cornerstone';

const supportedSopClassUIDs = ['1.2.840.10008.5.1.4.1.1.88.22'];

const toArray = function(x) {
    return (x.constructor.name === "Array" ? x : [x]);
};

const codeMeaningEquals = (codeMeaningName) => {
    return (contentItem) => {
        return contentItem.ConceptNameCodeSequence.CodeMeaning === codeMeaningName;
    };
};

const getAllDisplaySets = () => {
    const allStudies = OHIF.viewer.Studies.all();
    let allDisplaySets = [];

    allStudies.forEach(study => {
        allDisplaySets = allDisplaySets.concat(study.displaySets);
    });

    return allDisplaySets;
};


const getInstanceMetadata = (displaySets, sopInstanceUid) => {
    let instance;

    // Use Array.some so that this loop stops when the internal loop
    // has found the correct instance
    displaySets.some(displaySet => {
        // Search the display set to find the instance metadata for
        return displaySet.images.find(instanceMetadata => {
            if (instanceMetadata._sopInstanceUID === sopInstanceUid) {
                instance = instanceMetadata;

                return true;
            }
        });
    });

    return instance;
};

const getLatestSRSeries = () => {
    const allStudies = OHIF.viewer.StudyMetadataList.all();
    let latestSeries;

    allStudies.forEach(study => {
        study.getSeries().forEach(series => {
            const firstInstance = series.getFirstInstance();
            const sopClassUid = firstInstance._instance.sopClassUid;

            if (supportedSopClassUIDs.includes(sopClassUid)) {
                if(!latestSeries) {
                    latestSeries = series;
                } else if (series._data.seriesDate > latestSeries._data.seriesDate || 
                    (series._data.seriesDate === latestSeries._data.seriesDate && series._data.seriesTime > latestSeries._data.seriesTime)) {
                     latestSeries = series;
                }
            }
        });
    });

    return latestSeries;
};

const stringToArray = (string) =>  {
    return Uint8Array.from(Array.from(string).map(letter => letter.charCodeAt(0)))
};

const multipartEncode = (dataset, boundary) => {
    
    const denaturalizedMetaheader = dcmjs.data.DicomMetaDictionary.denaturalizeDataset(dataset._meta);
    const dicomDict = new dcmjs.data.DicomDict(denaturalizedMetaheader);
    
    dicomDict.dict = dcmjs.data.DicomMetaDictionary.denaturalizeDataset(dataset);
    
    const part10Buffer = dicomDict.write();
    
    const header = `\r\n--${boundary}\r\nContent-Type: application/dicom\r\n\r\n`;
    const footer = `\r\n--${boundary}--`;
    
    headerArray = stringToArray(header);
    contentArray = new Uint8Array(part10Buffer);
    footerArray = stringToArray(footer);
    
    const multipartArray = new Uint8Array(headerArray.length + contentArray.length + footerArray.length);
    
    multipartArray.set(headerArray, 0);
    multipartArray.set(contentArray, headerArray.length);
    multipartArray.set(footerArray, headerArray.length + contentArray.length);
    
    return(multipartArray.buffer);
};

export {
    codeMeaningEquals,
    getAllDisplaySets,
    getInstanceMetadata,
    getLatestSRSeries,
    multipartEncode,
    toArray
}