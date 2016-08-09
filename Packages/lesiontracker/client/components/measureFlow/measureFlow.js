Template.measureFlow.onCreated(() => {
    const instance = Template.instance();

    const items = [
        'Adrenal',
        'Bladder',
        'Bone',
        'Brain',
        'Breast',
        'Colon',
        'Esophagus',
        'Extremities',
        'Gallbladder',
        'Kidney',
        'Liver',
        'Lung',
        'Lymph Node',
        'Muscle',
        'Neck',
        'Other: Soft Tissue',
        'Ovary',
        'Pancreas',
        'Pelvis',
        'Peritoneum/Omentum',
        'Prostate',
        'Retroperitoneum',
        'Small Bowel',
        'Spleen',
        'Stomach',
        'Subcutaneous'
    ];

    instance.items = [];
    _.each(items, item => {
        instance.items.push({
            label: item,
            value: item
        });
    });
});

Template.measureFlow.events({
    'click .tree-leaf input'(event, instance) {
        console.warn('>>>>event', event);
        const $label = $(event.currentTarget).closest('label');
        const $container = $label.closest('.select-tree-root').find('.tree-options:first');
        const top = $label.position().top;
        $container.scrollTop(top);
    }
});
