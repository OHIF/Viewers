import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { PanelSection, Input, Button } from '@ohif/ui';
import { DicomMetadataStore } from '@ohif/core';
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
export default function PanelPetSUV({ servicesManager, commandsManager }: withAppTypes) {
  const { t } = useTranslation('PanelSUV');
  const { displaySetService, toolGroupService, toolbarService, hangingProtocolService } =
    servicesManager.services;
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

    // metadata should be dcmjs naturalized
    DicomMetadataStore.updateMetadataForSeries(
      ptDisplaySet.StudyInstanceUID,
      ptDisplaySet.SeriesInstanceUID,
      metadata
    );

    // update the displaySets
    displaySetService.setDisplaySetMetadataInvalidated(ptDisplaySet.displaySetInstanceUID);

    // Crosshair position depends on the metadata values such as the positioning interaction
    // between series, so when the metadata is updated, the crosshairs need to be reset.
    setTimeout(() => {
      commandsManager.runCommand('resetCrosshairs');
    }, 0);
  }
  return (
    <div className="ohif-scrollbar flex min-h-0 flex-auto select-none flex-col justify-between overflow-auto">
      <div className="flex min-h-0 flex-1 flex-col bg-black text-[13px] font-[300]">
        <PanelSection title={t('Patient Information')}>
          <div className="flex flex-col">
            <div className="bg-primary-dark flex flex-col gap-4 p-2">
              <Input
                containerClassName={'!flex-row !justify-between items-center'}
                label={t('Patient Sex')}
                labelClassName="text-[13px] font-inter text-white"
                className="!m-0 !h-[26px] !w-[117px]"
                value={metadata.PatientSex || ''}
                onChange={e => {
                  handleMetadataChange({
                    PatientSex: e.target.value,
                  });
                }}
              />
              <Input
                containerClassName={'!flex-row !justify-between items-center'}
                label={t('Weight')}
                labelChildren={<span className="text-aqua-pale"> kg</span>}
                labelClassName="text-[13px] font-inter text-white"
                className="!m-0 !h-[26px] !w-[117px]"
                value={metadata.PatientWeight || ''}
                onChange={e => {
                  handleMetadataChange({
                    PatientWeight: e.target.value,
                  });
                }}
                id="weight-input"
              />
              <Input
                containerClassName={'!flex-row !justify-between items-center'}
                label={t('Total Dose')}
                labelChildren={<span className="text-aqua-pale"> bq</span>}
                labelClassName="text-[13px] font-inter text-white"
                className="!m-0 !h-[26px] !w-[117px]"
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
                containerClassName={'!flex-row !justify-between items-center'}
                label={t('Half Life')}
                labelChildren={<span className="text-aqua-pale"> s</span>}
                labelClassName="text-[13px] font-inter text-white"
                className="!m-0 !h-[26px] !w-[117px]"
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
                containerClassName={'!flex-row !justify-between items-center'}
                label={t('Injection Time')}
                labelChildren={<span className="text-aqua-pale"> s</span>}
                labelClassName="text-[13px] font-inter text-white"
                className="!m-0 !h-[26px] !w-[117px]"
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
                containerClassName={'!flex-row !justify-between items-center'}
                label={t('Acquisition Time')}
                labelChildren={<span className="text-aqua-pale"> s</span>}
                labelClassName="text-[13px] font-inter text-white"
                className="!m-0 !h-[26px] !w-[117px]"
                value={metadata.SeriesTime || ''}
                onChange={() => {}}
              />
              <Button
                className="!h-[26px] !w-[115px] self-end !p-0"
                onClick={updateMetadata}
              >
                Reload Data
              </Button>
            </div>
          </div>
        </PanelSection>
      </div>
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
