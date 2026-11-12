async function getStudiesForPatientByMRN(dataSource, qidoForStudyUID) {
  if (!qidoForStudyUID?.length) {
    return [];
  }

  const mrn = qidoForStudyUID[0].mrn;

  // if not defined or empty, return the original qidoForStudyUID
  if (!mrn) {
    return qidoForStudyUID;
  }

  return dataSource.query.studies.search({
    patientId: mrn,
    disableWildcard: true,
  });
}

export default getStudiesForPatientByMRN;
