import CornerstoneViewportService from './CornerstoneViewportService';

const VIEWPORT_ID = 'viewport-1';

/**
 * Exercises the private mount-completion path via the prototype: a mount whose
 * captured compositionRevision no longer matches the current one has been
 * superseded by a newer setViewportData and must neither report mounted (the
 * store would accept it at the CURRENT revision) nor rebind the runtime
 * channel over the newer mount's binding.
 */
function makeServiceContext({ currentRevision = 5 } = {}) {
  const viewportGridService = {
    getViewportComposition: jest.fn(() => ({
      viewportId: VIEWPORT_ID,
      compositionRevision: currentRevision,
    })),
    reportPhase: jest.fn(),
  };
  const runtimeManager = { bind: jest.fn() };
  return {
    context: {
      servicesManager: { services: { viewportGridService } },
      // Shadows the class getter (the context is a plain object, not an
      // instance), so no rendering engine is constructed.
      runtimeManager,
      // Borrowed sibling method _reportMountedAndBindRuntime dispatches via this.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _getCurrentCompositionRevision: (CornerstoneViewportService.prototype as any)
        ._getCurrentCompositionRevision,
    },
    viewportGridService,
    runtimeManager,
  };
}

const callReportMountedAndBindRuntime = (context: unknown, mountRevision?: number) =>
  // Private in TS only; runtime dispatch through the prototype is intentional.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (CornerstoneViewportService.prototype as any)._reportMountedAndBindRuntime.call(
    context,
    VIEWPORT_ID,
    mountRevision
  );

describe('CornerstoneViewportService mount supersession', () => {
  it('reports mounted and binds when the mount revision is still current', () => {
    const { context, viewportGridService, runtimeManager } = makeServiceContext({
      currentRevision: 5,
    });

    callReportMountedAndBindRuntime(context, 5);

    expect(viewportGridService.reportPhase).toHaveBeenCalledWith(VIEWPORT_ID, 'mounted', 5);
    expect(runtimeManager.bind).toHaveBeenCalledWith(VIEWPORT_ID);
  });

  it('skips reporting and binding when a newer mount superseded this one', () => {
    const { context, viewportGridService, runtimeManager } = makeServiceContext({
      currentRevision: 6,
    });

    // Captured at mount start, before the interleaved setViewportData bumped
    // the composition to revision 6.
    callReportMountedAndBindRuntime(context, 5);

    expect(viewportGridService.reportPhase).not.toHaveBeenCalled();
    expect(runtimeManager.bind).not.toHaveBeenCalled();
  });

  it('stays unguarded when no mount revision was captured (grid predates compositions)', () => {
    const { context, viewportGridService, runtimeManager } = makeServiceContext({
      currentRevision: 6,
    });

    callReportMountedAndBindRuntime(context, undefined);

    expect(viewportGridService.reportPhase).toHaveBeenCalledWith(VIEWPORT_ID, 'mounted', 6);
    expect(runtimeManager.bind).toHaveBeenCalledWith(VIEWPORT_ID);
  });
});
