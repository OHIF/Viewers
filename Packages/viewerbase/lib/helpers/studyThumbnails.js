/**
 * A global Blaze UI helper to get the thumbnails for the given study
 */
Template.registerHelper('studyThumbnails', study => {
    if (!study) {
        return;
    }

    // Find the study's stacks
    const stacks = study.displaySets;

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
