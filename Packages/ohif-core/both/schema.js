import { SimpleSchema } from 'meteor/aldeed:simple-schema';

SimpleSchema.extendOptions({
    valuesLabels: Match.Optional([String])
});
