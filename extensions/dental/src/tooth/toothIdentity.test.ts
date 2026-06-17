import {
  DEFAULT_TOOTH_ID,
  TOOTH_IDENTITIES,
  getToothDisplayLabel,
  getToothIdentityByFDI,
  getToothIdentityById,
  getToothIdentityByUniversal,
} from './toothIdentity';

describe('toothIdentity', () => {
  it('maps all permanent teeth', () => {
    expect(TOOTH_IDENTITIES).toHaveLength(32);
    expect(new Set(TOOTH_IDENTITIES.map(tooth => tooth.id)).size).toBe(32);
  });

  it('maps FDI and Universal numbers to the same canonical tooth identity', () => {
    const universalTooth = getToothIdentityByUniversal(30);
    const fdiTooth = getToothIdentityByFDI(46);

    expect(universalTooth).toBeDefined();
    expect(fdiTooth).toBeDefined();
    expect(universalTooth?.id).toBe(fdiTooth?.id);
    expect(universalTooth?.id).toBe('permanent-30');
  });

  it('keeps selected tooth identity stable when display numbering changes', () => {
    const selectedTooth = getToothIdentityById(DEFAULT_TOOTH_ID);

    expect(selectedTooth).toBeDefined();
    expect(getToothDisplayLabel(selectedTooth!, 'Universal')).toBe('Universal 30');
    expect(getToothDisplayLabel(selectedTooth!, 'FDI')).toBe('FDI 46');
    expect(selectedTooth?.id).toBe(DEFAULT_TOOTH_ID);
  });
});
