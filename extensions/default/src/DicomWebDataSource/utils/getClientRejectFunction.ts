import dcm4cheeReject from './dcm4cheeReject';
export default function getClientRejectFunction(client) {
  return dcm4cheeReject(client.wadoRoot);
}
