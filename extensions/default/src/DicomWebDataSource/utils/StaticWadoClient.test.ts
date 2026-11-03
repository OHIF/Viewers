import StaticWadoClient from './StaticWadoClient';

describe('StaticWadoClient', () => {
  const client = Object.create(StaticWadoClient.prototype) as StaticWadoClient;
  (client as any).config = {};

  describe('compareValues', () => {
    it('matches wildcard string filters case-insensitively', () => {
      expect(client.compareValues('*brain*', 'BRAIN WO CONTRAST', {})).toBe(true);
      expect(client.compareValues('abc*', 'ABC123', {})).toBe(true);
      expect(client.compareValues('*xyz', 'ABCXYZ', {})).toBe(true);
    });

    it('matches exact string filters case-insensitively', () => {
      expect(client.compareValues('mrn123', 'MRN123', {})).toBe(true);
      expect(client.compareValues('acc-42', 'ACC-42', {})).toBe(true);
    });
  });

  describe('filterItem', () => {
    it('matches study text filters case-insensitively', () => {
      const study = {
        '00100020': { Value: ['MRN123'] },
        '00081030': { Value: ['BRAIN WO CONTRAST'] },
        '00080050': { Value: ['ACC-42'] },
      };

      expect(
        client.filterItem(
          '00100020',
          { '00100020': '*mrn123*' },
          study,
          StaticWadoClient.studyFilterKeys
        )
      ).toBeTruthy();
      expect(
        client.filterItem(
          'studydescription',
          { studydescription: '*brain*' },
          study,
          StaticWadoClient.studyFilterKeys
        )
      ).toBeTruthy();
      expect(
        client.filterItem(
          'accessionnumber',
          { accessionnumber: '*acc-42*' },
          study,
          StaticWadoClient.studyFilterKeys
        )
      ).toBeTruthy();
    });
  });
});
