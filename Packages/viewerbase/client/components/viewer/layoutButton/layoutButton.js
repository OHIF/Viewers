Template.layoutButton.events({
    // TODO: Check why 'click' event won't fire?
    'mousedown .js-dropdown-toggle'(event) {
        // Select the button and it's target dropdown menu
        const $button = $(event.currentTarget);
        const $dropdown = $($button.data('target'));

        // Adjust the dropdown's CSS to properly place it on the page
        $dropdown.css({
            top: $button.offset().top + $button.outerHeight() + 'px',
            left: $button.offset().left + 'px'
        });

        toggleDialog($dropdown);
    }
});
