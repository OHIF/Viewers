import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Input, Button } from '@ohif/ui';
import { DicomMetadataStore, ServicesManager } from '@ohif/core';
import { useTranslation } from 'react-i18next';

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
export default function PanelPetSUV({ servicesManager, commandsManager }) {
  const { t } = useTranslation('PanelSUV');
  const { displaySetService, toolGroupService, toolbarService, hangingProtocolService } = (
    servicesManager as ServicesManager
  ).services;
  const [metadata, setMetadata] = useState(DEFAULT_MEATADATA);
  const [ptDisplaySet, setPtDisplaySet] = useState(null);

  const handleMetadataChange = metadata => {
    setMetadata(prevState => {
      const newState = { ...prevState };
      Object.keys(metadata).forEach(key => {
        if (typeof metadata[key] === 'object') {
          newState[key] = {
            ...prevState[key],
            ...metadata[key],
          };
        } else {
          newState[key] = metadata[key];
        }
      });
      return newState;
    });
  };

  const getMatchingPTDisplaySet = viewportMatchDetails => {
    const ptDisplaySet = commandsManager.runCommand('getMatchingPTDisplaySet', {
      viewportMatchDetails,
    });

    if (!ptDisplaySet) {
      return;
    }

    const metadata = commandsManager.runCommand('getPTMetadata', {
      ptDisplaySet,
    });

    return {
      ptDisplaySet,
      metadata,
    };
  };

  useEffect(() => {
    const displaySets = displaySetService.getActiveDisplaySets();
    const { viewportMatchDetails } = hangingProtocolService.getMatchDetails();
    if (!displaySets.length) {
      return;
    }

    const displaySetInfo = getMatchingPTDisplaySet(viewportMatchDetails);

    if (!displaySetInfo) {
      return;
    }

    const { ptDisplaySet, metadata } = displaySetInfo;
    setPtDisplaySet(ptDisplaySet);
    setMetadata(metadata);
  }, []);

  // get the patientMetadata from the StudyInstanceUIDs and update the state
  useEffect(() => {
    const { unsubscribe } = hangingProtocolService.subscribe(
      hangingProtocolService.EVENTS.PROTOCOL_CHANGED,
      ({ viewportMatchDetails }) => {
        const displaySetInfo = getMatchingPTDisplaySet(viewportMatchDetails);

        if (!displaySetInfo) {
          return;
        }
        const { ptDisplaySet, metadata } = displaySetInfo;
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

    const toolGroupIds = toolGroupService.getToolGroupIds();

    // Todo: we don't have a proper way to perform a toggle command and update the
    // state for the toolbar, so here, we manually toggle the toolbar

    // Todo: Crosshairs have bugs for the camera reset currently, so we need to
    // force turn it off before we update the metadata
    toolGroupIds.forEach(toolGroupId => {
      commandsManager.runCommand('toggleCrosshairs', {
        toolGroupId,
        toggledState: false,
      });
    });

    toolbarService.state.toggles['Crosshairs'] = false;
    toolbarService._broadcastEvent(toolbarService.EVENTS.TOOL_BAR_STATE_MODIFIED);

    // metadata should be dcmjs naturalized
    DicomMetadataStore.updateMetadataForSeries(
      ptDisplaySet.StudyInstanceUID,
      ptDisplaySet.SeriesInstanceUID,
      metadata
    );

    // update the displaySets
    displaySetService.setDisplaySetMetadataInvalidated(ptDisplaySet.displaySetInstanceUID);
  }
  return (
    <div className="invisible-scrollbar overflow-y-auto overflow-x-hidden">
      {
        <div className="flex flex-col">
          <div className="bg-primary-dark flex flex-col space-y-4 p-4">
            <Input
              label={t('Patient Sex')}
              labelClassName="text-white mb-2"
              className="mt-1"
              value={metadata.PatientSex || ''}
              onChange={e => {
                handleMetadataChange({
                  PatientSex: e.target.value,
                });
              }}
            />
            <Input
              label={t('Patient Weight (kg)')}
              labelClassName="text-white mb-2"
              className="mt-1"
              value={metadata.PatientWeight || ''}
              onChange={e => {
                handleMetadataChange({
                  PatientWeight: e.target.value,
                });
              }}
            />
            <Input
              label={t('Total Dose (bq)')}
              labelClassName="text-white mb-2"
              className="mt-1"
              value={metadata.RadiopharmaceuticalInformationSequence.RadionuclideTotalDose || ''}
              onChange={e => {
                handleMetadataChange({
                  RadiopharmaceuticalInformationSequence: {
                    RadionuclideTotalDose: e.target.value,
                  },
                });
              }}
            />
            <Input
              label={t('Half Life (s)')}
              labelClassName="text-white mb-2"
              className="mt-1"
              value={metadata.RadiopharmaceuticalInformationSequence.RadionuclideHalfLife || ''}
              onChange={e => {
                handleMetadataChange({
                  RadiopharmaceuticalInformationSequence: {
                    RadionuclideHalfLife: e.target.value,
                  },
                });
              }}
            />
            <Input
              label={t('Injection Time (s)')}
              labelClassName="text-white mb-2"
              className="mt-1"
              value={
                metadata.RadiopharmaceuticalInformationSequence.RadiopharmaceuticalStartTime || ''
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
              label={t('Acquisition Time (s)')}
              labelClassName="text-white mb-2"
              className="mt-1 mb-2"
              value={metadata.SeriesTime || ''}
              onChange={() => {}}
            />
            <Button onClick={updateMetadata}>Reload Data</Button>
          </div>
        </div>
      }
    </div>
  );
}

PanelPetSUV.propTypes = {
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      measurementService: PropTypes.shape({
        getMeasurements: PropTypes.func.isRequired,
        subscribe: PropTypes.func.isRequired,
        EVENTS: PropTypes.object.isRequired,
        VALUE_TYPES: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};
