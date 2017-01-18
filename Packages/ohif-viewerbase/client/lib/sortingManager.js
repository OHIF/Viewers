import { createStacks } from './createStacks';

const getDisplaySets = (studyMetadata, seriesNumber, iteratorFunction) => {
    const iteratorFn = typeof iteratorFunction !== 'function' ? createStacks : iteratorFunction;
    
    return iteratorFn(studyMetadata, seriesNumber);
};

const sortingManager = {
    getDisplaySets
};

export { sortingManager };