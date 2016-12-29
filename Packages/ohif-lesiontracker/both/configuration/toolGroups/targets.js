import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { bidirectional } from '../tools/bidirectional';
import { targetCR } from '../tools/targetCR';
import { targetUN } from '../tools/targetUN';

const TargetSchema = new SimpleSchema({
    toolId: {
        type: String,
        label: 'Tool ID'
    },
    toolItemId: {
        type: String,
        label: 'Tool Item ID'
    },
    createdAt: {
        type: Date
    }
});

export const targets = {
    id: 'targets',
    name: 'Targets',
    childTools: [bidirectional, targetCR, targetUN],
    schema: TargetSchema
};
