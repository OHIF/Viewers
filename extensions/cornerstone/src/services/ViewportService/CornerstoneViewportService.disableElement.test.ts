import CornerstoneViewportService from './CornerstoneViewportService';

const VIEWPORT_ID = 'viewport-1';

/**
 * Exercises disableElement via the prototype on a plain-object context (same
 * pattern as the supersession test): own properties shadow the class getters,
 * so no rendering engine or backend is constructed.
 */
function makeDisableContext({
  mountController = { detachElement: jest.fn() } as { detachElement: jest.Mock } | null,
} = {}) {
  return {
    context: {
      _mountController: mountController,
      _runtimeManager: { release: jest.fn() },
      backend: { onViewportDisabled: jest.fn() },
      renderingEngine: { disableElement: jest.fn() },
      viewportsById: new Map([[VIEWPORT_ID, {}]]),
      viewportsDisplaySets: new Map([[VIEWPORT_ID, ['ds-1']]]),
    },
    mountController,
  };
}

const callDisableElement = (context: unknown) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (CornerstoneViewportService.prototype as any).disableElement.call(context, VIEWPORT_ID);

describe('CornerstoneViewportService disableElement', () => {
  it('detaches the mount-controller registration so direct callers cannot leave a stale element', () => {
    const { context, mountController } = makeDisableContext();

    callDisableElement(context);

    expect(mountController.detachElement).toHaveBeenCalledWith(VIEWPORT_ID);
    expect(context._runtimeManager.release).toHaveBeenCalledWith(VIEWPORT_ID);
    expect(context.backend.onViewportDisabled).toHaveBeenCalledWith(VIEWPORT_ID);
    expect(context.viewportsById.has(VIEWPORT_ID)).toBe(false);
    expect(context.viewportsDisplaySets.has(VIEWPORT_ID)).toBe(false);
  });

  it('tolerates a not-yet-created mount controller without lazily creating one', () => {
    const { context } = makeDisableContext({ mountController: null });

    expect(() => callDisableElement(context)).not.toThrow();
    // Still null: teardown must not construct a controller via the getter.
    expect(context._mountController).toBeNull();
  });
});
