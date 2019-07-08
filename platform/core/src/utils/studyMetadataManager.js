import { TypeSafeCollection } from '../classes/TypeSafeCollection';

const studyMetadataList = new TypeSafeCollection();

function add(studyMetadata) {
  studyMetadataList.insert(studyMetadata);
}

function get(studyInstanceUID) {
  return studyMetadataList.findBy({ studyInstanceUID });
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
  all,
  remove,
  purge,
};
