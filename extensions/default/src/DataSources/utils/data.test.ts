/**
 * Repository of static data and variables to use as priori for testing.
 */
import { api } from 'dicomweb-client';
import { dicomWebToDicomStructure } from './metadata/extractMetaData';
import { errorHandler } from '@ohif/core';
import { retrieveBulkData } from './wado/retrieveBulkData';

export const dicomWebConfig = {
  friendlyName: 'AWS S3 Static wado server',
  name: 'aws',
  wadoUriRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
  qidoRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
  wadoRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
  qidoSupportsIncludeField: false,
  imageRendering: 'wadors',
  thumbnailRendering: 'wadors',
  enableStudyLazyLoad: true,
  supportsFuzzyMatching: true,
  supportsWildcard: false,
  staticWado: true,
  singlepart: 'bulkdata,video',
  // whether the data source should use retrieveBulkData to grab metadata,
  // and in case of relative path, what would it be relative to, options
  // are in the series level or study level (some servers like series some study)
  bulkDataURI: {
    enabled: true,
    relativeResolution: 'studies',
    transform: url => url.replace('/pixeldata.mp4', '/rendered'),
  },
  omitQuotationForMultipartRequest: true,
};
export const qidoConfig = {
  url: dicomWebConfig.qidoRoot,
  staticWado: dicomWebConfig.staticWado,
  singlepart: dicomWebConfig.singlepart,
  headers: { Accept: '' },
  errorInterceptor: errorHandler.getHTTPErrorHandler(),
  supportsFuzzyMatching: dicomWebConfig.supportsFuzzyMatching,
};
export const searchOptions = {};
export const client = new api.DICOMwebClient(qidoConfig);
export const dicomInstances = [
  {
    '00080013': {
      vr: 'TM',
      Value: ['110724'],
    },
    '00080014': {
      vr: 'UI',
      Value: ['2.16.124.113543.6004.101.103'],
    },
    '00080018': {
      Value: ['1.3.6.1.4.1.9590.100.1.2.346385697213345623712464894863342033573'],
    },
    '00080032': {
      vr: 'TM',
      Value: ['110724'],
    },
    '00080033': {
      vr: 'TM',
      Value: ['110724'],
    },
    '00081080': {
      vr: 'LO',
      Value: ['NA'],
    },
    '00082111': {
      vr: 'ST',
      Value: ['NA'],
    },
    '001021B0': {
      vr: 'LT',
      Value: ['Images from the 2002 AAPM task group report on display performan'],
    },
    '00104000': {
      vr: 'LT',
      Value: ['NA'],
    },
    '00181014': {
      vr: 'TM',
      Value: ['110724'],
    },
    '00181023': {
      vr: 'LO',
      Value: ['Image exported from tShow application'],
    },
    '00200013': {
      vr: 'IS',
      Value: [1],
    },
    '00200060': {
      vr: 'CS',
      Value: ['NA'],
    },
    '00201002': {
      vr: 'IS',
      Value: [1],
    },
    '00280106': {
      vr: 'US|SS',
      InlineBinary: 'AAA=',
    },
    '00280107': {
      vr: 'US|SS',
      InlineBinary: '/w8=',
    },
    '7FE00010': {
      vr: 'OB|OW',
      BulkDataURI:
        'instances/1.3.6.1.4.1.9590.100.1.2.346385697213345623712464894863342033573/frames',
    },
    '00083002': {
      Value: ['1.2.840.10008.1.2.4.80'],
    },
    '00090010': {
      Value: ['dedupped'],
      vr: 'CS',
    },
    '00091010': {
      Value: [
        '0f4205417d9d2658a75f28b85651939a9832e5649ef0475ad19a3d53956ac9a0',
        '602b9c21e612ba224493bcbf1a867bde745371e7b60dd6a149fe6e8d7bba5af9',
        'dc77149ddb654f34e3fe66cb443495acb2b60fbc18ded168e31e0fc64147eeb9',
        '36bf58abfb35d6a35cdf7f077d92d80980703c13e590e2074819c95428eac7cb',
      ],
    },
    '0020000E': {
      Value: ['2.16.124.113543.6004.101.103.20021117.190619.1.001'],
    },
    '00091011': {
      Value: ['28b44927e9e3ec0003e5183bcb817c6ada9a84085b0e8ced4550a4c6be6cbaed'],
    },
    '00091012': {
      Value: ['instance'],
    },
    '00100020': {
      vr: 'LO',
      Value: ['TG18-2002'],
    },
    '00100010': {
      vr: 'PN',
      Value: [
        {
          Alphabetic: 'AAPM^Test^Patterns',
        },
      ],
    },
    '00100030': {
      vr: 'DA',
      Value: ['20020704'],
    },
    '00100040': {
      vr: 'CS',
      Value: ['O'],
    },
    '00081030': {
      vr: 'LO',
      Value: ['Multi Purpose 1K'],
    },
    '00080050': {
      vr: 'SH',
      Value: ['20022002'],
    },
    '0020000D': {
      vr: 'UI',
      Value: ['2.16.124.113543.6004.101.103.20021117.190619.1'],
    },
    '00080020': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080030': {
      vr: 'TM',
      Value: ['190619'],
    },
    '00200010': {
      vr: 'SH',
      Value: ['1K-MULTI'],
    },
    '0008103E': {
      vr: 'LO',
      Value: ['TG18-OIQ'],
    },
    '00200011': {
      vr: 'IS',
      Value: [1],
    },
    '00080060': {
      vr: 'CS',
      Value: ['OT'],
    },
    '00080021': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080031': {
      vr: 'TM',
      Value: ['110724'],
    },
    '00080090': {
      vr: 'PN',
      Value: [
        {
          Alphabetic: 'AAPM',
        },
      ],
    },
    '00180015': {
      vr: 'CS',
      Value: ['NA'],
    },
    '00181030': {
      vr: 'LO',
      Value: ['Display  Quality Test Protocol'],
    },
    '00080008': {
      vr: 'CS',
      Value: ['ORIGINAL'],
    },
    '00080012': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080016': {
      vr: 'UI',
      Value: ['1.2.840.10008.5.1.4.1.1.7'],
    },
    '00080064': {
      vr: 'CS',
      Value: ['WSD'],
    },
    '00080023': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080022': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00181012': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00181016': {
      vr: 'LO',
      Value: ['Duke University Health System'],
    },
    '00181018': {
      vr: 'LO',
      Value: ['MATLAB'],
    },
    '00280002': {
      vr: 'US',
      Value: [1],
    },
    '00280004': {
      vr: 'CS',
      Value: ['MONOCHROME2'],
    },
    '00280010': {
      vr: 'US',
      Value: [1024],
    },
    '00280011': {
      vr: 'US',
      Value: [1024],
    },
    '00280100': {
      vr: 'US',
      Value: [16],
    },
    '00280101': {
      vr: 'US',
      Value: [16],
    },
    '00280102': {
      vr: 'US',
      Value: [15],
    },
    '00280103': {
      vr: 'US',
      Value: [0],
    },
    '00200020': {
      vr: 'CS',
    },
  },
  {
    '00080013': {
      vr: 'TM',
      Value: ['140724'],
    },
    '00080014': {
      vr: 'UI',
      Value: ['2.16.124.113543.6004.101.103'],
    },
    '00080018': {
      Value: ['1.3.6.1.4.1.9590.100.1.2.294498401812162035928148179312426786986'],
    },
    '00080032': {
      vr: 'TM',
      Value: ['140724'],
    },
    '00080033': {
      vr: 'TM',
      Value: ['140724'],
    },
    '00081080': {
      vr: 'LO',
      Value: ['NA'],
    },
    '00082111': {
      vr: 'ST',
      Value: ['NA'],
    },
    '001021B0': {
      vr: 'LT',
      Value: ['Images from the 2002 AAPM task group report on display performan'],
    },
    '00104000': {
      vr: 'LT',
      Value: ['NA'],
    },
    '00181014': {
      vr: 'TM',
      Value: ['140724'],
    },
    '00181023': {
      vr: 'LO',
      Value: ['Image exported from tShow application'],
    },
    '00200013': {
      vr: 'IS',
      Value: [1],
    },
    '00200060': {
      vr: 'CS',
      Value: ['NA'],
    },
    '00201002': {
      vr: 'IS',
      Value: [1],
    },
    '00280106': {
      vr: 'US|SS',
      InlineBinary: 'AAA=',
    },
    '00280107': {
      vr: 'US|SS',
      InlineBinary: '/w8=',
    },
    '7FE00010': {
      vr: 'OB|OW',
      BulkDataURI:
        'instances/1.3.6.1.4.1.9590.100.1.2.294498401812162035928148179312426786986/frames',
    },
    '00083002': {
      Value: ['1.2.840.10008.1.2.4.80'],
    },
    '00090010': {
      Value: ['dedupped'],
      vr: 'CS',
    },
    '00091010': {
      Value: [
        '0f4205417d9d2658a75f28b85651939a9832e5649ef0475ad19a3d53956ac9a0',
        '602b9c21e612ba224493bcbf1a867bde745371e7b60dd6a149fe6e8d7bba5af9',
        '07583ddd16e12b13e95a3a4a0bdd7b7890a4aad251e94cb91323e5286187b915',
        '4d311847ac3f203f23fd3db59316f3508c904e5d093bab489ca1662f8d67b56b',
      ],
    },
    '0020000E': {
      Value: ['2.16.124.113543.6004.101.103.20021117.190619.1.001'],
    },
    '00091011': {
      Value: ['ce8828ba234b481d0d0c8c62898b6779fdc0c7bac7e9ee691e27806664108522'],
    },
    '00091012': {
      Value: ['instance'],
    },
    '00100020': {
      vr: 'LO',
      Value: ['TG18-2002'],
    },
    '00100010': {
      vr: 'PN',
      Value: [
        {
          Alphabetic: 'AAPM^Test^Patterns',
        },
      ],
    },
    '00100030': {
      vr: 'DA',
      Value: ['20020704'],
    },
    '00100040': {
      vr: 'CS',
      Value: ['O'],
    },
    '00081030': {
      vr: 'LO',
      Value: ['Multi Purpose 1K'],
    },
    '00080050': {
      vr: 'SH',
      Value: ['20022002'],
    },
    '0020000D': {
      vr: 'UI',
      Value: ['2.16.124.113543.6004.101.103.20021117.190619.1'],
    },
    '00080020': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080030': {
      vr: 'TM',
      Value: ['190619'],
    },
    '00200010': {
      vr: 'SH',
      Value: ['1K-MULTI'],
    },
    '0008103E': {
      vr: 'LO',
      Value: ['TG18-OIQ'],
    },
    '00200011': {
      vr: 'IS',
      Value: [1],
    },
    '00080060': {
      vr: 'CS',
      Value: ['OT'],
    },
    '00080021': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080031': {
      vr: 'TM',
      Value: ['140724'],
    },
    '00080090': {
      vr: 'PN',
      Value: [
        {
          Alphabetic: 'AAPM',
        },
      ],
    },
    '00180015': {
      vr: 'CS',
      Value: ['NA'],
    },
    '00181030': {
      vr: 'LO',
      Value: ['Display  Quality Test Protocol'],
    },
    '00080008': {
      vr: 'CS',
      Value: ['ORIGINAL'],
    },
    '00080012': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080016': {
      vr: 'UI',
      Value: ['1.2.840.10008.5.1.4.1.1.7'],
    },
    '00080064': {
      vr: 'CS',
      Value: ['WSD'],
    },
    '00080023': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080022': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00181012': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00181016': {
      vr: 'LO',
      Value: ['Duke University Health System'],
    },
    '00181018': {
      vr: 'LO',
      Value: ['MATLAB'],
    },
    '00280002': {
      vr: 'US',
      Value: [1],
    },
    '00280004': {
      vr: 'CS',
      Value: ['MONOCHROME2'],
    },
    '00280010': {
      vr: 'US',
      Value: [1024],
    },
    '00280011': {
      vr: 'US',
      Value: [1280],
    },
    '00280100': {
      vr: 'US',
      Value: [16],
    },
    '00280101': {
      vr: 'US',
      Value: [16],
    },
    '00280102': {
      vr: 'US',
      Value: [15],
    },
    '00280103': {
      vr: 'US',
      Value: [0],
    },
    '00200020': {
      vr: 'CS',
    },
  },
  {
    '00080013': {
      vr: 'TM',
      Value: ['160738'],
    },
    '00080014': {
      vr: 'UI',
      Value: ['2.16.124.113543.6004.101.103'],
    },
    '00080018': {
      Value: ['1.3.6.1.4.1.9590.100.1.2.304484424913537637032577967974004238574'],
    },
    '00080032': {
      vr: 'TM',
      Value: ['160738'],
    },
    '00080033': {
      vr: 'TM',
      Value: ['160738'],
    },
    '00081080': {
      vr: 'LO',
      Value: ['NA'],
    },
    '00082111': {
      vr: 'ST',
      Value: ['NA'],
    },
    '001021B0': {
      vr: 'LT',
      Value: ['Images from the 2002 AAPM task group report on display performan'],
    },
    '00104000': {
      vr: 'LT',
      Value: ['NA'],
    },
    '00181014': {
      vr: 'TM',
      Value: ['160738'],
    },
    '00181023': {
      vr: 'LO',
      Value: ['Image exported from tShow application'],
    },
    '00200013': {
      vr: 'IS',
      Value: [1],
    },
    '00200060': {
      vr: 'CS',
      Value: ['NA'],
    },
    '00201002': {
      vr: 'IS',
      Value: [1],
    },
    '00280106': {
      vr: 'US|SS',
      InlineBinary: 'AAA=',
    },
    '00280107': {
      vr: 'US|SS',
      InlineBinary: '/w8=',
    },
    '7FE00010': {
      vr: 'OB|OW',
      BulkDataURI:
        'instances/1.3.6.1.4.1.9590.100.1.2.304484424913537637032577967974004238574/frames',
    },
    '00083002': {
      Value: ['1.2.840.10008.1.2.4.80'],
    },
    '00090010': {
      Value: ['dedupped'],
      vr: 'CS',
    },
    '00091010': {
      Value: [
        '0f4205417d9d2658a75f28b85651939a9832e5649ef0475ad19a3d53956ac9a0',
        '602b9c21e612ba224493bcbf1a867bde745371e7b60dd6a149fe6e8d7bba5af9',
        '93df3408efa1dc2e9631eb030a9ac802b0844b3c03606ecc597dcb12e0c6e812',
        '5ae910ca86c68a269dd52aeae2d5faa167bc76b6474c463ebd8757c6a8f3758a',
      ],
    },
    '0020000E': {
      Value: ['2.16.124.113543.6004.101.103.20021117.190619.1.001'],
    },
    '00091011': {
      Value: ['988f02f735e0fc7372ff4e7373877689529135e238712ecc664961d0d3f20c27'],
    },
    '00091012': {
      Value: ['instance'],
    },
    '00100020': {
      vr: 'LO',
      Value: ['TG18-2002'],
    },
    '00100010': {
      vr: 'PN',
      Value: [
        {
          Alphabetic: 'AAPM^Test^Patterns',
        },
      ],
    },
    '00100030': {
      vr: 'DA',
      Value: ['20020704'],
    },
    '00100040': {
      vr: 'CS',
      Value: ['O'],
    },
    '00081030': {
      vr: 'LO',
      Value: ['Multi Purpose 1K'],
    },
    '00080050': {
      vr: 'SH',
      Value: ['20022002'],
    },
    '0020000D': {
      vr: 'UI',
      Value: ['2.16.124.113543.6004.101.103.20021117.190619.1'],
    },
    '00080020': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080030': {
      vr: 'TM',
      Value: ['190619'],
    },
    '00200010': {
      vr: 'SH',
      Value: ['1K-MULTI'],
    },
    '0008103E': {
      vr: 'LO',
      Value: ['TG18-OIQ'],
    },
    '00200011': {
      vr: 'IS',
      Value: [1],
    },
    '00080060': {
      vr: 'CS',
      Value: ['OT'],
    },
    '00080021': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080031': {
      vr: 'TM',
      Value: ['160738'],
    },
    '00080090': {
      vr: 'PN',
      Value: [
        {
          Alphabetic: 'AAPM',
        },
      ],
    },
    '00180015': {
      vr: 'CS',
      Value: ['NA'],
    },
    '00181030': {
      vr: 'LO',
      Value: ['Display  Quality Test Protocol'],
    },
    '00080008': {
      vr: 'CS',
      Value: ['ORIGINAL'],
    },
    '00080012': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080016': {
      vr: 'UI',
      Value: ['1.2.840.10008.5.1.4.1.1.7'],
    },
    '00080064': {
      vr: 'CS',
      Value: ['WSD'],
    },
    '00080023': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080022': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00181012': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00181016': {
      vr: 'LO',
      Value: ['Duke University Health System'],
    },
    '00181018': {
      vr: 'LO',
      Value: ['MATLAB'],
    },
    '00280002': {
      vr: 'US',
      Value: [1],
    },
    '00280004': {
      vr: 'CS',
      Value: ['MONOCHROME2'],
    },
    '00280010': {
      vr: 'US',
      Value: [1280],
    },
    '00280011': {
      vr: 'US',
      Value: [1024],
    },
    '00280100': {
      vr: 'US',
      Value: [16],
    },
    '00280101': {
      vr: 'US',
      Value: [16],
    },
    '00280102': {
      vr: 'US',
      Value: [15],
    },
    '00280103': {
      vr: 'US',
      Value: [0],
    },
    '00200020': {
      vr: 'CS',
    },
  },
];
export const naturalizedInstances = dicomWebToDicomStructure(dicomInstances);
export const expectedNaturalizedInstances = [
  {
    _vrMap: {
      SmallestImagePixelValue: 'US|SS',
      LargestImagePixelValue: 'US|SS',
      PixelData: 'OB|OW',
    },
    InstanceCreationTime: '110724',
    InstanceCreatorUID: '2.16.124.113543.6004.101.103',
    SOPInstanceUID: '1.3.6.1.4.1.9590.100.1.2.346385697213345623712464894863342033573',
    AcquisitionTime: '110724',
    ContentTime: '110724',
    AdmittingDiagnosesDescription: 'NA',
    DerivationDescription: 'NA',
    AdditionalPatientHistory: 'Images from the 2002 AAPM task group report on display performan',
    PatientComments: 'NA',
    TimeOfSecondaryCapture: '110724',
    DigitalImageFormatAcquired: 'Image exported from tShow application',
    InstanceNumber: 1,
    Laterality: 'NA',
    ImagesInAcquisition: 1,
    SmallestImagePixelValue: { InlineBinary: 'AAA=' },
    LargestImagePixelValue: { InlineBinary: '/w8=' },
    PixelData: {
      BulkDataURI:
        'https://d14fa38qiwhyfd.cloudfront.net/dicomweb/studies/2.16.124.113543.6004.101.103.20021117.190619.1/series/2.16.124.113543.6004.101.103.20021117.190619.1.001/instances/1.3.6.1.4.1.9590.100.1.2.346385697213345623712464894863342033573/frames',
    },
    AvailableTransferSyntaxUID: '1.2.840.10008.1.2.4.80',
    '00090010': 'dedupped',
    '00091010': [
      '0f4205417d9d2658a75f28b85651939a9832e5649ef0475ad19a3d53956ac9a0',
      '602b9c21e612ba224493bcbf1a867bde745371e7b60dd6a149fe6e8d7bba5af9',
      'dc77149ddb654f34e3fe66cb443495acb2b60fbc18ded168e31e0fc64147eeb9',
      '36bf58abfb35d6a35cdf7f077d92d80980703c13e590e2074819c95428eac7cb',
    ],
    SeriesInstanceUID: '2.16.124.113543.6004.101.103.20021117.190619.1.001',
    '00091011': '28b44927e9e3ec0003e5183bcb817c6ada9a84085b0e8ced4550a4c6be6cbaed',
    '00091012': 'instance',
    PatientID: 'TG18-2002',
    PatientName: [{ Alphabetic: 'AAPM^Test^Patterns' }],
    PatientBirthDate: '20020704',
    PatientSex: 'O',
    StudyDescription: 'Multi Purpose 1K',
    AccessionNumber: '20022002',
    StudyInstanceUID: '2.16.124.113543.6004.101.103.20021117.190619.1',
    StudyDate: '20180724',
    StudyTime: '190619',
    StudyID: '1K-MULTI',
    SeriesDescription: 'TG18-OIQ',
    SeriesNumber: 1,
    Modality: 'OT',
    SeriesDate: '20180724',
    SeriesTime: '110724',
    ReferringPhysicianName: [{ Alphabetic: 'AAPM' }],
    BodyPartExamined: 'NA',
    ProtocolName: 'Display  Quality Test Protocol',
    ImageType: 'ORIGINAL',
    InstanceCreationDate: '20180724',
    SOPClassUID: '1.2.840.10008.5.1.4.1.1.7',
    ConversionType: 'WSD',
    ContentDate: '20180724',
    AcquisitionDate: '20180724',
    DateOfSecondaryCapture: '20180724',
    SecondaryCaptureDeviceManufacturer: 'Duke University Health System',
    SecondaryCaptureDeviceManufacturerModelName: 'MATLAB',
    SamplesPerPixel: 1,
    PhotometricInterpretation: 'MONOCHROME2',
    Rows: 1024,
    Columns: 1024,
    BitsAllocated: 16,
    BitsStored: 16,
    HighBit: 15,
    PixelRepresentation: 0,
    PatientOrientation: null,
  },
  {
    _vrMap: {
      SmallestImagePixelValue: 'US|SS',
      LargestImagePixelValue: 'US|SS',
      PixelData: 'OB|OW',
    },
    InstanceCreationTime: '140724',
    InstanceCreatorUID: '2.16.124.113543.6004.101.103',
    SOPInstanceUID: '1.3.6.1.4.1.9590.100.1.2.294498401812162035928148179312426786986',
    AcquisitionTime: '140724',
    ContentTime: '140724',
    AdmittingDiagnosesDescription: 'NA',
    DerivationDescription: 'NA',
    AdditionalPatientHistory: 'Images from the 2002 AAPM task group report on display performan',
    PatientComments: 'NA',
    TimeOfSecondaryCapture: '140724',
    DigitalImageFormatAcquired: 'Image exported from tShow application',
    InstanceNumber: 1,
    Laterality: 'NA',
    ImagesInAcquisition: 1,
    SmallestImagePixelValue: { InlineBinary: 'AAA=' },
    LargestImagePixelValue: { InlineBinary: '/w8=' },
    PixelData: {
      BulkDataURI:
        'https://d14fa38qiwhyfd.cloudfront.net/dicomweb/studies/2.16.124.113543.6004.101.103.20021117.190619.1/series/2.16.124.113543.6004.101.103.20021117.190619.1.001/instances/1.3.6.1.4.1.9590.100.1.2.294498401812162035928148179312426786986/frames',
    },
    AvailableTransferSyntaxUID: '1.2.840.10008.1.2.4.80',
    '00090010': 'dedupped',
    '00091010': [
      '0f4205417d9d2658a75f28b85651939a9832e5649ef0475ad19a3d53956ac9a0',
      '602b9c21e612ba224493bcbf1a867bde745371e7b60dd6a149fe6e8d7bba5af9',
      '07583ddd16e12b13e95a3a4a0bdd7b7890a4aad251e94cb91323e5286187b915',
      '4d311847ac3f203f23fd3db59316f3508c904e5d093bab489ca1662f8d67b56b',
    ],
    SeriesInstanceUID: '2.16.124.113543.6004.101.103.20021117.190619.1.001',
    '00091011': 'ce8828ba234b481d0d0c8c62898b6779fdc0c7bac7e9ee691e27806664108522',
    '00091012': 'instance',
    PatientID: 'TG18-2002',
    PatientName: [{ Alphabetic: 'AAPM^Test^Patterns' }],
    PatientBirthDate: '20020704',
    PatientSex: 'O',
    StudyDescription: 'Multi Purpose 1K',
    AccessionNumber: '20022002',
    StudyInstanceUID: '2.16.124.113543.6004.101.103.20021117.190619.1',
    StudyDate: '20180724',
    StudyTime: '190619',
    StudyID: '1K-MULTI',
    SeriesDescription: 'TG18-OIQ',
    SeriesNumber: 1,
    Modality: 'OT',
    SeriesDate: '20180724',
    SeriesTime: '140724',
    ReferringPhysicianName: [{ Alphabetic: 'AAPM' }],
    BodyPartExamined: 'NA',
    ProtocolName: 'Display  Quality Test Protocol',
    ImageType: 'ORIGINAL',
    InstanceCreationDate: '20180724',
    SOPClassUID: '1.2.840.10008.5.1.4.1.1.7',
    ConversionType: 'WSD',
    ContentDate: '20180724',
    AcquisitionDate: '20180724',
    DateOfSecondaryCapture: '20180724',
    SecondaryCaptureDeviceManufacturer: 'Duke University Health System',
    SecondaryCaptureDeviceManufacturerModelName: 'MATLAB',
    SamplesPerPixel: 1,
    PhotometricInterpretation: 'MONOCHROME2',
    Rows: 1024,
    Columns: 1280,
    BitsAllocated: 16,
    BitsStored: 16,
    HighBit: 15,
    PixelRepresentation: 0,
    PatientOrientation: null,
  },
  {
    _vrMap: {
      SmallestImagePixelValue: 'US|SS',
      LargestImagePixelValue: 'US|SS',
      PixelData: 'OB|OW',
    },
    InstanceCreationTime: '160738',
    InstanceCreatorUID: '2.16.124.113543.6004.101.103',
    SOPInstanceUID: '1.3.6.1.4.1.9590.100.1.2.304484424913537637032577967974004238574',
    AcquisitionTime: '160738',
    ContentTime: '160738',
    AdmittingDiagnosesDescription: 'NA',
    DerivationDescription: 'NA',
    AdditionalPatientHistory: 'Images from the 2002 AAPM task group report on display performan',
    PatientComments: 'NA',
    TimeOfSecondaryCapture: '160738',
    DigitalImageFormatAcquired: 'Image exported from tShow application',
    InstanceNumber: 1,
    Laterality: 'NA',
    ImagesInAcquisition: 1,
    SmallestImagePixelValue: { InlineBinary: 'AAA=' },
    LargestImagePixelValue: { InlineBinary: '/w8=' },
    PixelData: {
      BulkDataURI:
        'https://d14fa38qiwhyfd.cloudfront.net/dicomweb/studies/2.16.124.113543.6004.101.103.20021117.190619.1/series/2.16.124.113543.6004.101.103.20021117.190619.1.001/instances/1.3.6.1.4.1.9590.100.1.2.304484424913537637032577967974004238574/frames',
    },
    AvailableTransferSyntaxUID: '1.2.840.10008.1.2.4.80',
    '00090010': 'dedupped',
    '00091010': [
      '0f4205417d9d2658a75f28b85651939a9832e5649ef0475ad19a3d53956ac9a0',
      '602b9c21e612ba224493bcbf1a867bde745371e7b60dd6a149fe6e8d7bba5af9',
      '93df3408efa1dc2e9631eb030a9ac802b0844b3c03606ecc597dcb12e0c6e812',
      '5ae910ca86c68a269dd52aeae2d5faa167bc76b6474c463ebd8757c6a8f3758a',
    ],
    SeriesInstanceUID: '2.16.124.113543.6004.101.103.20021117.190619.1.001',
    '00091011': '988f02f735e0fc7372ff4e7373877689529135e238712ecc664961d0d3f20c27',
    '00091012': 'instance',
    PatientID: 'TG18-2002',
    PatientName: [{ Alphabetic: 'AAPM^Test^Patterns' }],
    PatientBirthDate: '20020704',
    PatientSex: 'O',
    StudyDescription: 'Multi Purpose 1K',
    AccessionNumber: '20022002',
    StudyInstanceUID: '2.16.124.113543.6004.101.103.20021117.190619.1',
    StudyDate: '20180724',
    StudyTime: '190619',
    StudyID: '1K-MULTI',
    SeriesDescription: 'TG18-OIQ',
    SeriesNumber: 1,
    Modality: 'OT',
    SeriesDate: '20180724',
    SeriesTime: '160738',
    ReferringPhysicianName: [{ Alphabetic: 'AAPM' }],
    BodyPartExamined: 'NA',
    ProtocolName: 'Display  Quality Test Protocol',
    ImageType: 'ORIGINAL',
    InstanceCreationDate: '20180724',
    SOPClassUID: '1.2.840.10008.5.1.4.1.1.7',
    ConversionType: 'WSD',
    ContentDate: '20180724',
    AcquisitionDate: '20180724',
    DateOfSecondaryCapture: '20180724',
    SecondaryCaptureDeviceManufacturer: 'Duke University Health System',
    SecondaryCaptureDeviceManufacturerModelName: 'MATLAB',
    SamplesPerPixel: 1,
    PhotometricInterpretation: 'MONOCHROME2',
    Rows: 1280,
    Columns: 1024,
    BitsAllocated: 16,
    BitsStored: 16,
    HighBit: 15,
    PixelRepresentation: 0,
    PatientOrientation: null,
  },
];
export const bulkDataURIExample =
  'https://d14fa38qiwhyfd.cloudfront.net/dicomweb/studies/2.16.124.113543.6004.101.103.20021117.190619.1/series/2.16.124.113543.6004.101.103.20021117.190619.1.001/instances/1.3.6.1.4.1.9590.100.1.2.304484424913537637032577967974004238574/frames';
export const expectedStudyMetadata = {
  seriesSummaryMetadata: {
    '2.16.124.113543.6004.101.103.20021117.190619.1.001': {
      StudyInstanceUID: '2.16.124.113543.6004.101.103.20021117.190619.1',
      StudyDescription: 'Multi Purpose 1K',
      SeriesInstanceUID: '2.16.124.113543.6004.101.103.20021117.190619.1.001',
      SeriesDescription: 'TG18-OIQ',
      SeriesNumber: 1,
      SeriesTime: '110724',
      SOPClassUID: '1.2.840.10008.5.1.4.1.1.7',
      ProtocolName: 'Display  Quality Test Protocol',
      Modality: 'OT',
    },
  },
  instancesPerSeries: {
    '2.16.124.113543.6004.101.103.20021117.190619.1.001': [
      {
        _vrMap: {
          SmallestImagePixelValue: 'US|SS',
          LargestImagePixelValue: 'US|SS',
          PixelData: 'OB|OW',
        },
        InstanceCreationTime: '110724',
        InstanceCreatorUID: '2.16.124.113543.6004.101.103',
        SOPInstanceUID: '1.3.6.1.4.1.9590.100.1.2.346385697213345623712464894863342033573',
        AcquisitionTime: '110724',
        ContentTime: '110724',
        AdmittingDiagnosesDescription: 'NA',
        DerivationDescription: 'NA',
        AdditionalPatientHistory:
          'Images from the 2002 AAPM task group report on display performan',
        PatientComments: 'NA',
        TimeOfSecondaryCapture: '110724',
        DigitalImageFormatAcquired: 'Image exported from tShow application',
        InstanceNumber: 1,
        Laterality: 'NA',
        ImagesInAcquisition: 1,
        SmallestImagePixelValue: { InlineBinary: 'AAA=' },
        LargestImagePixelValue: { InlineBinary: '/w8=' },
        PixelData: {
          BulkDataURI:
            'instances/1.3.6.1.4.1.9590.100.1.2.346385697213345623712464894863342033573/frames',
        },
        AvailableTransferSyntaxUID: '1.2.840.10008.1.2.4.80',
        '00090010': 'dedupped',
        '00091010': [
          '0f4205417d9d2658a75f28b85651939a9832e5649ef0475ad19a3d53956ac9a0',
          '602b9c21e612ba224493bcbf1a867bde745371e7b60dd6a149fe6e8d7bba5af9',
          'dc77149ddb654f34e3fe66cb443495acb2b60fbc18ded168e31e0fc64147eeb9',
          '36bf58abfb35d6a35cdf7f077d92d80980703c13e590e2074819c95428eac7cb',
        ],
        SeriesInstanceUID: '2.16.124.113543.6004.101.103.20021117.190619.1.001',
        '00091011': '28b44927e9e3ec0003e5183bcb817c6ada9a84085b0e8ced4550a4c6be6cbaed',
        '00091012': 'instance',
        PatientID: 'TG18-2002',
        PatientName: [{ Alphabetic: 'AAPM^Test^Patterns' }],
        PatientBirthDate: '20020704',
        PatientSex: 'O',
        StudyDescription: 'Multi Purpose 1K',
        AccessionNumber: '20022002',
        StudyInstanceUID: '2.16.124.113543.6004.101.103.20021117.190619.1',
        StudyDate: '20180724',
        StudyTime: '190619',
        StudyID: '1K-MULTI',
        SeriesDescription: 'TG18-OIQ',
        SeriesNumber: 1,
        Modality: 'OT',
        SeriesDate: '20180724',
        SeriesTime: '110724',
        ReferringPhysicianName: [{ Alphabetic: 'AAPM' }],
        BodyPartExamined: 'NA',
        ProtocolName: 'Display  Quality Test Protocol',
        ImageType: 'ORIGINAL',
        InstanceCreationDate: '20180724',
        SOPClassUID: '1.2.840.10008.5.1.4.1.1.7',
        ConversionType: 'WSD',
        ContentDate: '20180724',
        AcquisitionDate: '20180724',
        DateOfSecondaryCapture: '20180724',
        SecondaryCaptureDeviceManufacturer: 'Duke University Health System',
        SecondaryCaptureDeviceManufacturerModelName: 'MATLAB',
        SamplesPerPixel: 1,
        PhotometricInterpretation: 'MONOCHROME2',
        Rows: 1024,
        Columns: 1024,
        BitsAllocated: 16,
        BitsStored: 16,
        HighBit: 15,
        PixelRepresentation: 0,
        PatientOrientation: null,
        imageId:
          'wadors:https://d14fa38qiwhyfd.cloudfront.net/dicomweb/studies/2.16.124.113543.6004.101.103.20021117.190619.1/series/2.16.124.113543.6004.101.103.20021117.190619.1.001/instances/1.3.6.1.4.1.9590.100.1.2.346385697213345623712464894863342033573/frames/1',
        wadoRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
      },
      {
        _vrMap: {
          SmallestImagePixelValue: 'US|SS',
          LargestImagePixelValue: 'US|SS',
          PixelData: 'OB|OW',
        },
        InstanceCreationTime: '140724',
        InstanceCreatorUID: '2.16.124.113543.6004.101.103',
        SOPInstanceUID: '1.3.6.1.4.1.9590.100.1.2.294498401812162035928148179312426786986',
        AcquisitionTime: '140724',
        ContentTime: '140724',
        AdmittingDiagnosesDescription: 'NA',
        DerivationDescription: 'NA',
        AdditionalPatientHistory:
          'Images from the 2002 AAPM task group report on display performan',
        PatientComments: 'NA',
        TimeOfSecondaryCapture: '140724',
        DigitalImageFormatAcquired: 'Image exported from tShow application',
        InstanceNumber: 1,
        Laterality: 'NA',
        ImagesInAcquisition: 1,
        SmallestImagePixelValue: { InlineBinary: 'AAA=' },
        LargestImagePixelValue: { InlineBinary: '/w8=' },
        PixelData: {
          BulkDataURI:
            'instances/1.3.6.1.4.1.9590.100.1.2.294498401812162035928148179312426786986/frames',
        },
        AvailableTransferSyntaxUID: '1.2.840.10008.1.2.4.80',
        '00090010': 'dedupped',
        '00091010': [
          '0f4205417d9d2658a75f28b85651939a9832e5649ef0475ad19a3d53956ac9a0',
          '602b9c21e612ba224493bcbf1a867bde745371e7b60dd6a149fe6e8d7bba5af9',
          '07583ddd16e12b13e95a3a4a0bdd7b7890a4aad251e94cb91323e5286187b915',
          '4d311847ac3f203f23fd3db59316f3508c904e5d093bab489ca1662f8d67b56b',
        ],
        SeriesInstanceUID: '2.16.124.113543.6004.101.103.20021117.190619.1.001',
        '00091011': 'ce8828ba234b481d0d0c8c62898b6779fdc0c7bac7e9ee691e27806664108522',
        '00091012': 'instance',
        PatientID: 'TG18-2002',
        PatientName: [{ Alphabetic: 'AAPM^Test^Patterns' }],
        PatientBirthDate: '20020704',
        PatientSex: 'O',
        StudyDescription: 'Multi Purpose 1K',
        AccessionNumber: '20022002',
        StudyInstanceUID: '2.16.124.113543.6004.101.103.20021117.190619.1',
        StudyDate: '20180724',
        StudyTime: '190619',
        StudyID: '1K-MULTI',
        SeriesDescription: 'TG18-OIQ',
        SeriesNumber: 1,
        Modality: 'OT',
        SeriesDate: '20180724',
        SeriesTime: '140724',
        ReferringPhysicianName: [{ Alphabetic: 'AAPM' }],
        BodyPartExamined: 'NA',
        ProtocolName: 'Display  Quality Test Protocol',
        ImageType: 'ORIGINAL',
        InstanceCreationDate: '20180724',
        SOPClassUID: '1.2.840.10008.5.1.4.1.1.7',
        ConversionType: 'WSD',
        ContentDate: '20180724',
        AcquisitionDate: '20180724',
        DateOfSecondaryCapture: '20180724',
        SecondaryCaptureDeviceManufacturer: 'Duke University Health System',
        SecondaryCaptureDeviceManufacturerModelName: 'MATLAB',
        SamplesPerPixel: 1,
        PhotometricInterpretation: 'MONOCHROME2',
        Rows: 1024,
        Columns: 1280,
        BitsAllocated: 16,
        BitsStored: 16,
        HighBit: 15,
        PixelRepresentation: 0,
        PatientOrientation: null,
        imageId:
          'wadors:https://d14fa38qiwhyfd.cloudfront.net/dicomweb/studies/2.16.124.113543.6004.101.103.20021117.190619.1/series/2.16.124.113543.6004.101.103.20021117.190619.1.001/instances/1.3.6.1.4.1.9590.100.1.2.294498401812162035928148179312426786986/frames/1',
        wadoRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
      },
      {
        _vrMap: {
          SmallestImagePixelValue: 'US|SS',
          LargestImagePixelValue: 'US|SS',
          PixelData: 'OB|OW',
        },
        InstanceCreationTime: '160738',
        InstanceCreatorUID: '2.16.124.113543.6004.101.103',
        SOPInstanceUID: '1.3.6.1.4.1.9590.100.1.2.304484424913537637032577967974004238574',
        AcquisitionTime: '160738',
        ContentTime: '160738',
        AdmittingDiagnosesDescription: 'NA',
        DerivationDescription: 'NA',
        AdditionalPatientHistory:
          'Images from the 2002 AAPM task group report on display performan',
        PatientComments: 'NA',
        TimeOfSecondaryCapture: '160738',
        DigitalImageFormatAcquired: 'Image exported from tShow application',
        InstanceNumber: 1,
        Laterality: 'NA',
        ImagesInAcquisition: 1,
        SmallestImagePixelValue: { InlineBinary: 'AAA=' },
        LargestImagePixelValue: { InlineBinary: '/w8=' },
        PixelData: {
          BulkDataURI:
            'instances/1.3.6.1.4.1.9590.100.1.2.304484424913537637032577967974004238574/frames',
        },
        AvailableTransferSyntaxUID: '1.2.840.10008.1.2.4.80',
        '00090010': 'dedupped',
        '00091010': [
          '0f4205417d9d2658a75f28b85651939a9832e5649ef0475ad19a3d53956ac9a0',
          '602b9c21e612ba224493bcbf1a867bde745371e7b60dd6a149fe6e8d7bba5af9',
          '93df3408efa1dc2e9631eb030a9ac802b0844b3c03606ecc597dcb12e0c6e812',
          '5ae910ca86c68a269dd52aeae2d5faa167bc76b6474c463ebd8757c6a8f3758a',
        ],
        SeriesInstanceUID: '2.16.124.113543.6004.101.103.20021117.190619.1.001',
        '00091011': '988f02f735e0fc7372ff4e7373877689529135e238712ecc664961d0d3f20c27',
        '00091012': 'instance',
        PatientID: 'TG18-2002',
        PatientName: [{ Alphabetic: 'AAPM^Test^Patterns' }],
        PatientBirthDate: '20020704',
        PatientSex: 'O',
        StudyDescription: 'Multi Purpose 1K',
        AccessionNumber: '20022002',
        StudyInstanceUID: '2.16.124.113543.6004.101.103.20021117.190619.1',
        StudyDate: '20180724',
        StudyTime: '190619',
        StudyID: '1K-MULTI',
        SeriesDescription: 'TG18-OIQ',
        SeriesNumber: 1,
        Modality: 'OT',
        SeriesDate: '20180724',
        SeriesTime: '160738',
        ReferringPhysicianName: [{ Alphabetic: 'AAPM' }],
        BodyPartExamined: 'NA',
        ProtocolName: 'Display  Quality Test Protocol',
        ImageType: 'ORIGINAL',
        InstanceCreationDate: '20180724',
        SOPClassUID: '1.2.840.10008.5.1.4.1.1.7',
        ConversionType: 'WSD',
        ContentDate: '20180724',
        AcquisitionDate: '20180724',
        DateOfSecondaryCapture: '20180724',
        SecondaryCaptureDeviceManufacturer: 'Duke University Health System',
        SecondaryCaptureDeviceManufacturerModelName: 'MATLAB',
        SamplesPerPixel: 1,
        PhotometricInterpretation: 'MONOCHROME2',
        Rows: 1280,
        Columns: 1024,
        BitsAllocated: 16,
        BitsStored: 16,
        HighBit: 15,
        PixelRepresentation: 0,
        PatientOrientation: null,
        imageId:
          'wadors:https://d14fa38qiwhyfd.cloudfront.net/dicomweb/studies/2.16.124.113543.6004.101.103.20021117.190619.1/series/2.16.124.113543.6004.101.103.20021117.190619.1.001/instances/1.3.6.1.4.1.9590.100.1.2.304484424913537637032577967974004238574/frames/1',
        wadoRoot: 'https://d14fa38qiwhyfd.cloudfront.net/dicomweb',
      },
    ],
  },
};
export const qidoInstanceMetadata = [
  {
    '00080018': {
      Value: ['1.3.6.1.4.1.9590.100.1.2.346385697213345623712464894863342033573'],
    },
    '00200013': {
      vr: 'IS',
      Value: [1],
    },
    '0020000E': {
      Value: ['2.16.124.113543.6004.101.103.20021117.190619.1.001'],
    },
    '0020000D': {
      vr: 'UI',
      Value: ['2.16.124.113543.6004.101.103.20021117.190619.1'],
    },
    '00080023': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080033': {
      vr: 'TM',
      Value: ['110724'],
    },
    '00080022': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080032': {
      vr: 'TM',
      Value: ['110724'],
    },
    '00280002': {
      vr: 'US',
      Value: [1],
    },
    '00280004': {
      vr: 'CS',
      Value: ['MONOCHROME2'],
    },
    '00280010': {
      vr: 'US',
      Value: [1024],
    },
    '00280011': {
      vr: 'US',
      Value: [1024],
    },
    '00280100': {
      vr: 'US',
      Value: [16],
    },
    '00280101': {
      vr: 'US',
      Value: [16],
    },
    '00280102': {
      vr: 'US',
      Value: [15],
    },
    '00280103': {
      vr: 'US',
      Value: [0],
    },
    '00080013': {
      vr: 'TM',
      Value: ['110724'],
    },
    '00090010': {
      Value: ['dedupped'],
      vr: 'CS',
    },
    '00091011': {
      Value: ['e3d8e23130c980066d92cd54f24ffe9999ec0bfee40b96a6e15cc364f58e0e37'],
    },
    '00091012': {
      Value: ['instance'],
    },
  },
  {
    '00080018': {
      Value: ['1.3.6.1.4.1.9590.100.1.2.294498401812162035928148179312426786986'],
    },
    '00200013': {
      vr: 'IS',
      Value: [1],
    },
    '0020000E': {
      Value: ['2.16.124.113543.6004.101.103.20021117.190619.1.001'],
    },
    '0020000D': {
      vr: 'UI',
      Value: ['2.16.124.113543.6004.101.103.20021117.190619.1'],
    },
    '00080023': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080033': {
      vr: 'TM',
      Value: ['140724'],
    },
    '00080022': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080032': {
      vr: 'TM',
      Value: ['140724'],
    },
    '00280002': {
      vr: 'US',
      Value: [1],
    },
    '00280004': {
      vr: 'CS',
      Value: ['MONOCHROME2'],
    },
    '00280010': {
      vr: 'US',
      Value: [1024],
    },
    '00280011': {
      vr: 'US',
      Value: [1280],
    },
    '00280100': {
      vr: 'US',
      Value: [16],
    },
    '00280101': {
      vr: 'US',
      Value: [16],
    },
    '00280102': {
      vr: 'US',
      Value: [15],
    },
    '00280103': {
      vr: 'US',
      Value: [0],
    },
    '00080013': {
      vr: 'TM',
      Value: ['140724'],
    },
    '00090010': {
      Value: ['dedupped'],
      vr: 'CS',
    },
    '00091011': {
      Value: ['40b4277bb9588f7a4406f29b9f9046794b6730f35346cc9cdc1b69e98373f61c'],
    },
    '00091012': {
      Value: ['instance'],
    },
  },
  {
    '00080018': {
      Value: ['1.3.6.1.4.1.9590.100.1.2.304484424913537637032577967974004238574'],
    },
    '00200013': {
      vr: 'IS',
      Value: [1],
    },
    '0020000E': {
      Value: ['2.16.124.113543.6004.101.103.20021117.190619.1.001'],
    },
    '0020000D': {
      vr: 'UI',
      Value: ['2.16.124.113543.6004.101.103.20021117.190619.1'],
    },
    '00080023': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080033': {
      vr: 'TM',
      Value: ['160738'],
    },
    '00080022': {
      vr: 'DA',
      Value: ['20180724'],
    },
    '00080032': {
      vr: 'TM',
      Value: ['160738'],
    },
    '00280002': {
      vr: 'US',
      Value: [1],
    },
    '00280004': {
      vr: 'CS',
      Value: ['MONOCHROME2'],
    },
    '00280010': {
      vr: 'US',
      Value: [1280],
    },
    '00280011': {
      vr: 'US',
      Value: [1024],
    },
    '00280100': {
      vr: 'US',
      Value: [16],
    },
    '00280101': {
      vr: 'US',
      Value: [16],
    },
    '00280102': {
      vr: 'US',
      Value: [15],
    },
    '00280103': {
      vr: 'US',
      Value: [0],
    },
    '00080013': {
      vr: 'TM',
      Value: ['160738'],
    },
    '00090010': {
      Value: ['dedupped'],
      vr: 'CS',
    },
    '00091011': {
      Value: ['8ba1bb7cbda839482ad9ae517abcfc9cb5d11a8045d69a1069d784c90cf97434'],
    },
    '00091012': {
      Value: ['instance'],
    },
  },
];
export const naturalizedQidoInstances = dicomWebToDicomStructure(qidoInstanceMetadata);
export const expectedInstanceMetadata = [
  {
    _vrMap: {
      SmallestImagePixelValue: 'US|SS',
      LargestImagePixelValue: 'US|SS',
      PixelData: 'OB|OW',
    },
    InstanceCreationTime: '110724',
    InstanceCreatorUID: '2.16.124.113543.6004.101.103',
    AcquisitionTime: '110724',
    ContentTime: '110724',
    AdmittingDiagnosesDescription: 'NA',
    DerivationDescription: 'NA',
    AdditionalPatientHistory: 'Images from the 2002 AAPM task group report on display performan',
    PatientComments: 'NA',
    TimeOfSecondaryCapture: '110724',
    DigitalImageFormatAcquired: 'Image exported from tShow application',
    InstanceNumber: 0,
    Laterality: 'NA',
    ImagesInAcquisition: 1,
    SmallestImagePixelValue: { InlineBinary: 'AAA=' },
    LargestImagePixelValue: { InlineBinary: '/w8=' },
    PixelData: {
      BulkDataURI:
        'instances/1.3.6.1.4.1.9590.100.1.2.346385697213345623712464894863342033573/frames',
    },
    AvailableTransferSyntaxUID: '1.2.840.10008.1.2.4.80',
    '00090010': 'dedupped',
    '00091010': [
      '0f4205417d9d2658a75f28b85651939a9832e5649ef0475ad19a3d53956ac9a0',
      '602b9c21e612ba224493bcbf1a867bde745371e7b60dd6a149fe6e8d7bba5af9',
      'dc77149ddb654f34e3fe66cb443495acb2b60fbc18ded168e31e0fc64147eeb9',
      '36bf58abfb35d6a35cdf7f077d92d80980703c13e590e2074819c95428eac7cb',
    ],
    '00091011': '28b44927e9e3ec0003e5183bcb817c6ada9a84085b0e8ced4550a4c6be6cbaed',
    '00091012': 'instance',
    PatientID: 'TG18-2002',
    PatientName: [{ Alphabetic: 'AAPM^Test^Patterns' }],
    PatientBirthDate: '20020704',
    PatientSex: 'O',
    StudyDescription: 'Multi Purpose 1K',
    AccessionNumber: '20022002',
    StudyDate: '20180724',
    StudyTime: '190619',
    StudyID: '1K-MULTI',
    SeriesDescription: 'TG18-OIQ',
    SeriesNumber: 1,
    Modality: 'OT',
    SeriesDate: '20180724',
    SeriesTime: '110724',
    ReferringPhysicianName: [{ Alphabetic: 'AAPM' }],
    BodyPartExamined: 'NA',
    ProtocolName: 'Display  Quality Test Protocol',
    ImageType: 'ORIGINAL',
    InstanceCreationDate: '20180724',
    ConversionType: 'WSD',
    ContentDate: '20180724',
    AcquisitionDate: '20180724',
    DateOfSecondaryCapture: '20180724',
    SecondaryCaptureDeviceManufacturer: 'Duke University Health System',
    SecondaryCaptureDeviceManufacturerModelName: 'MATLAB',
    SamplesPerPixel: 1,
    PhotometricInterpretation: 'MONOCHROME2',
    BitsStored: 16,
    HighBit: 15,
    PixelRepresentation: 0,
    PatientOrientation: null,
  },
  {
    _vrMap: {
      SmallestImagePixelValue: 'US|SS',
      LargestImagePixelValue: 'US|SS',
      PixelData: 'OB|OW',
    },
    InstanceCreationTime: '110724',
    InstanceCreatorUID: '2.16.124.113543.6004.101.103',
    AcquisitionTime: '110724',
    ContentTime: '110724',
    AdmittingDiagnosesDescription: 'NA',
    DerivationDescription: 'NA',
    AdditionalPatientHistory: 'Images from the 2002 AAPM task group report on display performan',
    PatientComments: 'NA',
    TimeOfSecondaryCapture: '110724',
    DigitalImageFormatAcquired: 'Image exported from tShow application',
    InstanceNumber: 1,
    Laterality: 'NA',
    ImagesInAcquisition: 1,
    SmallestImagePixelValue: { InlineBinary: 'AAA=' },
    LargestImagePixelValue: { InlineBinary: '/w8=' },
    PixelData: {
      BulkDataURI:
        'instances/1.3.6.1.4.1.9590.100.1.2.346385697213345623712464894863342033573/frames',
    },
    AvailableTransferSyntaxUID: '1.2.840.10008.1.2.4.80',
    '00090010': 'dedupped',
    '00091010': [
      '0f4205417d9d2658a75f28b85651939a9832e5649ef0475ad19a3d53956ac9a0',
      '602b9c21e612ba224493bcbf1a867bde745371e7b60dd6a149fe6e8d7bba5af9',
      'dc77149ddb654f34e3fe66cb443495acb2b60fbc18ded168e31e0fc64147eeb9',
      '36bf58abfb35d6a35cdf7f077d92d80980703c13e590e2074819c95428eac7cb',
    ],
    '00091011': '28b44927e9e3ec0003e5183bcb817c6ada9a84085b0e8ced4550a4c6be6cbaed',
    '00091012': 'instance',
    PatientID: 'TG18-2002',
    PatientName: [{ Alphabetic: 'AAPM^Test^Patterns' }],
    PatientBirthDate: '20020704',
    PatientSex: 'O',
    StudyDescription: 'Multi Purpose 1K',
    AccessionNumber: '20022002',
    StudyDate: '20180724',
    StudyTime: '190619',
    StudyID: '1K-MULTI',
    SeriesDescription: 'TG18-OIQ',
    SeriesNumber: 1,
    Modality: 'OT',
    SeriesDate: '20180724',
    SeriesTime: '110724',
    ReferringPhysicianName: [{ Alphabetic: 'AAPM' }],
    BodyPartExamined: 'NA',
    ProtocolName: 'Display  Quality Test Protocol',
    ImageType: 'ORIGINAL',
    InstanceCreationDate: '20180724',
    ConversionType: 'WSD',
    ContentDate: '20180724',
    AcquisitionDate: '20180724',
    DateOfSecondaryCapture: '20180724',
    SecondaryCaptureDeviceManufacturer: 'Duke University Health System',
    SecondaryCaptureDeviceManufacturerModelName: 'MATLAB',
    SamplesPerPixel: 1,
    PhotometricInterpretation: 'MONOCHROME2',
    BitsStored: 16,
    HighBit: 15,
    PixelRepresentation: 0,
    PatientOrientation: null,
  },
];

describe('DicomWebDataSource Test Data', () => {
  test('should be able to initialize client', () => {
    expect(() => {
      console.log(client);
    });
  });

  test('should have naturalized instances', () => {
    expect(() => {
      console.log(naturalizedInstances);
    });
  });
});
