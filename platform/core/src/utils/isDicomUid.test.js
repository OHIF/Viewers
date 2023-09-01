import isDicomUid from './isDicomUid';

describe('isDicomUid', function () {
  it('should return true for valid DICOM UIDs', function () {
    expect(isDicomUid('1')).toBe(true);
    expect(isDicomUid('1.2')).toBe(true);
    expect(isDicomUid('1.2.3')).toBe(true);
    expect(isDicomUid('1.2.3.4')).toBe(true);
  });
  it('should return false for invalid DICOM UIDs', function () {
    expect(isDicomUid('x')).toBe(false);
    expect(isDicomUid('1.')).toBe(false);
    expect(isDicomUid('1. 2')).toBe(false);
    expect(isDicomUid('1.2.n.4')).toBe(false);
  });
});
