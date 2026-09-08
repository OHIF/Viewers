import { useSegmentationPresentationStore } from './useSegmentationPresentationStore';
import type { SegmentationPresentationItem } from '../types/Presentation';

const item = (
  segmentationId: string,
  overrides: Partial<SegmentationPresentationItem> = {}
): SegmentationPresentationItem =>
  ({
    segmentationId,
    type: 'Labelmap',
    hydrated: true,
    ...overrides,
  }) as SegmentationPresentationItem;

const storeFor = (presentationId: string) =>
  useSegmentationPresentationStore.getState().segmentationPresentationStore[presentationId];

describe('useSegmentationPresentationStore', () => {
  beforeEach(() => {
    useSegmentationPresentationStore.getState().clearSegmentationPresentationStore();
  });

  describe('addSegmentationPresentationItem', () => {
    it('replaces the entry for a segmentation rather than appending', () => {
      const { addSegmentationPresentationItem } = useSegmentationPresentationStore.getState();

      addSegmentationPresentationItem('volume-1', item('seg-1'));
      addSegmentationPresentationItem('volume-1', item('seg-1', { hydrated: false }));

      expect(storeFor('volume-1')).toEqual([item('seg-1', { hydrated: false })]);
    });
  });

  // A segmentation drawn in the client has no referenced display set, so it has
  // no key of its own - it is recorded under whatever viewport drew it, and a
  // removal has to supersede that record where it actually lives.
  describe('setHydrationForSegmentation', () => {
    it('restates the hydration of a segmentation in every presentation holding it', () => {
      const { addSegmentationPresentationItem, setHydrationForSegmentation } =
        useSegmentationPresentationStore.getState();

      addSegmentationPresentationItem('volume-1', item('seg-1'));
      addSegmentationPresentationItem('volume-2', item('seg-1'));

      setHydrationForSegmentation('seg-1', { hydrated: false });

      expect(storeFor('volume-1')).toEqual([item('seg-1', { hydrated: false })]);
      expect(storeFor('volume-2')).toEqual([item('seg-1', { hydrated: false })]);
    });

    it('leaves the other segmentations of a presentation alone', () => {
      const { addSegmentationPresentationItem, setHydrationForSegmentation } =
        useSegmentationPresentationStore.getState();

      addSegmentationPresentationItem('volume-1', item('seg-1'));
      addSegmentationPresentationItem('volume-1', item('seg-2'));

      setHydrationForSegmentation('seg-1', { hydrated: false });

      expect(storeFor('volume-1')).toEqual([item('seg-1', { hydrated: false }), item('seg-2')]);
    });

    it('keeps the recorded type when the caller does not know it', () => {
      const { addSegmentationPresentationItem, setHydrationForSegmentation } =
        useSegmentationPresentationStore.getState();

      addSegmentationPresentationItem('volume-1', item('seg-1', { type: 'Surface' as never }));

      setHydrationForSegmentation('seg-1', { hydrated: false });

      expect(storeFor('volume-1')).toEqual([
        item('seg-1', { hydrated: false, type: 'Surface' as never }),
      ]);
    });

    it('creates no entry for a segmentation nothing has recorded', () => {
      const { setHydrationForSegmentation, segmentationPresentationStore } =
        useSegmentationPresentationStore.getState();

      setHydrationForSegmentation('seg-1', { hydrated: false });

      expect(useSegmentationPresentationStore.getState().segmentationPresentationStore).toBe(
        segmentationPresentationStore
      );
    });
  });

  describe('syncSegmentationPresentation', () => {
    // The viewport is reporting what it renders, not what belongs in the
    // standard view: a segmentation added from the viewport data overlay menu
    // must not become hydrated everywhere the presentation id is shared.
    it('keeps the recorded hydration for a segmentation the store knows', () => {
      const { addSegmentationPresentationItem, syncSegmentationPresentation } =
        useSegmentationPresentationStore.getState();

      addSegmentationPresentationItem('volume-1', item('seg-1', { hydrated: false }));
      syncSegmentationPresentation('volume-1', [item('seg-1', { hydrated: true })]);

      expect(storeFor('volume-1')).toEqual([item('seg-1', { hydrated: false })]);
    });

    it('refreshes the type of a segmentation the store knows', () => {
      const { addSegmentationPresentationItem, syncSegmentationPresentation } =
        useSegmentationPresentationStore.getState();

      addSegmentationPresentationItem('volume-1', item('seg-1'));
      syncSegmentationPresentation('volume-1', [
        item('seg-1', { hydrated: null, type: 'Surface' as never }),
      ]);

      expect(storeFor('volume-1')).toEqual([item('seg-1', { type: 'Surface' as never })]);
    });

    it("takes the caller's hydration for a segmentation with no entry yet", () => {
      const { syncSegmentationPresentation } = useSegmentationPresentationStore.getState();

      syncSegmentationPresentation('volume-1', [item('seg-1', { hydrated: null })]);

      expect(storeFor('volume-1')).toEqual([item('seg-1', { hydrated: null })]);
    });

    // The presentation id is shared by every pane over the same background, so
    // a pane that does not render a segmentation - gated out of automatic
    // hydration, or one the user removed the overlay from - must not erase the
    // record the others resolve against.
    it('keeps entries the viewport is not rendering', () => {
      const { addSegmentationPresentationItem, syncSegmentationPresentation } =
        useSegmentationPresentationStore.getState();

      addSegmentationPresentationItem('volume-1', item('seg-1'));
      syncSegmentationPresentation('volume-1', []);

      expect(storeFor('volume-1')).toEqual([item('seg-1')]);
    });

    it('adds a segmentation alongside the ones already recorded', () => {
      const { addSegmentationPresentationItem, syncSegmentationPresentation } =
        useSegmentationPresentationStore.getState();

      addSegmentationPresentationItem('volume-1', item('seg-1'));
      syncSegmentationPresentation('volume-1', [item('seg-2', { hydrated: null })]);

      expect(storeFor('volume-1')).toEqual([item('seg-1'), item('seg-2', { hydrated: null })]);
    });
  });
});
