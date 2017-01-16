import { getSortedData } from './getSortedData';

const getDisplaySets = (studyMetadata, seriesNumber, iteratorFunction) => {
    const iteratorFn = typeof iteratorFunction !== 'function' ? getSortedData : iteratorFunction;
    
    return iteratorFn(studyMetadata, seriesNumber);
};

const sortingManager = {
    getDisplaySets
};

export { sortingManager };