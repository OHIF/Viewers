import validate from './validator.js';

describe('validator', () => {
    const attributeMap = {
        str: 'string',
        upper: 'UPPER',
        num: 3,
        nullValue: null,
        list: ['abc', 'def', 'GHI'],
    };

    const options = {
        format: 'grouped',
    };

    describe('contains', () => {
        it('returns match any list contains', () => {
            expect(
                validate(attributeMap, { list: { contains: 'a' } }, [options])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { str: { contains: 'i' } }, [options])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { str: { contains: ['i'] } }, [options])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { list: { contains: ['a'] } }, [options])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { list: { contains: ['z', 'd'] } }, [options])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { list: { contains: ['z'] } }, [options])
            ).not.toBeUndefined();
        });
    });

    describe('containsI', () => {
        it('returns match any list contains case insensitive', () => {
            expect(
                validate(attributeMap, { upper: { containsI: ['bye', 'pre'] } }, [
                    options,
                ])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { list: { containsI: 'hi' } }, [options])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { list: { containsI: ['hi', 'bye'] } }, [
                    options,
                ])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { list: { containsI: ['bye', 'hi'] } }, [
                    options,
                ])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { list: { containsI: ['ig', 'hi'] } }, [options])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { upper: { containsI: ['bye', 'per'] } }, [
                    options,
                ])
            ).toBeUndefined();
        });
    });

    describe('doesNotEqual', () => {
        it('returns undefined if value does not equal ', () => {
            expect(
                validate(attributeMap, { str: { doesNotEqual: 'hello' } }, [options])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { str: { doesNotEqual: ['hello'] } }, [options])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { str: { doesNotEqual: { value: 'hello' } } }, [
                    options,
                ])
            ).toBeUndefined();
            expect(
                validate(
                    attributeMap,
                    { list: { doesNotEqual: ['hello', 'bye', 'ok'] } },
                    [options]
                )
            ).toBeUndefined();
            expect(
                validate(attributeMap, { list: { doesNotEqual: ['ae', 'I', 'ok'] } }, [
                    options,
                ])
            ).toBeUndefined();
        });
        it('returns error if value equals specified value', () => {
            expect(
                validate(attributeMap, { num: { doesNotEqual: 3 } }, [options])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { num: { doesNotEqual: { value: 3 } } }, [
                    options,
                ])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { num: { doesNotEqual: [3] } }, [options])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { str: { doesNotEqual: 'string' } }, [options])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { str: { doesNotEqual: ['string'] } }, [options])
            ).not.toBeUndefined();
        });
    });
    describe('doesNotContain', () => {
        it('returns undefined if string does not contain specified value', () => {
            expect(
                validate(attributeMap, { str: { doesNotContain: 'z' } }, [options])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { str: { doesNotContain: { value: 'z' } } }, [
                    options,
                ])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { str: { doesNotContain: ['x'] } }, [options])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { list: { doesNotContain: ['bye', 'hi'] } }, [
                    options,
                ])
            ).toBeUndefined();
        });

        it('returns error if string contains specified value', () => {
            expect(
                validate(attributeMap, { str: { doesNotContain: 's' } }, [options])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { str: { doesNotContain: { value: 'r' } } }, [
                    options,
                ])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { str: { doesNotContain: ['t'] } }, [options])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { list: { doesNotContain: ['abc', 'hi'] } }, [
                    options,
                ])
            ).not.toBeUndefined();
        });
    });

    describe('equals', () => {
        it('returned undefined on equals', () => {
            expect(
                validate(attributeMap, { str: { equals: attributeMap.str } }, [options])
            ).toBeUndefined();
            expect(
                validate(
                    attributeMap,
                    { str: { equals: { value: attributeMap.str } } },
                    [options]
                )
            ).toBeUndefined();
            expect(
                validate(attributeMap, { str: { equals: [attributeMap.str] } }, [
                    options,
                ])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { list: { equals: ['abc', 'GHI', 'def'] } }, [
                    options,
                ])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { list: { equals: attributeMap.list } }, [
                    options,
                ])
            ).toBeUndefined();
        });

        it('returns error on not equals', () => {
            expect(
                validate(attributeMap, { list: { equals: ['def', 'abc'] } }, [options])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { list: { equals: ['def', 'abc', 'hi'] } }, [
                    options,
                ])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { str: { equals: 'abc' } }, [options])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { str: { equals: { value: 'abc' } } }, [options])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { str: { equals: ['abc'] } }, [options])
            ).not.toBeUndefined();
        });
    });
    describe('endsWith', () => {
        it('returns undefined if string ends with specified value', () => {
            expect(
                validate(attributeMap, { str: { endsWith: 'g' } }, [options])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { str: { endsWith: { value: 'g' } } }, [options])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { str: { endsWith: ['g'] } }, [options])
            ).toBeUndefined();
        });

        it('returns error if string does not end with specified value', () => {
            expect(
                validate(attributeMap, { str: { endsWith: 'S' } }, [options])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { str: { endsWith: { value: 'S' } } }, [options])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { str: { endsWith: ['y'] } }, [options])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { str: { endsWith: ['g', 'e'] } }, [options])
            ).not.toBeUndefined();
        });
    });
    describe('startsWith', () => {
        it('returns undefined if string starts with specified value', () => {
            expect(
                validate(attributeMap, { str: { startsWith: { value: 's' } } }, [
                    options,
                ])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { str: { startsWith: 'str' } }, [options])
            ).toBeUndefined();
            expect(
                validate(attributeMap, { str: { startsWith: ['st'] } }, [options])
            ).toBeUndefined();
        });

        it('returns error if string does not starts with specified value', () => {
            expect(
                validate(attributeMap, { str: { startsWith: ['st', 's'] } }, [options])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { str: { startsWith: 'h' } }, [options])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { str: { startsWith: { value: 'h' } } }, [
                    options,
                ])
            ).not.toBeUndefined();
        });
    });
    describe('greaterThan', () => {
        it('returns undefined on greaterThan', () => {
            expect(
                validate(
                    attributeMap,
                    { num: { greaterThan: { value: attributeMap.num - 1 } } },
                    [options]
                )
            ).toBeUndefined();
            expect(
                validate(attributeMap, { num: { greaterThan: attributeMap.num - 1 } }, [
                    options,
                ])
            ).toBeUndefined();
            expect(
                validate(
                    attributeMap,
                    { num: { greaterThan: [attributeMap.num - 1] } },
                    [options]
                )
            ).toBeUndefined();
        });

        it('returns error on not greater than', () => {
            expect(
                validate(
                    attributeMap,
                    { num: { greaterThan: { value: attributeMap.num } } },
                    [options]
                )
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { num: { greaterThan: attributeMap.num } }, [
                    options,
                ])
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { num: { greaterThan: [attributeMap.num] } }, [
                    options,
                ])
            ).not.toBeUndefined();
        });

        it('returns error on undefined value', () => {
            expect(
                validate(
                    attributeMap,
                    { numUndefined: { greaterThan: { value: 3 } } },
                    [options]
                )
            ).not.toBeUndefined();
            expect(
                validate(attributeMap, { numUndefined: { greaterThan: [3] } }, [
                    options,
                ])
            ).not.toBeUndefined();
        });
    });
});
