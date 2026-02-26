import { create } from 'zustand';

/**
 * When true, running Segment Bidirectional (user-initiated) will navigate to the
 * largest bidirectional slice. When false, it will not. Recalculations from
 * segmentation data changes never navigate regardless of this setting.
 */
export type BidirectionalAutoNavigateStore = {
  autoNavigateToLargestSlice: boolean;
  setAutoNavigateToLargestSlice: (value: boolean) => void;
  toggleAutoNavigateToLargestSlice: () => void;
};

export const bidirectionalAutoNavigateStore = create<BidirectionalAutoNavigateStore>(set => ({
  autoNavigateToLargestSlice: true,
  setAutoNavigateToLargestSlice: value =>
    set({ autoNavigateToLargestSlice: value }),
  toggleAutoNavigateToLargestSlice: () =>
    set(state => ({ autoNavigateToLargestSlice: !state.autoNavigateToLargestSlice })),
}));

export const useBidirectionalAutoNavigateStore = bidirectionalAutoNavigateStore;
