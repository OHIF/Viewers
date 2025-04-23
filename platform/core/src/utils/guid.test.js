import guid from './guid';

describe('guid', () => {
  // Original test cases
  it('should always return a guid of size 36', () => {
    const result = guid();
    expect(result.length).toBe(36);
  });

  it('should always return a guid with five sequences', () => {
    const result = guid();
    expect(result.split('-').length).toBe(5);
  });

  it('should always return a guid with four dashes', () => {
    const result = guid();
    expect(result.split('-').length - 1).toBe(4);
  });

  it('should return the first sequence with length of eight', () => {
    const result = guid();
    expect(result.split('-')[0].length).toBe(8);
  });

  it('should return the second sequence with length of four', () => {
    const result = guid();
    expect(result.split('-')[1].length).toBe(4);
  });

  it('should return the third sequence with length of four', () => {
    const result = guid();
    expect(result.split('-')[2].length).toBe(4);
  });

  it('should return the fourth sequence with length of four', () => {
    const result = guid();
    expect(result.split('-')[3].length).toBe(4);
  });

  it('should return the last sequence with length of twelve', () => {
    const result = guid();
    expect(result.split('-')[4].length).toBe(12);
  });

  // Additional test cases for the new implementation
  it('should generate a valid GUID format', () => {
    const result = guid();
    // GUID format: 8-4-4-4-12 characters
    expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('should generate unique GUIDs', () => {
    const guids = new Set();
    for (let i = 0; i < 1000; i++) {
      guids.add(guid());
    }
    expect(guids.size).toBe(1000);
  });

  it('should generate different GUIDs on each call', () => {
    const guid1 = guid();
    const guid2 = guid();
    expect(guid1).not.toBe(guid2);
  });

  it('should generate GUIDs with valid hex characters only', () => {
    const result = guid();
    expect(result).toMatch(/^[0-9a-f-]+$/);
  });

  it('should maintain consistent format across multiple generations', () => {
    for (let i = 0; i < 100; i++) {
      const result = guid();
      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    }
  });
});
