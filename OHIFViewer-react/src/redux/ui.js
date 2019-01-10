const defaultState = {
    leftSidebarOpen: true,
    rightSidebarOpen: false,
    userPreferencesModalOpen: true
}

const ui = (state = defaultState, action) => {
    switch (action.type) {
        case 'SET_LEFT_SIDEBAR_OPEN':
            return Object.assign({}, state, { leftSidebarOpen: action.state });
        case 'SET_RIGHT_SIDEBAR_OPEN':
            return Object.assign({}, state, { rightSidebarOpen: action.state });
        case 'SET_USER_PREFERENCES_MODAL_OPEN':
            return Object.assign({}, state, { userPreferencesModalOpen: action.state });
        default:
            return state;
    }
};

export default ui;
