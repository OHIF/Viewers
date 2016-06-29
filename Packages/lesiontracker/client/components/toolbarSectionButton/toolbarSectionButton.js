Template.toolbarSectionButton.helpers({
    activeClass() {
        const instance = Template.instance();

        // Check if the current tool is the active one
        if (instance.data.id === Session.get('ToolManagerActiveTool')) {
            // Return the active class
            return 'active';
        }

        return;
    }
});
