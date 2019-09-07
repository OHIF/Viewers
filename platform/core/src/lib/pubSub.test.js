import { makePubSub, isPubSub } from './pubSub';

describe('pubSub.js', function() {
  describe('makePubSub', function() {
    it('should make a regular object support the pub/sub interface', function() {
      const NAME = 'My Object';
      const DESCRIPTION = 'A regular JavaScript object...';
      const myObj = makePubSub({
        name: NAME,
        description: DESCRIPTION,
      });
      expect(myObj).toBeInstanceOf(Object);
      expect(myObj.name).toBe(NAME);
      expect(myObj.description).toBe(DESCRIPTION);
      expect(myObj.subscribe).toBeInstanceOf(Function);
      expect(myObj.unsubscribe).toBeInstanceOf(Function);
      expect(myObj.publish).toBeInstanceOf(Function);
      // make sure only user properties are returned when looking for own keys
      const keys = Object.keys(myObj);
      expect(keys.length).toBe(2);
      expect(keys).toContain('name');
      expect(keys).toContain('description');
    });

    it('should support subscription to topics', function() {
      const source = makePubSub({ name: 'source' });
      const handler = jest.fn();
      const data = { name: 'data' };
      source.subscribe('topic', handler);
      source.publish('topic', data);
      expect(handler.mock.calls.length).toBe(1);
      expect(handler.mock.calls[0]).toEqual([data, source, 'topic']);
    });

    it('should support publishing data to topics', function() {
      const source = makePubSub({ name: 'source' });
      const handler = jest.fn();
      const a = { name: 'a' };
      const b = { name: 'b' };
      source.subscribe('topic.a', handler);
      source.subscribe('topic.b', handler);
      source.publish('topic.a', a);
      source.publish('topic.a', b);
      source.publish('topic.b', a);
      source.publish('topic.b', b);
      // and finally check the result
      expect(handler.mock.calls.length).toBe(4);
      expect(handler.mock.calls[0]).toEqual([a, source, 'topic.a']);
      expect(handler.mock.calls[1]).toEqual([b, source, 'topic.a']);
      expect(handler.mock.calls[2]).toEqual([a, source, 'topic.b']);
      expect(handler.mock.calls[3]).toEqual([b, source, 'topic.b']);
    });

    it('should support subscription to the same topics more than once', function() {
      const source = makePubSub({ name: 'source' });
      const handler = jest.fn();
      const a = { name: 'a' };
      const b = { name: 'b' };
      // subscribe to topic A twice...
      source.subscribe('topic.a', handler);
      source.subscribe('topic.a', handler);
      // ... then subscribe to topic B
      source.subscribe('topic.b', handler);
      // now publish data to topics B and A
      source.publish('topic.a', a);
      source.publish('topic.b', b);
      // and finally check the result
      expect(handler.mock.calls.length).toBe(3);
      expect(handler.mock.calls[0]).toEqual([a, source, 'topic.a']);
      expect(handler.mock.calls[1]).toEqual([a, source, 'topic.a']);
      expect(handler.mock.calls[2]).toEqual([b, source, 'topic.b']);
    });

    it('should support unsubscription from topics', function() {
      const source = makePubSub({ name: 'source' });
      const handler = jest.fn();
      source.subscribe('topic', handler);
      source.publish('topic', { name: 'A' });
      source.publish('topic', { name: 'B' });
      source.unsubscribe('topic', handler);
      source.publish('topic', { name: 'C' });
      expect(handler.mock.calls.length).toBe(2);
      expect(handler.mock.calls[0]).toEqual([{ name: 'A' }, source, 'topic']);
      expect(handler.mock.calls[1]).toEqual([{ name: 'B' }, source, 'topic']);
    });
  });

  describe('isPubSub', function() {
    it('should check if an object implements the pub/sub interface', function() {
      const myRegularObj = {};
      const myPubSubObj = makePubSub({});
      expect(myRegularObj).toBeInstanceOf(Object);
      expect(myPubSubObj).toBeInstanceOf(Object);
      expect(isPubSub(myRegularObj)).toBe(false);
      expect(isPubSub(myPubSubObj)).toBe(true);
    });
  });
});
