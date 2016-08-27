Template.componentPlayground.onCreated(() => {
    const instance = Template.instance();
    instance.items = [{
        label: 'Category 1',
        value: 'Category 1',
        items: [{
            label: 'Subcategory 1.1',
            value: 'Subcategory 1.1'
        }, {
            label: 'Subcategory 1.2',
            value: 'Subcategory 1.2',
            items: [{
                label: 'Subcategory 1.2.1',
                value: 'Subcategory 1.2.1'
            }, {
                label: 'Subcategory 1.2.2',
                value: 'Subcategory 1.2.2',
                items: [{
                    label: 'Subcategory 1.2.2.1',
                    value: 'Subcategory 1.2.2.1'
                }, {
                    label: 'Subcategory 1.2.2.2',
                    value: 'Subcategory 1.2.2.2'
                }]
            }]
        }]
    }, {
        label: 'Category 2',
        value: 'Category 2',
        items: [{
            label: 'Subcategory 2.1',
            value: 'Subcategory 2.1'
        }, {
            label: 'Subcategory 2.2',
            value: 'Subcategory 2.2'
        }, {
            label: 'Subcategory 2.3',
            value: 'Subcategory 2.3'
        }]
    }, {
        label: 'Category 3',
        value: 'Category 3'
    }];
});

Template.componentPlayground.onRendered(() => {
    const instance = Template.instance();
    instance.$('.measure-flow').draggable();
});
