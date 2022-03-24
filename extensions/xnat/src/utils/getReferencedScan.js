import sessionMap from './sessionMap';

/**
 * _getReferencedScan - If the collectionInfoJSON contains a scan from the sessionMap,
 * return that scan object from the sessionMap.
 *
 * @param  {Object} collectionInfoJSON The collection info fetched from XNAT.
 * @returns {Object|null}
 */
export default function getReferencedScan(collectionInfoJSON) {
  const item = collectionInfoJSON.items[0];
  const children = item.children;

  // Check the collection references this seriesInstanceUid.
  for (let i = 0; i < children.length; i++) {
    if (children[i].field === 'references/seriesUID') {
      const referencedSeriesInstanceUidList = children[i].items;

      for (let j = 0; j < referencedSeriesInstanceUidList.length; j++) {
        const seriesInstanceUid =
          referencedSeriesInstanceUidList[j].data_fields.seriesUID;

        const scan = sessionMap.getScan(seriesInstanceUid);

        if (scan) {
          return scan;
        }
      }
    }
  }
}
