import OHIF from '@ohif/core';

const { WADO } = OHIF.studies.services;

const retrieveDicomWebMetadata = async (
  commandsManager,
  rootUrl,
  dicomWebParameters
) => {
  const dwUrlRoot = `${rootUrl}xapi/viewer`;
  const dicomWebStudies = [];

  for (const params of dicomWebParameters) {
    const wadoRoot = `${dwUrlRoot}/projects/${params.projectId}/experiments/${params.experimentId}`;
    const server = {
      enableStudyLazyLoad: false,
      wadoRoot,
      imageRendering: 'wadors',
      thumbnailRendering: 'wadors',
    };

    try {
      const studyMetadata = await WADO.RetrieveMetadataFromXnat(
        server,
        params.StudyInstanceUID
      );

      studyMetadata.isDicomWeb = true;
      studyMetadata.StudyDescription =
        params.experimentLabel || params.experimentId;
      studyMetadata.series.forEach(series => {
        const srcMetadata = [];
        series.instances.forEach(instance => {
          instance.url = '';
          srcMetadata.push(instance.srcMetadata);
        });
        series.srcMetadata = srcMetadata;
      });

      dicomWebStudies.push(studyMetadata);

      commandsManager.runCommand('xnatSetSession', {
        json: { studies: [studyMetadata] },
        sessionVariables: {
          experimentId: params.experimentId,
          experimentLabel: params.experimentLabel,
          subjectId: params.subjectId,
          projectId: params.projectId,
          parentProjectId: params.parentProjectId,
        },
      });
    } catch (e) {
      throw e;
    }
  }

  return dicomWebStudies;
};

export default retrieveDicomWebMetadata;
