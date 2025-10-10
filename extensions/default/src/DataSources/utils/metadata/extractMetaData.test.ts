import {
  dicomWebToDicomStructure,
  generateInstanceMetaData,
  generateStudyMetaData,
} from './extractMetaData';
import {
  dicomInstances,
  naturalizedInstances,
  dicomWebConfig,
  expectedStudyMetadata,
  naturalizedQidoInstances,
  expectedInstanceMetadata,
} from '../data.test';
import { DicomSeriesStructureData, RawDicomInstances } from '../Types';

describe('extractMetaData', () => {


  it('convert DICOMWeb JSON objects to parsed objects', () => {
    const result = dicomWebToDicomStructure(dicomInstances);
    expect(JSON.stringify(result)).toStrictEqual(JSON.stringify(naturalizedInstances));
  });


  it('generate study metadata structure', () => {
    const dicomSeriesInstances: DicomSeriesStructureData = [naturalizedInstances];
    const result = generateStudyMetaData(dicomSeriesInstances, dicomWebConfig);
    expect(JSON.stringify(result)).toStrictEqual(JSON.stringify(expectedStudyMetadata));
  });


  it('generate instance metadata structure', () => {
    const qidoInstances = Array.from(naturalizedQidoInstances);
    const wadoInstances = Array.from(dicomInstances);
    const dicomQidoInstances = [[qidoInstances.shift(), qidoInstances.pop()]];
    const dicomWadoInstances = [[wadoInstances.shift(), wadoInstances.pop()]];
    const result = generateInstanceMetaData(dicomQidoInstances, dicomWadoInstances);

    expect(JSON.stringify(result)).toStrictEqual(JSON.stringify([expectedInstanceMetadata]));
  });
});
