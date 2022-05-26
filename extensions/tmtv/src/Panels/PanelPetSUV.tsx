import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Input, Button } from '@ohif/ui';
import { classes, DicomMetadataStore } from '@ohif/core';
import { useTranslation } from 'react-i18next';

const metadataProvider = classes.MetadataProvider;

const DEFAULT_MEATADATA = {
  PatientWeight: null,
  PatientSex: null,
  SeriesTime: null,
  RadiopharmaceuticalInformationSequence: {
    RadionuclideTotalDose: null,
    RadionuclideHalfLife: null,
    RadiopharmaceuticalStartTime: null,
  },
};

/*
 * PETSUV panel enables the user to modify the patient related information, such as
 * patient sex, patientWeight. This is allowed since
 * sometimes these metadata are missing or wrong. By changing them
 * @param param0
 * @returns
 */
export default function PanelPetSUV({ servicesManager, extensionManager }) {
  const { t } = useTranslation('PanelSUV');
  const {
    DisplaySetService,
    HangingProtocolService,
  } = servicesManager.services;
  const dataSource = extensionManager.getDataSources()[0];
  const [metadata, setMetadata] = useState(DEFAULT_MEATADATA);
  const [ptDisplaySet, setPtDisplaySet] = useState(null);

  const handleMetadataChange = useCallback(
    metadata => {
      setMetadata(prevState => {
        const newState = { ...prevState };
        Object.keys(metadata).forEach(key => {
          if (typeof metadata[key] === 'object') {
            newState[key] = { ...prevState[key], ...metadata[key] };
          } else {
            newState[key] = metadata[key];
          }
        });
        return newState;
      });
    },
    [metadata]
  );

  const getMatchingPTDisplaySet = useCallback(() => {
    const matches = HangingProtocolService.getDisplaySetsMatchDetails();

    const ptDisplaySet = _getMatchedPtDisplaySet(matches, DisplaySetService);

    if (!ptDisplaySet) {
      return;
    }

    const metadata = _getPtMetadata(dataSource, ptDisplaySet);
    return {
      ptDisplaySet,
      metadata,
    };
  }, [dataSource, DisplaySetService, HangingProtocolService]);

  useEffect(() => {
    const displaySets = DisplaySetService.activeDisplaySets;

    if (!displaySets.length) {
      return;
    }

    const { ptDisplaySet, metadata } = getMatchingPTDisplaySet();
    setPtDisplaySet(ptDisplaySet);
    setMetadata(metadata);
  }, []);

  // get the patientMetadata from the StudyInstanceUIDs and update the state
  useEffect(() => {
    const { unsubscribe } = DisplaySetService.subscribe(
      DisplaySetService.EVENTS.DISPLAY_SETS_ADDED,
      () => {
        const { ptDisplaySet, metadata } = getMatchingPTDisplaySet();
        setPtDisplaySet(ptDisplaySet);
        setMetadata(metadata);
      }
    );
    return () => {
      unsubscribe();
    };
  }, []);

  function updateMetadata() {
    if (!ptDisplaySet) {
      throw new Error('No ptDisplaySet found');
    }
    // metadata should be dcmjs naturalized
    DicomMetadataStore.updateMetadataForSeries(
      ptDisplaySet.StudyInstanceUID,
      ptDisplaySet.SeriesInstanceUID,
      metadata
    );

    // update the displaySets
    DisplaySetService.setDisplaySetMetadataInvalidated(
      ptDisplaySet.displaySetInstanceUID
    );
  }

  return (
    <div className="overflow-x-hidden overflow-y-auto invisible-scrollbar">
      {
        <div className="flex flex-col">
          <div className="flex flex-col p-4 space-y-2 bg-primary-dark">
            <Input
              label={t('Patient Sex')}
              labelClassName="text-white"
              className="mt-1 mb-2 bg-black border-primary-main"
              type="text"
              containerClassName="mr-2"
              value={metadata.PatientSex}
              onChange={e => {
                handleMetadataChange({ PatientSex: e.target.value });
              }}
            />
            <Input
              label={t('Patient Weight')}
              labelClassName="text-white"
              className="mt-1 mb-2 bg-black border-primary-main"
              type="text"
              containerClassName="mr-2"
              value={metadata.PatientWeight}
              onChange={e => {
                handleMetadataChange({ PatientWeight: e.target.value });
              }}
            />
            <Input
              label={t('Total Dose')}
              labelClassName="text-white"
              className="mt-1 mb-2 bg-black border-primary-main"
              type="text"
              containerClassName="mr-2"
              value={
                metadata.RadiopharmaceuticalInformationSequence
                  .RadionuclideTotalDose
              }
              onChange={e => {
                handleMetadataChange({
                  RadiopharmaceuticalInformationSequence: {
                    RadionuclideTotalDose: e.target.value,
                  },
                });
              }}
            />
            <Input
              label={t('Half Life')}
              labelClassName="text-white"
              className="mt-1 mb-2 bg-black border-primary-main"
              type="text"
              containerClassName="mr-2"
              value={
                metadata.RadiopharmaceuticalInformationSequence
                  .RadionuclideHalfLife
              }
              onChange={e => {
                handleMetadataChange({
                  RadiopharmaceuticalInformationSequence: {
                    RadionuclideHalfLife: e.target.value,
                  },
                });
              }}
            />
            <Input
              label={t('Injection Time')}
              labelClassName="text-white"
              className="mt-1 mb-2 bg-black border-primary-main"
              type="text"
              containerClassName="mr-2"
              value={
                metadata.RadiopharmaceuticalInformationSequence
                  .RadiopharmaceuticalStartTime
              }
              onChange={e => {
                handleMetadataChange({
                  RadiopharmaceuticalInformationSequence: {
                    RadiopharmaceuticalStartTime: e.target.value,
                  },
                });
              }}
            />
            <Input
              label={t('Acquisition Time')}
              labelClassName="text-white"
              className="mt-1 mb-2 bg-black border-primary-main"
              type="text"
              containerClassName="mr-2"
              value={metadata.SeriesTime}
              onChange={() => {}}
            />
          </div>
          <Button
            color="primary"
            onClick={updateMetadata}
            className="px-1 py-1 mx-4 mt-2 text-xs text-white border-b border-transparent"
          >
            Reload Data
          </Button>
        </div>
      }
    </div>
  );
}

PanelPetSUV.propTypes = {
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      MeasurementService: PropTypes.shape({
        getMeasurements: PropTypes.func.isRequired,
        subscribe: PropTypes.func.isRequired,
        EVENTS: PropTypes.object.isRequired,
        VALUE_TYPES: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

function _getMatchedPtDisplaySet(
  hangingProtocolDisplaySetMatches,
  DisplaySetService
) {
  const matchedSeriesInstanceUIDs = Array.from(
    hangingProtocolDisplaySetMatches.values()
  ).map(({ SeriesInstanceUID }) => SeriesInstanceUID);

  for (const SeriesInstanceUID of matchedSeriesInstanceUIDs) {
    const displaySets = DisplaySetService.getDisplaySetsForSeries(
      SeriesInstanceUID
    );

    if (!displaySets || displaySets.length === 0) {
      continue;
    }

    const displaySet = displaySets[0];
    if (displaySet.Modality !== 'PT') {
      continue;
    }

    return displaySet;
  }
}

function _getPtMetadata(dataSource, displaySet) {
  const imageIds = dataSource.getImageIdsForDisplaySet(displaySet);

  const firstImageId = imageIds[0];
  const SeriesTime = metadataProvider.get('SeriesTime', firstImageId);
  const metadata = {};

  if (SeriesTime) {
    metadata.SeriesTime = SeriesTime;
  }

  // get metadata from the first image
  const seriesModule = metadataProvider.get(
    'generalSeriesModule',
    firstImageId
  );

  if (seriesModule && seriesModule.modality !== 'PT') {
    return;
  }

  // get metadata from the first image
  const demographic = metadataProvider.get(
    'patientDemographicModule',
    firstImageId
  );

  if (demographic) {
    // naturalized dcmjs version
    metadata.PatientSex = demographic.patientSex;
  }

  // patientStudyModule
  const studyModule = metadataProvider.get('patientStudyModule', firstImageId);

  if (studyModule) {
    // naturalized dcmjs version
    metadata.PatientWeight = studyModule.patientWeight;
  }

  // total dose
  const petSequenceModule = metadataProvider.get(
    'petIsotopeModule',
    firstImageId
  );
  const { radiopharmaceuticalInfo } = petSequenceModule;

  const {
    radionuclideHalfLife,
    radionuclideTotalDose,
    radiopharmaceuticalStartTime,
  } = radiopharmaceuticalInfo;

  const {
    hours,
    minutes,
    seconds,
    fractionalSeconds,
  } = radiopharmaceuticalStartTime;

  // pad number with leading zero if less than 10
  const hoursString = hours < 10 ? `0${hours}` : hours;
  const minutesString = minutes < 10 ? `0${minutes}` : minutes;
  const secondsString = seconds < 10 ? `0${seconds}` : seconds;

  if (radiopharmaceuticalInfo) {
    metadata.RadiopharmaceuticalInformationSequence = {
      RadionuclideTotalDose: radionuclideTotalDose,
      RadionuclideHalfLife: radionuclideHalfLife,
      RadiopharmaceuticalStartTime: `${hoursString}${minutesString}${secondsString}.${fractionalSeconds}`,
    };
  }

  return metadata;
}
