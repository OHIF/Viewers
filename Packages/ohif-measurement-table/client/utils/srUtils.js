import { dcmjs } from 'meteor/ohif:cornerstone';

const supportedSopClassUIDs = ['1.2.840.10008.5.1.4.1.1.88.22'];

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

export {
    getAllDisplaySets,
    getInstanceMetadata,
    getLatestSRSeries,
}
