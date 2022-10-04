const reducer = (state, action) => {
  switch (action.type) {
    case 'RENDER_OUTLINE':
      return { ...state, renderOutline: action.payload.value };
    case 'RENDER_FILL':
      return { ...state, renderFill: action.payload.value };
    case 'SET_OUTLINE_OPACITY':
      return { ...state, outlineOpacity: action.payload.value };
    case 'SET_OUTLINE_WIDTH':
      return { ...state, outlineWidth: action.payload.value };
    case 'SET_FILL_ALPHA':
      return { ...state, fillAlpha: action.payload.value };
    case 'SET_FILL_ALPHA_INACTIVE':
      return { ...state, fillAlphaInactive: action.payload.value };
    case 'RENDER_INACTIVE_SEGMENTATIONS':
      return { ...state, renderInactiveSegmentations: action.payload.value };
    default:
      return state;
  }
};

export { reducer };
