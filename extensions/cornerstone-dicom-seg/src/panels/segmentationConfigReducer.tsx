// Todo: use defaults in cs3d
const initialState = {
  renderOutline: true,
  renderFill: true,
  outlineOpacity: 0.9,
  outlineWidth: 3,
  fillOpacity: 0.9,
  fillOpacityInactive: 0.8,
  renderInactiveSegmentations: true,
};

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
    case 'SET_FILL_OPACITY':
      return { ...state, fillOpacity: action.payload.value };
    case 'SET_FILL_OPACITY_INACTIVE':
      return { ...state, fillOpacityInactive: action.payload.value };
    case 'RENDER_INACTIVE_SEGMENTATIONS':
      return { ...state, renderInactiveSegmentations: action.payload.value };
    default:
      return state;
  }
};

export { initialState, reducer };
