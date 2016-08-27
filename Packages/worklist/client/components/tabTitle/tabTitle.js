Template.tabTitle.events({
    /**
     * Closes a tab when the close button is pressed in the title
     * The next tab to the left is loaded if the current tab is closed
     *
     * @param e The click event used to close the tab
     */
    'click .close': function(e) {
        console.log('click .close');
        
        // Identify the tab title DOM node
        var tab = $(e.currentTarget).parents('a[data-toggle="tab"]').eq(0);

        // Get the relevent contentId that this tab title represents
        // Replace any hash marks (#) that were required by Bootstrap's tab switching
        var contentId = tab.data('target').replace('#', '');
    
        // Check if we are closing the active tab. If we are, prepare to switch
        // to the next tab to the left.    
        var activeContentId = Session.get('activeContentId');
        if (activeContentId === contentId) {
            // Find the index of the tab that is being closed
            var tabIndex = tab.parent('li').index();

            // Find the index the tab to its left
            var newActiveTabIndex = Math.max(tabIndex - 1, 0);

            // Find the DOM node of the tab that will be activated
            var newActiveTab = $('.tabTitle').eq(newActiveTabIndex);

            // Find the content ID of the tab that will be switched to
            var newActiveTabLink = newActiveTab.find('a[data-toggle=tab]');
            var newContentId = newActiveTabLink.data('target').replace('#', '');

            // Switch to this tab
            switchToTab(newContentId);   
        }

        // Find the tab to be closed in the Tabs collection
        var tabObject = WorklistTabs.findOne({
            contentid: contentId
        });

        // Remove this tab from the Tabs collection so it is no longer rendered
        WorklistTabs.remove(tabObject._id);

        // Remove any stored data related to this tab from the global ViewerData structure
        delete ViewerData[contentId];
    }
});