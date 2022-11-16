import sortInstances from './sortInstancesByPosition';

describe('sortInstances', () => {
  it('should sort instances based on their imagePositionPatient', () => {
    const instances = [
      {
        ImagePositionPatient: [0, 0, 2],
        ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
      },
      {
        ImagePositionPatient: [0, 0, 1],
        ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
      },
      {
        ImagePositionPatient: [0, 0, 0],
        ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
      },
    ];

    const sortedInstances = sortInstances(instances);

    expect(sortedInstances).toEqual([
      {
        ImagePositionPatient: [0, 0, 0],
        ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
      },
      {
        ImagePositionPatient: [0, 0, 1],
        ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
      },
      {
        ImagePositionPatient: [0, 0, 2],
        ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
      },
    ]);
  });

  it('should return the same instances if there is only one instance', () => {
    const instances = [
      {
        ImagePositionPatient: [0, 0, 0],
      },
    ];

    const sortedInstances = sortInstances(instances);

    expect(sortedInstances).toEqual([
      {
        ImagePositionPatient: [0, 0, 0],
      },
    ]);
  });

  it('should return the same instances if there are no instances', () => {
    const instances = [];

    const sortedInstances = sortInstances(instances);

    expect(sortedInstances).toEqual([]);
  });
});
