import {
  DEFAULT_DENTAL_PREFERENCES,
  DentalPreferences,
  normalizeDentalPreferences,
} from '../preferences/dentalPreferences';

export type DentalLayoutContext = {
  activeViewportId?: string;
  viewportIds: string[];
  protocolId?: string;
  stageId?: string;
};

export type DentalViewerState = DentalPreferences & {
  layoutContext: DentalLayoutContext;
};

const DEFAULT_LAYOUT_CONTEXT: DentalLayoutContext = {
  viewportIds: [],
};

export const DEFAULT_DENTAL_VIEWER_STATE: DentalViewerState = {
  ...DEFAULT_DENTAL_PREFERENCES,
  layoutContext: DEFAULT_LAYOUT_CONTEXT,
};

export function normalizeDentalLayoutContext(value: unknown): DentalLayoutContext {
  if (!value || typeof value !== 'object') {
    return DEFAULT_LAYOUT_CONTEXT;
  }

  const candidate = value as Partial<DentalLayoutContext>;

  return {
    activeViewportId:
      typeof candidate.activeViewportId === 'string' ? candidate.activeViewportId : undefined,
    viewportIds: Array.isArray(candidate.viewportIds)
      ? candidate.viewportIds.filter((viewportId): viewportId is string => typeof viewportId === 'string')
      : [],
    protocolId: typeof candidate.protocolId === 'string' ? candidate.protocolId : undefined,
    stageId: typeof candidate.stageId === 'string' ? candidate.stageId : undefined,
  };
}

export function normalizeDentalViewerState(value: unknown): DentalViewerState {
  if (!value || typeof value !== 'object') {
    return DEFAULT_DENTAL_VIEWER_STATE;
  }

  const candidate = value as Partial<DentalViewerState>;

  return {
    ...normalizeDentalPreferences(candidate),
    layoutContext: normalizeDentalLayoutContext(candidate.layoutContext),
  };
}
