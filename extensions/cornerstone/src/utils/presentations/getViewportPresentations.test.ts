import { getViewportPresentations } from './getViewportPresentations';
import { useSegmentationPresentationStore } from '../../stores/useSegmentationPresentationStore';
import { usePositionPresentationStore } from '../../stores/usePositionPresentationStore';
import { useLutPresentationStore } from '../../stores/useLutPresentationStore';

const displaySets = {
  'volume-1': {
    displaySetInstanceUID: 'volume-1',
    FrameOfReferenceUID: 'for-1',
    isReconstructable: true,
  },
  // A different series co-registered into the same frame of reference.
  'volume-2': {
    displaySetInstanceUID: 'volume-2',
    FrameOfReferenceUID: 'for-1',
    isReconstructable: true,
  },
  'volume-3': {
    displaySetInstanceUID: 'volume-3',
    FrameOfReferenceUID: 'for-1',
    isReconstructable: true,
  },
  'other-volume': {
    displaySetInstanceUID: 'other-volume',
    FrameOfReferenceUID: 'for-2',
    isReconstructable: true,
  },
  // Unrelated non-reconstructable series sharing a frame of reference.
  'stack-1': {
    displaySetInstanceUID: 'stack-1',
    FrameOfReferenceUID: 'for-s',
    isReconstructable: false,
  },
  'stack-2': {
    displaySetInstanceUID: 'stack-2',
    FrameOfReferenceUID: 'for-s',
    isReconstructable: false,
  },
  'seg-1': {
    displaySetInstanceUID: 'seg-1',
    Modality: 'SEG',
    FrameOfReferenceUID: 'for-1',
    isReconstructable: true,
    referencedDisplaySetInstanceUID: 'volume-1',
    isOverlayDisplaySet: true,
  },
  'rt-1': {
    displaySetInstanceUID: 'rt-1',
    Modality: 'RTSTRUCT',
    FrameOfReferenceUID: 'for-s',
    isReconstructable: false,
    referencedDisplaySetInstanceUID: 'stack-1',
    isOverlayDisplaySet: true,
  },
};

const displaySetService = {
  getDisplaySetByUID: (uid: string) => displaySets[uid],
} as unknown as AppTypes.DisplaySetService;

const viewportOptionsFor = (segmentationPresentationId: string) =>
  ({
    presentationIds: {
      positionPresentationId: 'pos',
      lutPresentationId: 'lut',
      segmentationPresentationId,
    },
  }) as unknown as AppTypes.ViewportGrid.GridViewportOptions;

const segItem = (segmentationId: string) => ({
  segmentationId,
  type: 'Labelmap',
  hydrated: true,
});

describe('getViewportPresentations', () => {
  beforeEach(() => {
    useSegmentationPresentationStore.getState().clearSegmentationPresentationStore();
    usePositionPresentationStore.getState().clearPositionPresentationStore();
    useLutPresentationStore.getState().clearLutPresentationStore();
  });

  it('returns nulls without presentationIds', () => {
    const result = getViewportPresentations(
      'vp-1',
      {} as unknown as AppTypes.ViewportGrid.GridViewportOptions
    );

    expect(result).toEqual({
      positionPresentation: null,
      lutPresentation: null,
      segmentationPresentation: null,
    });
  });

  it('returns the keyed entry for the display set the segmentation was hydrated against', () => {
    const { addSegmentationPresentationItem } = useSegmentationPresentationStore.getState();
    addSegmentationPresentationItem('volume-1', segItem('seg-1'));

    const result = getViewportPresentations(
      'vp-1',
      viewportOptionsFor('volume-1'),
      [displaySets['volume-1']] as never,
      displaySetService
    );

    expect(result.segmentationPresentation).toEqual([segItem('seg-1')]);
  });

  // The store cannot be keyed by frame of reference - unrelated series share
  // one - so eligibility is resolved here instead, against this viewport's
  // background display set.
  it('picks up a segmentation hydrated against a co-registered volume', () => {
    const { addSegmentationPresentationItem } = useSegmentationPresentationStore.getState();
    addSegmentationPresentationItem('volume-1', segItem('seg-1'));

    const result = getViewportPresentations(
      'vp-fusion',
      viewportOptionsFor('volume-2'),
      [displaySets['volume-2']] as never,
      displaySetService
    );

    expect(result.segmentationPresentation).toEqual([segItem('seg-1')]);
  });

  it('does not pick up a segmentation from a different frame of reference', () => {
    const { addSegmentationPresentationItem } = useSegmentationPresentationStore.getState();
    addSegmentationPresentationItem('volume-1', segItem('seg-1'));

    const result = getViewportPresentations(
      'vp-other',
      viewportOptionsFor('other-volume'),
      [displaySets['other-volume']] as never,
      displaySetService
    );

    expect(result.segmentationPresentation).toEqual(null);
  });

  it('does not reach past its own display set when the reference is not reconstructable', () => {
    const { addSegmentationPresentationItem } = useSegmentationPresentationStore.getState();
    addSegmentationPresentationItem('stack-1', segItem('rt-1'));

    const result = getViewportPresentations(
      'vp-stack-2',
      viewportOptionsFor('stack-2'),
      [displaySets['stack-2']] as never,
      displaySetService
    );

    expect(result.segmentationPresentation).toEqual(null);
  });

  it('lets the keyed entry win over an eligible one for the same segmentation', () => {
    const { addSegmentationPresentationItem } = useSegmentationPresentationStore.getState();
    // A stale eligible entry saying hydrated, and the authoritative keyed entry
    // saying the user dismissed it.
    addSegmentationPresentationItem('volume-1', segItem('seg-1'));
    addSegmentationPresentationItem('volume-2', { ...segItem('seg-1'), hydrated: false });

    const result = getViewportPresentations(
      'vp-fusion',
      viewportOptionsFor('volume-2'),
      [displaySets['volume-2']] as never,
      displaySetService
    );

    expect(result.segmentationPresentation).toEqual([{ ...segItem('seg-1'), hydrated: false }]);
  });

  // storePresentation records `hydrated: null` for every pane a segmentation is
  // merely rendered in, so a keyed entry of null must not be read as "dismissed"
  // - otherwise one store/restore cycle would erase the relation that put the
  // segmentation in this pane and it would silently vanish.
  it('does not let a keyed no-statement entry override the hydration of its own display set', () => {
    const { addSegmentationPresentationItem } = useSegmentationPresentationStore.getState();
    addSegmentationPresentationItem('volume-1', segItem('seg-1'));
    addSegmentationPresentationItem('volume-2', { ...segItem('seg-1'), hydrated: null });

    const result = getViewportPresentations(
      'vp-fusion',
      viewportOptionsFor('volume-2'),
      [displaySets['volume-2']] as never,
      displaySetService
    );

    expect(result.segmentationPresentation).toEqual([segItem('seg-1')]);
  });

  it('keeps a keyed no-statement entry when nothing else states hydration', () => {
    const { addSegmentationPresentationItem } = useSegmentationPresentationStore.getState();
    addSegmentationPresentationItem('volume-2', { ...segItem('seg-1'), hydrated: null });

    const result = getViewportPresentations(
      'vp-fusion',
      viewportOptionsFor('volume-2'),
      [displaySets['volume-2']] as never,
      displaySetService
    );

    expect(result.segmentationPresentation).toEqual([{ ...segItem('seg-1'), hydrated: null }]);
  });

  // With three co-registered panes, two keys hold an entry for the one
  // segmentation: its own display set's, and the bookkeeping `hydrated: null`
  // the second pane wrote on teardown. Neither is the third pane's own key, so
  // both are reached by the scan and store order must not decide between them.
  it('prefers the referenced display set entry over a no-statement one from another pane', () => {
    const { addSegmentationPresentationItem } = useSegmentationPresentationStore.getState();
    addSegmentationPresentationItem('volume-1', segItem('seg-1'));
    addSegmentationPresentationItem('volume-2', { ...segItem('seg-1'), hydrated: null });

    const result = getViewportPresentations(
      'vp-third',
      viewportOptionsFor('volume-3'),
      [displaySets['volume-3']] as never,
      displaySetService
    );

    expect(result.segmentationPresentation).toEqual([segItem('seg-1')]);
  });

  // Same pair of entries, written the other way round: the answer is the entry
  // that states a hydration either way.
  it('prefers the referenced display set entry whichever order the store holds them in', () => {
    const { addSegmentationPresentationItem } = useSegmentationPresentationStore.getState();
    addSegmentationPresentationItem('volume-2', { ...segItem('seg-1'), hydrated: null });
    addSegmentationPresentationItem('volume-1', segItem('seg-1'));

    const result = getViewportPresentations(
      'vp-third',
      viewportOptionsFor('volume-3'),
      [displaySets['volume-3']] as never,
      displaySetService
    );

    expect(result.segmentationPresentation).toEqual([segItem('seg-1')]);
  });

  // A dismissal recorded against the segmentation's own display set is what the
  // third pane converges on, not the `hydrated: true` another pane still holds.
  it('lets a dismissal on the referenced display set reach a third pane', () => {
    const { addSegmentationPresentationItem } = useSegmentationPresentationStore.getState();
    addSegmentationPresentationItem('volume-2', segItem('seg-1'));
    addSegmentationPresentationItem('volume-1', { ...segItem('seg-1'), hydrated: false });

    const result = getViewportPresentations(
      'vp-third',
      viewportOptionsFor('volume-3'),
      [displaySets['volume-3']] as never,
      displaySetService
    );

    expect(result.segmentationPresentation).toEqual([{ ...segItem('seg-1'), hydrated: false }]);
  });

  it('ignores overlay display sets when resolving the background', () => {
    const { addSegmentationPresentationItem } = useSegmentationPresentationStore.getState();
    addSegmentationPresentationItem('volume-1', segItem('seg-1'));

    const result = getViewportPresentations(
      'vp-fusion',
      viewportOptionsFor('volume-2'),
      [displaySets['seg-1'], displaySets['volume-2']] as never,
      displaySetService
    );

    expect(result.segmentationPresentation).toEqual([segItem('seg-1')]);
  });

  it('falls back to the keyed entry with no display sets supplied', () => {
    const { addSegmentationPresentationItem } = useSegmentationPresentationStore.getState();
    addSegmentationPresentationItem('volume-1', segItem('seg-1'));

    const result = getViewportPresentations('vp-1', viewportOptionsFor('volume-1'));

    expect(result.segmentationPresentation).toEqual([segItem('seg-1')]);
  });
});
