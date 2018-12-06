const defaultState = {
    activeViewportIndex: 0
}

const viewports = (state = defaultState, action) => {
    console.warn(action);
    switch (action.type) {
        case 'SET_VIEWPORT_ACTIVE':
            return Object.assign({}, state, { activeViewportIndex: action.viewportIndex });
        default:
            return state;
    }
};

export default viewports;
