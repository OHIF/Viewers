const defaultState = {
    leftSidebarOpen: true,
    rightSidebarOpen: false,
}

const ui = (state = defaultState, action) => {
    switch (action.type) {
        case 'SET_LEFT_SIDEBAR_OPEN':
            return Object.assign({}, state, { leftSidebarOpen: action.state });
        case 'SET_RIGHT_SIDEBAR_OPEN':
            return Object.assign({}, state, { rightSidebarOpen: action.state });
        default:
            return state;
    }
};

export default ui;
