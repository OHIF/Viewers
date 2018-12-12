// Get the key for the handle which is selected
export default function(handles) {
    let selectedHandleKey;
    Object.keys(handles).every(handleKey => {
        const handle = handles[handleKey];
        if (handle.selected) {
            selectedHandleKey = handleKey;
            return false;
        }

        return true;
    });
    return selectedHandleKey;
}
