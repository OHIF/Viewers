import validate from "./validator.js";

describe("validator", () => {
  const attributeMap = {
    str: "string",
    num: 3,
    nullValue: null,
    list: ["abc", "def"],
  }

  const options = {
    format: 'grouped',
  };

  describe("contains", () => {
    it("returns match any list contains", () => {
      expect(validate(attributeMap, { list: { contains: 'a' } }, [options])).toBeUndefined();
      expect(validate(attributeMap, { str: { contains: 'i' } }, [options])).toBeUndefined();
      expect(validate(attributeMap, { str: { contains: ['i'] } }, [options])).toBeUndefined();
      expect(validate(attributeMap, { list: { contains: ['a'] } }, [options])).toBeUndefined();
      expect(validate(attributeMap, { list: { contains: ['z', 'd'] } }, [options])).toBeUndefined();
      expect(validate(attributeMap, { list: { contains: ['z'] } }, [options])).not.toBeUndefined();
    })
  })

  describe("equals", () => {
    it("returned undefined on equals", () => {
      expect(validate(attributeMap, { str: { equals: attributeMap.str } }, [options])).toBeUndefined();
      expect(validate(attributeMap, { num: { equals: { value: attributeMap.num } } }, [options])).toBeUndefined();
    })

    it("returns error on not equals", () => {
      expect(validate(attributeMap, { str: { equals: "abc" } }, [options])).not.toBeUndefined();
      expect(validate(attributeMap, { num: { equals: { value: 1 + attributeMap.num } } }, [options])).not.toBeUndefined();
    })
  })

  describe("greaterThan", () => {
    it("returns undefined on greaterThan", () => {
      expect(validate(attributeMap, { num: { greaterThan: { value: attributeMap.num - 1 } } }, [options])).toBeUndefined();
      expect(validate(attributeMap, { num: { greaterThan: attributeMap.num - 1 } }, [options])).toBeUndefined();
    })

    it("returns error on not greater than", () => {
      expect(validate(attributeMap, { num: { greaterThan: { value: attributeMap.num } } }, [options])).not.toBeUndefined();
      expect(validate(attributeMap, { num: { greaterThan: attributeMap.num } }, [options])).not.toBeUndefined();
    })
  })
});
