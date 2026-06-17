import dental2x2Protocol from './hangingProtocols/dental2x2';

function getHangingProtocolModule() {
  return [
    {
      name: dental2x2Protocol.id,
      protocol: dental2x2Protocol,
    },
  ];
}

export default getHangingProtocolModule;
