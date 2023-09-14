import React from 'react';
import { LegacyButton, ButtonGroup } from '@ohif/ui';
import { useTranslation } from 'react-i18next';

function ExportReports({ segmentations, tmtvValue, config, commandsManager }) {
  const { t } = useTranslation('PanelSUVExport');

  return (
    <>
      {segmentations?.length ? (
        <div className="mt-4 flex justify-center space-x-2">
          {/* TODO Revisit design of ButtonGroup later - for now use LegacyButton for its children.*/}
          <ButtonGroup
            color="black"
            size="inherit"
          >
            <LegacyButton
              className="px-2 py-2 text-base"
              disabled={tmtvValue === null}
              onClick={() => {
                commandsManager.runCommand('exportTMTVReportCSV', {
                  segmentations,
                  tmtv: tmtvValue,
                  config,
                });
              }}
            >
              {t('Export CSV')}
            </LegacyButton>
          </ButtonGroup>
          <ButtonGroup
            color="black"
            size="inherit"
          >
            <LegacyButton
              className="px-2 py-2 text-base"
              onClick={() => {
                commandsManager.runCommand('createTMTVRTReport');
              }}
              disabled={tmtvValue === null}
            >
              {t('Create RT Report')}
            </LegacyButton>
          </ButtonGroup>
        </div>
      ) : null}
    </>
  );
}

export default ExportReports;
