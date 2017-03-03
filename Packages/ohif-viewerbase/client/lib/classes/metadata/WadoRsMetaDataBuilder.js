export class WadoRsMetaDataBuilder {
    constructor() {
        this.tags = {};
    }

    addTag(tag, value, multi) {
        this.tags[tag] = {
            tag,
            value,
            multi
        };

        return this;
    }

    toJSON() {
        const json = {};
        const keys = Object.keys(this.tags);

        keys.forEach(key => {
            if (!this.tags.hasOwnProperty(key)) {
                return;
            }

            const tag = this.tags[key];
            const multi = !!tag.multi;
            let value = tag.value;

            if ((value == null) || ((value.length === 1) && (value[0] == null))) {
                return;
            }

            if ((typeof value === 'string') && multi) {
                value = value.split('\\');
            }

            if (!_.isArray(value)) {
                value = [value];
            }

            json[key] = {
                Value: value
            };
        });

        return json;
    }
}
