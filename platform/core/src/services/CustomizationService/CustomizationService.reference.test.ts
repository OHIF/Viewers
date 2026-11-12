import CustomizationService, { CustomizationScope } from './CustomizationService';

/**
 * Tests for the `$reference` read-time resolution marker: composing
 * customizations by name, flattening pack lists, and — crucially — replacing a
 * reference wholesale with a subsequent `$set` (another reference or a
 * hard-coded value).
 */
describe('CustomizationService $reference', () => {
  let service: CustomizationService;

  beforeEach(() => {
    service = new CustomizationService({ configuration: {}, commandsManager: {} } as any);
    // Capability packs registered at Default scope (as an extension would).
    service.setCustomizations(
      {
        'cornerstone.toolbarButtons': [{ id: 'Length' }, { id: 'Pan' }],
        'cornerstone.segTools': [{ id: 'Brush' }, { id: 'Eraser' }],
        'other.toolbarButtons': [{ id: 'Zoom' }],
        // Object-valued pack (a tool block), used to test references as an
        // array item that resolves to a non-array (kept, not flattened).
        'cornerstone.annotationBlock': { passive: [{ toolName: 'Length' }] },
      },
      CustomizationScope.Default
    );
  });

  it('flattens a referenced array into the surrounding list', () => {
    service.setCustomizations(
      { toolbarButtons: [{ $reference: 'cornerstone.toolbarButtons' }] },
      CustomizationScope.Mode
    );
    expect(service.getCustomization('toolbarButtons')).toEqual([{ id: 'Length' }, { id: 'Pan' }]);
  });

  it('composes multiple packs and mixes in literals', () => {
    service.setCustomizations(
      {
        toolbarButtons: [
          { $reference: 'cornerstone.toolbarButtons' },
          { id: 'Custom' },
          { $reference: 'other.toolbarButtons' },
        ],
      },
      CustomizationScope.Mode
    );
    expect(service.getCustomization('toolbarButtons')).toEqual([
      { id: 'Length' },
      { id: 'Pan' },
      { id: 'Custom' },
      { id: 'Zoom' },
    ]);
  });

  it('resolves references inside object property values (toolGroupAdditions map)', () => {
    service.setCustomizations(
      {
        toolGroupAdditions: {
          default: [{ $reference: 'cornerstone.annotationBlock' }],
          mpr: [],
        },
      },
      CustomizationScope.Mode
    );
    expect(service.getCustomization('toolGroupAdditions')).toEqual({
      default: [{ passive: [{ toolName: 'Length' }] }],
      mpr: [],
    });
  });

  it('$push adds another reference that resolves and flattens', () => {
    service.setCustomizations(
      { toolbarButtons: [{ $reference: 'cornerstone.toolbarButtons' }] },
      CustomizationScope.Mode
    );
    service.setCustomizations(
      { toolbarButtons: { $push: [{ $reference: 'cornerstone.segTools' }] } },
      CustomizationScope.Mode
    );
    expect(service.getCustomization('toolbarButtons')).toEqual([
      { id: 'Length' },
      { id: 'Pan' },
      { id: 'Brush' },
      { id: 'Eraser' },
    ]);
  });

  it('$set replaces a reference with a DIFFERENT reference', () => {
    service.setCustomizations(
      { toolbarButtons: [{ $reference: 'cornerstone.toolbarButtons' }] },
      CustomizationScope.Mode
    );
    service.setCustomizations(
      { toolbarButtons: { $set: [{ $reference: 'other.toolbarButtons' }] } },
      CustomizationScope.Mode
    );
    expect(service.getCustomization('toolbarButtons')).toEqual([{ id: 'Zoom' }]);
  });

  it('$set replaces a reference with a HARD-CODED list', () => {
    service.setCustomizations(
      { toolbarButtons: [{ $reference: 'cornerstone.toolbarButtons' }] },
      CustomizationScope.Mode
    );
    service.setCustomizations(
      { toolbarButtons: { $set: [{ id: 'OnlyThis' }] } },
      CustomizationScope.Mode
    );
    expect(service.getCustomization('toolbarButtons')).toEqual([{ id: 'OnlyThis' }]);
  });

  it('a global-scope $set overrides a mode reference by scope precedence', () => {
    service.setCustomizations(
      { toolbarButtons: [{ $reference: 'cornerstone.toolbarButtons' }] },
      CustomizationScope.Mode
    );
    service.setCustomizations(
      { toolbarButtons: { $set: [{ $reference: 'other.toolbarButtons' }] } },
      CustomizationScope.Global
    );
    expect(service.getCustomization('toolbarButtons')).toEqual([{ id: 'Zoom' }]);
  });

  it('picks up live edits to the referenced pack', () => {
    service.setCustomizations(
      { toolbarButtons: [{ $reference: 'cornerstone.toolbarButtons' }] },
      CustomizationScope.Mode
    );
    expect(service.getCustomization('toolbarButtons')).toHaveLength(2);
    // Extend the pack itself; the referencing value reflects it on next read.
    service.setCustomizations(
      { 'cornerstone.toolbarButtons': { $push: [{ id: 'Added' }] } },
      CustomizationScope.Global
    );
    expect(service.getCustomization('toolbarButtons')).toEqual([
      { id: 'Length' },
      { id: 'Pan' },
      { id: 'Added' },
    ]);
  });

  it('resolves a whole-value reference (alias) and chains references', () => {
    service.setCustomizations(
      {
        'alias.buttons': { $reference: 'cornerstone.toolbarButtons' },
        toolbarButtons: [{ $reference: 'alias.buttons' }],
      },
      CustomizationScope.Mode
    );
    expect(service.getCustomization('alias.buttons')).toEqual([{ id: 'Length' }, { id: 'Pan' }]);
    expect(service.getCustomization('toolbarButtons')).toEqual([{ id: 'Length' }, { id: 'Pan' }]);
  });

  it('breaks reference cycles instead of looping', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    service.setCustomizations(
      {
        cycleA: [{ $reference: 'cycleB' }],
        cycleB: [{ $reference: 'cycleA' }],
      },
      CustomizationScope.Mode
    );
    // Should return without throwing; the cyclic branch resolves to nothing.
    expect(() => service.getCustomization('cycleA')).not.toThrow();
    expect(service.getCustomization('cycleA')).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns and drops a reference to an unregistered customization', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    service.setCustomizations(
      { toolbarButtons: [{ $reference: 'does.not.exist' }, { id: 'Kept' }] },
      CustomizationScope.Mode
    );
    expect(service.getCustomization('toolbarButtons')).toEqual([{ id: 'Kept' }]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
