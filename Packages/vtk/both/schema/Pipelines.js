import { SimpleSchema } from 'meteor/aldeed:simple-schema';

const methodParametersDefinitions = {
    multidimensional: {
        type: String,
        label: 'Multdimensional',
        optional: true
    },
    casting: {
        type: String,
        label: "Casting",
        optional: false
    },
    value: {
        type: String,
        label: 'Value',
        optional: false
    }
};

const links = {
    href: {
        type: String,
        name: 'href'
    },
    templated: {
        type: Boolean,
        name: 'templated'
    }
};

export const MethodDefinitions = {
    name: {
        type: String,
        label: 'Name'
    },
    parameters: [methodParametersDefinitions]
};

export const FiltersDefinitions = new SimpleSchema({
    filterClass: {
        type: String,
        label: 'Filter Class'
    },
    methods: {
        type: [MethodDefinitions],
        label: 'Methods',
        minCount: 1
    }
});

const pipelineDtoDefinitions = new SimpleSchema({
    filters: {
        type: [FiltersDefinitions],
        label: 'Filters',
        optional: true
    }
});

export const PipelineSchema = new SimpleSchema({
    _links: {
        type: [links],
        label: '_links'
    },
    id: {
        type: String,
        label: 'ID',
        optional: true
    },
    name: {
        type: String,
        label: 'Pipeline Name',
        optional: false
    },
    pipelineDto: {
        type: pipelineDtoDefinitions,
        label: 'pipelineDto'
    }
});
