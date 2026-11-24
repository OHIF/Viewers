import constructSR from './constructSR';

describe('constructSR', () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it('names OHIF and dcmjs as the writer of the SR', () => {
    process.env.VERSION_NUMBER = '3.14.0';
    process.env.DCMJS_VERSION = '0.52.0';
    const metadata = {
      StudyInstanceUID: '1.2.3',
      SeriesInstanceUID: '1.2.3.4',
      SOPInstanceUID: '1.2.3.4.5',
      SOPClassUID: '1.2.840.10008.5.1.4.1.1.77.1.6',
      FrameOfReferenceUID: '1.2.3.6',
      SpecimenDescriptionSequence: { SpecimenUID: '1.2.3.7', SpecimenIdentifier: 'S1' },
    };

    const dataset = constructSR(metadata, { SeriesDescription: 'SR', SeriesNumber: 1 }, []);

    expect(dataset).toMatchObject({
      Manufacturer: 'OHIF',
      ManufacturerModelName: 'dcmjs',
      SoftwareVersions: ['OHIF 3.14.0', 'dcmjs 0.52.0'],
    });
  });
});
