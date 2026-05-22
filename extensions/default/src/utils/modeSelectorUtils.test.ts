import {
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
});
