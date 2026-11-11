import { renderHook } from '@testing-library/react';

import {
  fetchStudyEnvelope,
  hasUsableModalities,
  modalitiesStringFromSet,
  normalizeModalitiesString,
  resolveStudyModalities,
  usePreservedViewerSearch,
} from './modeSelectorUtils';

jest.mock('@ohif/core', () => ({
  DicomMetadataStore: {
    getStudy: jest.fn(),
  },
  utils: {
    formatPN: jest.fn(name => `${name}`),
  },
}));

jest.mock('@ohif/app', () => ({
  preserveQueryParameters: jest.requireActual(
    '../../../../platform/app/src/utils/preserveQueryParameters'
  ).preserveQueryParameters,
}));

const { DicomMetadataStore } = jest.requireMock('@ohif/core');

/** Builds a data source whose study search returns `studyRow` and series search returns `seriesRows`. */
function makeDataSource(
  studyRow: Record<string, unknown> | null,
  seriesRows: { modality?: string }[]
) {
  return {
    query: {
      studies: {
        search: jest.fn().mockResolvedValue(studyRow ? [studyRow] : []),
      },
      series: {
        search: jest.fn().mockResolvedValue(seriesRows),
      },
    },
  };
}

/** Study as stored in `DicomMetadataStore`, one instance per listed modality. */
function loadedStudy(modalities: string[]) {
  return {
    series: modalities.map(Modality => ({
      instances: [{ Modality, PatientID: 'P1', StudyDescription: 'Desc' }],
    })),
  };
}

/** Renders the hook and returns its value. */
function preservedSearch(...args: Parameters<typeof usePreservedViewerSearch>): string {
  return renderHook(() => usePreservedViewerSearch(...args)).result.current;
}

describe('modeSelectorUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    DicomMetadataStore.getStudy.mockReturnValue(null);
  });

  describe('normalizeModalitiesString', () => {
    it('replaces slash separators with backslashes', () => {
      expect(normalizeModalitiesString('CT/PT')).toBe('CT\\PT');
      expect(normalizeModalitiesString(undefined)).toBe('');
    });
  });

  describe('hasUsableModalities', () => {
    it('returns false for empty or whitespace-only modalities', () => {
      expect(hasUsableModalities()).toBe(false);
      expect(hasUsableModalities('')).toBe(false);
      expect(hasUsableModalities('   ')).toBe(false);
      expect(hasUsableModalities('\\')).toBe(false);
    });

    it('returns true when at least one modality is present', () => {
      expect(hasUsableModalities('CT/PT')).toBe(true);
      expect(hasUsableModalities('CT\\PT')).toBe(true);
    });
  });

  describe('modalitiesStringFromSet', () => {
    it('sorts and normalizes modality separators', () => {
      expect(modalitiesStringFromSet(new Set(['PT', 'CT', 'SEG']))).toBe('CT\\PT\\SEG');
      expect(modalitiesStringFromSet(new Set())).toBe('');
    });
  });

  describe('resolveStudyModalities', () => {
    it('uses study-level modalities when present without a series search', async () => {
      const dataSource = makeDataSource(null, [{ modality: 'MR' }]);

      const result = await resolveStudyModalities('1.2.3', dataSource, 'PT/CT');

      expect(result).toBe('PT\\CT');
      expect(dataSource.query.series.search).not.toHaveBeenCalled();
    });

    it('falls back to series search when study modalities are missing', async () => {
      const dataSource = makeDataSource(null, [
        { modality: 'PT' },
        { modality: 'CT' },
        { modality: 'SEG' },
        { modality: '' },
      ]);

      const result = await resolveStudyModalities('1.2.3', dataSource, '');

      expect(result).toBe('CT\\PT\\SEG');
      expect(dataSource.query.series.search).toHaveBeenCalledWith('1.2.3');
    });

    it('merges loaded metadata with series search', async () => {
      DicomMetadataStore.getStudy.mockReturnValue(loadedStudy(['CT', 'PT']));
      const dataSource = makeDataSource(null, [{ modality: 'CT' }, { modality: 'SR' }]);

      const result = await resolveStudyModalities('1.2.3', dataSource, '');

      expect(result).toBe('CT\\PT\\SR');
    });

    it('uses series search when only some series are loaded (lazy study loading)', async () => {
      DicomMetadataStore.getStudy.mockReturnValue(loadedStudy(['SEG']));
      const dataSource = makeDataSource(null, [
        { modality: 'PT' },
        { modality: 'CT' },
        { modality: 'SEG' },
      ]);

      const result = await resolveStudyModalities('1.2.3', dataSource, '');

      expect(result).toBe('CT\\PT\\SEG');
    });

    it('uses loaded metadata when the data source has no series search', async () => {
      DicomMetadataStore.getStudy.mockReturnValue(loadedStudy(['PT', 'CT']));

      const result = await resolveStudyModalities('1.2.3', null, '');

      expect(result).toBe('CT\\PT');
    });

    it('uses loaded metadata when the series search fails', async () => {
      DicomMetadataStore.getStudy.mockReturnValue(loadedStudy(['PT', 'CT']));
      const dataSource = makeDataSource(null, []);
      dataSource.query.series.search.mockRejectedValue(new Error('network'));

      const result = await resolveStudyModalities('1.2.3', dataSource, '');

      expect(result).toBe('CT\\PT');
    });
  });

  describe('fetchStudyEnvelope', () => {
    it('uses study-level modalities from the study search', async () => {
      const dataSource = makeDataSource({ modalities: 'CT/PT', description: 'PET/CT' }, []);

      const envelope = await fetchStudyEnvelope('1.2.3', dataSource);

      expect(envelope).toEqual({
        modalitiesToCheck: 'CT\\PT',
        study: { modalities: 'CT\\PT', description: 'PET/CT' },
      });
      expect(dataSource.query.series.search).not.toHaveBeenCalled();
    });

    it('fills in missing study modalities from loaded and searched series', async () => {
      DicomMetadataStore.getStudy.mockReturnValue(loadedStudy(['SEG']));
      const dataSource = makeDataSource({ modalities: '', description: 'PET/CT' }, [
        { modality: 'PT' },
        { modality: 'CT' },
      ]);

      const envelope = await fetchStudyEnvelope('1.2.3', dataSource);

      expect(envelope).toEqual({
        modalitiesToCheck: 'CT\\PT\\SEG',
        study: { modalities: 'CT\\PT\\SEG', description: 'PET/CT' },
      });
    });

    it('falls back to loaded metadata plus series search when the study search fails', async () => {
      DicomMetadataStore.getStudy.mockReturnValue(loadedStudy(['CT']));
      const dataSource = makeDataSource(null, [{ modality: 'PT' }]);
      dataSource.query.studies.search.mockRejectedValue(new Error('network'));

      const envelope = await fetchStudyEnvelope('1.2.3', dataSource);

      expect(envelope?.modalitiesToCheck).toBe('CT\\PT');
      expect(envelope?.study).toMatchObject({
        StudyInstanceUID: '1.2.3',
        modalities: 'CT\\PT',
        mrn: 'P1',
        description: 'Desc',
        instances: 1,
      });
    });

    it('returns null when nothing is loaded and no source returns modalities', async () => {
      const dataSource = makeDataSource(null, []);

      expect(await fetchStudyEnvelope('1.2.3', dataSource)).toBeNull();
    });
  });

  describe('usePreservedViewerSearch', () => {
    it('keeps preserved params once and leaves other params alone', () => {
      const search = preservedSearch('?StudyInstanceUIDs=1.2.3&configUrl=a.json&theme=dark');
      const params = new URLSearchParams(search);

      expect(params.getAll('configUrl')).toEqual(['a.json']);
      expect(params.getAll('theme')).toEqual(['dark']);
      expect(params.getAll('StudyInstanceUIDs')).toEqual(['1.2.3']);
    });

    it('keeps repeated values of a preserved param without duplicating them', () => {
      const search = preservedSearch('?customization=a&customization=b');

      expect(new URLSearchParams(search).getAll('customization')).toEqual(['a', 'b']);
    });

    it('includes keys added through the customization service', () => {
      const customizationService = {
        getValue: jest.fn().mockReturnValue(['site']),
      };

      const search = preservedSearch(
        '?site=x&other=y',
        customizationService as unknown as Parameters<typeof usePreservedViewerSearch>[1]
      );
      const params = new URLSearchParams(search);

      expect(params.getAll('site')).toEqual(['x']);
      expect(params.getAll('other')).toEqual(['y']);
    });

    it('returns an empty string when there are no params', () => {
      expect(preservedSearch('')).toBe('');
    });
  });
});
