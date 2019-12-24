import getWADORSImageId from './getWADORSImageId';

describe('getWADORSImageId', () => {
  it('should always return undefined if the instance has no `wadorsuri` property', () => {
    const frame = '42';
    const instance = {};

    expect(getWADORSImageId(instance)).toBeUndefined();
    expect(getWADORSImageId(instance, frame)).toBeUndefined();
  });

  it('should always prepend the `wadorsuri` with `wadors:`', () => {
    const frame = '42';
    const instance = {
      wadorsuri: 'wadorsuri',
    };

    expect(getWADORSImageId(instance)).toEqual('wadors:wadorsuri');
    expect(getWADORSImageId(instance, frame)).toEqual('wadors:wadorsuri');
  });

  describe('with no frame provided', () => {
    it('should replace `frames/:number` with `frames/1`', () => {
      const instance = {
        wadorsuri: 'frames/42',
      };

      expect(getWADORSImageId(instance)).toEqual('wadors:frames/1');
    });

    it('should work on a real wadorsuri', () => {
      const instance = {
        wadorsuri:
          'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs/studies/1.3.6.1.4.1.25403.52237031786.3872.20100510032220.1/series/1.3.6.1.4.1.25403.52237031786.3872.20100510032220.2/instances/1.3.6.1.4.1.25403.52237031786.3872.20100510032220.8/frames/22',
      };

      expect(getWADORSImageId(instance)).toEqual(
        'wadors:https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs/studies/1.3.6.1.4.1.25403.52237031786.3872.20100510032220.1/series/1.3.6.1.4.1.25403.52237031786.3872.20100510032220.2/instances/1.3.6.1.4.1.25403.52237031786.3872.20100510032220.8/frames/1'
      );
    });
  });

  describe('with a frame provided', () => {
    it('should replace `frames/:number` with the argument frame plus one', () => {
      const frame = '42';
      const instance = {
        wadorsuri: 'frames/1',
      };

      expect(getWADORSImageId(instance, frame)).toEqual('wadors:frames/43');
    });

    it('should work on a real wadorsuri', () => {
      const frame = '42';
      const instance = {
        wadorsuri:
          'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs/studies/1.3.6.1.4.1.25403.52237031786.3872.20100510032220.1/series/1.3.6.1.4.1.25403.52237031786.3872.20100510032220.2/instances/1.3.6.1.4.1.25403.52237031786.3872.20100510032220.8/frames/22',
      };

      expect(getWADORSImageId(instance, frame)).toEqual(
        'wadors:https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs/studies/1.3.6.1.4.1.25403.52237031786.3872.20100510032220.1/series/1.3.6.1.4.1.25403.52237031786.3872.20100510032220.2/instances/1.3.6.1.4.1.25403.52237031786.3872.20100510032220.8/frames/43'
      );
    });
  });
});
