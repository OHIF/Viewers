import {addRetrieveBulkData, addRetrieveBulkDataNaturalized} from './retrieveBulkData';
import {
  naturalizedInstances,
  client,
  dicomWebConfig,
  expectedNaturalizedInstances,
} from '../utils/data.test';
import * as assert from 'node:assert';

describe('retrieveBulkData', () => {


  it('should be able to add Bulk data uri to naturalized instances [addRetrieveBulkDataNaturalized]', () => {
    const result = naturalizedInstances.map(
      instance => addRetrieveBulkDataNaturalized(
        instance,
        client,
        dicomWebConfig,
      )
    );
    expect(JSON.stringify(result)).toStrictEqual(JSON.stringify(expectedNaturalizedInstances));
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
  });
});
