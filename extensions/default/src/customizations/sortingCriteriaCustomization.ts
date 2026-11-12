import { utils } from '@ohif/core';

const { sortingCriteria } = utils;
const { seriesSortCriteria } = sortingCriteria;

/** Stable series order for e2e (Playwright sets TEST_ENV=true via cross-env). */
const sortingCriteriaFn =
  process.env.TEST_ENV === 'true'
    ? seriesSortCriteria.compareSeriesUID
    : seriesSortCriteria.seriesInfoSortingCriteria;

export default {
  sortingCriteria: sortingCriteriaFn,
};
