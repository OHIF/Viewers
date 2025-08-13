import {addRetrieveBulkData, addRetrieveBulkDataNaturalized} from './retrieveBulkData';
import {
  naturalizedInstances,
  client,
  dicomWebConfig,
  expectedNaturalizedInstances,
  bulkDataURIExample,
} from '../utils/data.test';
import * as assert from 'node:assert';
import { DicomStructure, DicomStructureData } from '../utils/Types';

describe('retrieveBulkData', () => {


  it('should be able to add Bulk data uri to naturalized instances [addRetrieveBulkDataNaturalized]', () => {
    const result: DicomStructureData = naturalizedInstances.map(
      instance => addRetrieveBulkDataNaturalized(
        instance,
        client,
        dicomWebConfig,
      )
    );
    expect(JSON.stringify(result)).toStrictEqual(JSON.stringify(expectedNaturalizedInstances));
    expect(result.pop().PixelData.BulkDataURI).toStrictEqual(bulkDataURIExample);
  });


  it('should be able to add Bulk data uri to naturalized instances [addRetrieveBulkData]', () => {
    const result = naturalizedInstances.map(
      instance => addRetrieveBulkData(
        instance,
        client,
        dicomWebConfig,
      )
    );
    expect(JSON.stringify(result)).toStrictEqual(JSON.stringify(expectedNaturalizedInstances));
    expect(result.pop().PixelData.BulkDataURI).toStrictEqual(bulkDataURIExample);
  });
});
