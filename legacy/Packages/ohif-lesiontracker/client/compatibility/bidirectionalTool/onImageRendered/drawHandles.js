import { cornerstoneTools } from 'meteor/ohif:cornerstone';

// Add a proxy to cornerstoneTools.drawHandles function to change the handles' active state base on
// the hover, moving and selected states
export default function(context, eventData, handles, color, options) {
    Object.keys(handles).forEach(handleKey => {
        if (handleKey === 'textBox') return;
        const handle = handles[handleKey];
        handle.drawnIndependently = handle.moving;
        if (handle.selected) {
            handle.active = handle.hover;
        } else {
            if (handle.hover) {
                handle.active = true;
            } else {
                handle.active = false;
            }
        }
    });

    cornerstoneTools.drawHandles(context, eventData, handles, color, options);
}
