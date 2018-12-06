const defaultButtons = [
    {
        command: 'Pan',
        type: 'tool',
        text: 'Pan',
        svgUrl: '/icons.svg#icon-tools-pan',
        active: false
    },
    {
        command: 'Zoom',
        type: 'tool',
        text: 'Zoom',
        svgUrl: '/icons.svg#icon-tools-zoom',
        active: false
    },
    {
        command: 'Bidirectional',
        type: 'tool',
        text: 'Bidirectional',
        svgUrl: '/icons.svg#icon-tools-measure-target',
        active: false
    },
    {
        command: 'StackScroll',
        type: 'tool',
        text: 'Stack Scroll',
        svgUrl: '/icons.svg#icon-tools-stack-scroll',
        active: false
    },
    {
        command: 'reset',
        type: 'command',
        text: 'Reset',
        svgUrl: '/icons.svg#icon-tools-reset',
        active: false
    },
    {
        command: 'Wwwc',
        type: 'tool',
        text: 'Manual',
        svgUrl: '/icons.svg#icon-tools-levels',
        active: true
    },
    {
        command: 'setWLPresetSoftTissue',
        type: 'command',
        text: 'Soft Tissue',
        svgUrl: '/icons.svg#icon-wl-soft-tissue',
        active: false
    },
    {
        command: 'setWLPresetLung',
        type: 'command',
        text: 'Lung',
        svgUrl: '/icons.svg#icon-wl-lung',
        active: false
    },
    {
        command: 'setWLPresetLiver',
        type: 'command',
        text: 'Liver',
        svgUrl: '/icons.svg#icon-wl-liver',
        active: false
    },
    {
        command: 'setWLPresetBrain',
        type: 'command',
        text: 'Brain',
        svgUrl: '/icons.svg#icon-wl-brain',
        active: false
    }
];

const tools = (state = { buttons: defaultButtons }, action) => {
    switch (action.type) {
        case 'SET_TOOL_ACTIVE':
            const item = state.buttons.find(button => button.command === action.tool);

            let buttons = [];

            if (item.type === 'tool') {
                buttons = state.buttons.map(button => {
                    if (button.command === action.tool) {
                        button.active = true;
                    } else if (button.type === 'tool') {
                        button.active = false;
                    }

                    return button;
                });
            }

            return {
                buttons
            };
        default:
            return state;
    }
};

export default tools;
