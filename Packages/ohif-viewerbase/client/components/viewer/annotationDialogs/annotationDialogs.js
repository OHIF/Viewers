Template.annotationDialogs.onRendered(() => {
    const instance = Template.instance();
    const dialogIds = ['annotationDialog', 'relabelAnnotationDialog'];

    dialogIds.forEach(id => {
        const dialog = instance.$('#' + id);
        dialog.draggable();
        dialogPolyfill.registerDialog(dialog.get(0));
    });
});

