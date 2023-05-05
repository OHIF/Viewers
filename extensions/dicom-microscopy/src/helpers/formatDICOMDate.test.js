import formatDICOMDate from './formatDICOMDate';

describe('formatDICOMDate', () => {
  it('should format DICOM date string', () => {
    const date = '20180916';
    const formattedDate = formatDICOMDate(date);
    expect(formattedDate).toEqual('Sep 16, 2018');
  });
});
