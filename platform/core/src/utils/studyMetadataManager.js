import { TypeSafeCollection } from '../classes/TypeSafeCollection';

const studyMetadataList = new TypeSafeCollection();

function add(studyMetadata) {
  studyMetadataList.insert(studyMetadata);
}

function get(studyInstanceUID) {
  return studyMetadataList.findBy({ studyInstanceUID });
}

/** Given a study instance UID and a sop UID, finds the metadata */
function getInstance(studyInstanceUID, sopInstanceUID) {
  if (!studyInstanceUID || !sopInstanceUID) return;
  const studyMetadata = get(studyInstanceUID);
  if (!studyMetadata) return;
  return studyMetadata.getInstance(sopInstanceUID);
}

function all(options) {
  return studyMetadataList.all(options);
}

function remove(studyInstanceUID) {
  studyMetadataList.remove({ studyInstanceUID });
}

function purge() {
  studyMetadataList.removeAll();
}

export default {
  add,
  get,
  getInstance,
  all,
  remove,
  purge,
};
