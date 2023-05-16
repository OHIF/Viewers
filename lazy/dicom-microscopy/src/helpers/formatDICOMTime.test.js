import formatDICOMTime from './formatDICOMTime';

describe('formatDICOMTime', () => {
  it('should format DICOM time string', () => {
    const time = '101300.000';
    const formattedTime = formatDICOMTime(time);
    expect(formattedTime).toEqual('10:13:00');
  });
});
