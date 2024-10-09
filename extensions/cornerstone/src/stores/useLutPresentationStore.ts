import { create } from 'zustand';
import { LutPresentation } from '../types/Presentation';
import { addUniqueIndex, DEFAULT_STR, JOIN_STR } from './presentationUtils';

type LutPresentationState = {
  lutPresentationStore: Record<string, LutPresentation>;
  setLutPresentation: (key: string, value: LutPresentation) => void;
  clearLutPresentationStore: () => void;
  getPresentationId: (
    id: string,
    {
      viewport,
      viewports,
      isUpdatingSameViewport,
    }: { viewport: any; viewports: any; isUpdatingSameViewport: any }
  ) => string;
};

// Stores a map from `lutPresentationId` to a Presentation object so that
// an OHIFCornerstoneViewport can be redisplayed with the same LUT
export const useLutPresentationStore = create<LutPresentationState>(set => ({
  lutPresentationStore: {},
  getPresentationId: (id, { viewport, viewports, isUpdatingSameViewport }) => {
    const getLutId = (ds): string => {
      if (!ds || !ds.options) {
        return DEFAULT_STR;
      }
      if (ds.options.id) {
        return ds.options.id;
      }
      const arr = Object.entries(ds.options).map(([key, val]) => `${key}=${val}`);
      if (!arr.length) {
        return DEFAULT_STR;
      }
      return arr.join(JOIN_STR);
    };

    if (id !== 'lutPresentationId') {
      return;
    }

    if (!viewport || !viewport.viewportOptions || !viewport.displaySetInstanceUIDs?.length) {
      return;
    }

    const { displaySetOptions, displaySetInstanceUIDs } = viewport;
    const lutId = getLutId(displaySetOptions[0]);
    const lutPresentationArr = [lutId];

    for (const uid of displaySetInstanceUIDs) {
      lutPresentationArr.push(uid);
    }

    addUniqueIndex(lutPresentationArr, 'lutPresentationId', viewports, isUpdatingSameViewport);

    return lutPresentationArr.join(JOIN_STR);
  },
  setLutPresentation: (key, value) =>
    set(state => ({
      lutPresentationStore: {
        ...state.lutPresentationStore,
        [key]: value,
      },
    })),
  clearLutPresentationStore: () => set({ lutPresentationStore: {} }),
}));
