const defaultState = {
    sidebarLeftOpen: true,
    sidebarRightOpen: true,
}

const ui = (state = defaultState, action) => {
    switch (action.type) {
        case 'TOGGLE_LEFT_SIDEBAR':
            return Object.assign({}, state, { sidebarLeftOpen: !state.sidebarLeftOpen });
        case 'TOGGLE_RIGHT_SIDEBAR':
            return Object.assign({}, state, { sidebarRightOpen: !state.sidebarRightOpen });
        default:
            return state;
    }
};

export default ui;
