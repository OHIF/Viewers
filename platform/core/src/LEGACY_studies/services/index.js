// DICOMWeb instance, study, and metadata retrieval
import Instances from './qido/instances.js';
import Studies from './qido/studies.js';
import RetrieveMetadata from './wado/retrieveMetadata.js';

const WADO = {
  RetrieveMetadata,
};

const QIDO = {
  Studies,
  Instances,
};

export { QIDO, WADO };
