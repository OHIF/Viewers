import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { length } from '../tools/length';
import { ellipse } from '../tools/ellipse';

const TempSchema = new SimpleSchema({
    toolId: {
        type: String,
        label: 'Tool ID'
    },
    toolItemUid: {
        type: String,
        label: 'Tool Item UID'
    }
});

export const temp = {
    id: 'temp',
    name: 'Temporary',
    childTools: [length, ellipse],
    schema: TempSchema
};
