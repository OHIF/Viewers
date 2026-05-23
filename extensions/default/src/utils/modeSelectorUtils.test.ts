import {
  buildModeSwitchHref,
  buildModeSwitchSearch,
  hasUsableModalities,
  modalitiesStringFromSet,
  normalizeModalitiesString,
  resolveStudyModalities,
} from './modeSelectorUtils';

jest.mock('@ohif/core', () => ({
  DicomMetadataStore: {
    getStudy: jest.fn(),
  },
  utils: {
    formatPN: jest.fn(),
  },
}));

jest.mock('@ohif/app', () => ({
  preserveQueryParameters: jest.fn(),
}));

const { DicomMetadataStore } = jest.requireMock('@ohif/core');

describe('modeSelectorUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    DicomMetadataStore.getStudy.mockReturnValue(null);
  });

  describe('hasUsableModalities', () => {
    it('returns false for empty or whitespace-only modalities', () => {
      expect(hasUsableModalities()).toBe(false);
      expect(hasUsableModalities('')).toBe(false);
      expect(hasUsableModalities('   ')).toBe(false);
    });

    it('returns true when at least one modality is present', () => {
      expect(hasUsableModalities('CT/PT')).toBe(true);
      expect(hasUsableModalities('CT\\PT')).toBe(true);
    });
  });

  describe('modalitiesStringFromSet', () => {
    it('sorts and normalizes modality separators', () => {
      expect(modalitiesStringFromSet(new Set(['PT', 'CT', 'SEG']))).toBe('CT\\PT\\SEG');
    });
  });

  describe('resolveStudyModalities', () => {
    it('uses QIDO study modalities when present', async () => {
      const result = await resolveStudyModalities('1.2.3', null, 'PT\\CT');
      expect(result).toBe('PT\\CT');
    });

    it('falls back to series search when study modalities are missing', async () => {
      const dataSource = {
        query: {
          series: {
            search: jest.fn().mockResolvedValue([
              { modality: 'PT' },
              { modality: 'CT' },
              { modality: 'SEG' },
            ]),
          },
        },
      };

      const result = await resolveStudyModalities('1.2.3', dataSource, '');

      expect(result).toBe('CT\\PT\\SEG');
      expect(dataSource.query.series.search).toHaveBeenCalledWith('1.2.3');
    });

    it('prefers loaded metadata over series search when study modalities are missing', async () => {
      DicomMetadataStore.getStudy.mockReturnValue({
        series: [
          {
            instances: [{ Modality: 'CT' }],
          },
          {
            instances: [{ Modality: 'PT' }],
          },
        ],
      });

      const dataSource = {
        query: {
          series: {
            search: jest.fn(),
          },
        },
      };

      const result = await resolveStudyModalities('1.2.3', dataSource, '');

      expect(result).toBe('CT\\PT');
      expect(dataSource.query.series.search).not.toHaveBeenCalled();
    });
  });

  describe('normalizeModalitiesString', () => {
    it('replaces slash separators with backslashes', () => {
      expect(normalizeModalitiesString('CT/PT')).toBe('CT\\PT');
    });
  });

  describe('buildModeSwitchSearch', () => {
    it('adds StudyInstanceUIDs when only present in the path', () => {
      const search = buildModeSwitchSearch('', '1.2.3');

      expect(search).toBe('?StudyInstanceUIDs=1.2.3');
    });

    it('keeps existing query params and StudyInstanceUIDs', () => {
      const search = buildModeSwitchSearch('?configUrl=test.json', ['1.2.3', '4.5.6']);

      expect(search).toContain('StudyInstanceUIDs=1.2.3');
      expect(search).toContain('StudyInstanceUIDs=4.5.6');
      expect(search).toContain('configUrl=test.json');
    });

    it('removes listed query params when stripQueryParams is set', () => {
      const search = buildModeSwitchSearch(
        '?foo=bar&baz=1&StudyInstanceUIDs=1.2.3',
        '1.2.3',
        { stripQueryParams: ['foo', 'baz'] }
      );

      expect(search).not.toContain('foo=');
      expect(search).not.toContain('baz=');
      expect(search).toContain('StudyInstanceUIDs=1.2.3');
    });
  });

  describe('buildModeSwitchHref', () => {
    it('builds a standard mode URL with datasources query param and study UID', () => {
      const href = buildModeSwitchHref('segmentation', '?legacy=foo', '1.2.3', {
        stripQueryParams: ['legacy'],
        dataSourceName: 'idc-dicomweb',
      });

      expect(href).toBe('/segmentation?datasources=idc-dicomweb&StudyInstanceUIDs=1.2.3');
    });
  });
});
