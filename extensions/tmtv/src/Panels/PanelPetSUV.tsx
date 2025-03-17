import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { DicomMetadataStore } from '@ohif/core';
import { useTranslation } from 'react-i18next';
import { Button, Input, Label, PanelSection, Separator } from '@ohif/ui-next';

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

// Local component for input row pattern
const InputRow = ({ label, unit, value, onChange, id }) => (
  <div className="flex flex-row items-center space-x-4">
    <Label className="min-w-32 flex-shrink-0">
      {label}
      {unit && <span className="text-muted-foreground"> {unit}</span>}
    </Label>
    <Input
      className="h-7 flex-1"
      value={value || ''}
      onChange={onChange}
      id={id}
    />
  </div>
);

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
    <>
      <div className="ohif-scrollbar flex min-h-0 flex-auto select-none flex-col justify-between overflow-auto">
        <div className="flex min-h-0 flex-1 flex-col bg-black text-base">
          <PanelSection defaultOpen={true}>
            <PanelSection.Header>{t('Patient Information')}</PanelSection.Header>
            <PanelSection.Content>
              <div className="bg-primary-dark flex flex-col gap-3 p-2">
                <InputRow
                  label={t('Patient Sex')}
                  value={metadata.PatientSex}
                  onChange={e => {
                    handleMetadataChange({
                      PatientSex: e.target.value,
                    });
                  }}
                />

                <InputRow
                  label={t('Weight')}
                  unit="kg"
                  value={metadata.PatientWeight}
                  onChange={e => {
                    handleMetadataChange({
                      PatientWeight: e.target.value,
                    });
                  }}
                  id="weight-input"
                />

                <InputRow
                  label={t('Total Dose')}
                  unit="bq"
                  value={metadata.RadiopharmaceuticalInformationSequence.RadionuclideTotalDose}
                  onChange={e => {
                    handleMetadataChange({
                      RadiopharmaceuticalInformationSequence: {
                        RadionuclideTotalDose: e.target.value,
                      },
                    });
                  }}
                />

                <InputRow
                  label={t('Half Life')}
                  unit="s"
                  value={metadata.RadiopharmaceuticalInformationSequence.RadionuclideHalfLife}
                  onChange={e => {
                    handleMetadataChange({
                      RadiopharmaceuticalInformationSequence: {
                        RadionuclideHalfLife: e.target.value,
                      },
                    });
                  }}
                />

                <InputRow
                  label={t('Injection Time')}
                  unit="s"
                  value={
                    metadata.RadiopharmaceuticalInformationSequence.RadiopharmaceuticalStartTime
                  }
                  onChange={e => {
                    handleMetadataChange({
                      RadiopharmaceuticalInformationSequence: {
                        RadiopharmaceuticalStartTime: e.target.value,
                      },
                    });
                  }}
                />

                <InputRow
                  label={t('Acquisition Time')}
                  unit="s"
                  value={metadata.SeriesTime}
                  onChange={() => {}}
                />

                <Button
                  variant="default"
                  size="sm"
                  className="w-28 self-end"
                  onClick={updateMetadata}
                >
                  Reload Data
                </Button>
              </div>
            </PanelSection.Content>
          </PanelSection>
        </div>
      </div>
    </>
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
