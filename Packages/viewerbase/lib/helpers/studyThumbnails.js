/**
 * A global Blaze UI helper to get the thumbnails for the given study
 */
Template.registerHelper('studyThumbnails', study => {
    // Creates the series stacks
    const stacks = createStacks(study);

    // Defines the resulting thumbnails list
    const thumbnails = [];

    // Iterate over the stacks and add one by one with its index
    _.each(stacks, (stack, index) => {
        thumbnails.push({
            thumbnailIndex: index,
            stack: stack
        });
    });

    return thumbnails;
});
