import { chartSopClassUids, displaySetRules } from '@cornerstonejs/metadata';
import getMetadataContextCustomization from './metadataContextCustomization';
import getMetadataDisplaySetCustomization from './metadataDisplaySetCustomization';
import { ChartDataSOPClassUid } from '../SOPClassHandlers/chartSOPClassHandler';

describe('split customization defaults', () => {
  const { metadataContext } = getMetadataContextCustomization();

  it('holds no function in the metadataContext default, so a server can read it as data', () => {
    expect(JSON.parse(JSON.stringify(metadataContext))).toEqual(metadataContext);
  });

  it('adds the private chart SOP class to the CS3D chart list', () => {
    expect(metadataContext.chartSopClassUids).toEqual([...chartSopClassUids, ChartDataSOPClassUid]);
  });

  it('uses the CS3D default rule set as the default split rules', () => {
    const { useMetadataDisplaySet } = getMetadataDisplaySetCustomization({} as never);
    expect(useMetadataDisplaySet.splitRules).toBe(displaySetRules);
  });
});
