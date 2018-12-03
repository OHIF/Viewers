const defaultState = {
    activeViewport: 0
}

const viewports = (state = defaultState, action) => {
    console.warn(action);
    switch (action.type) {
        case 'SET_VIEWPORT_ACTIVE':
            return Object.assign({}, state, { activeViewport: action.viewportIndex });
        default:
            return state;
    }
};

export default viewports;
