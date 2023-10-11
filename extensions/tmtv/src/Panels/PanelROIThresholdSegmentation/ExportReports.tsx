import React from 'react';
import { LegacyButton, LegacyButtonGroup } from '@ohif/ui';
import { useTranslation } from 'react-i18next';

function ExportReports({ segmentations, tmtvValue, config, commandsManager }) {
  const { t } = useTranslation('PanelSUVExport');

  return (
    <>
      {segmentations?.length ? (
        <div className="mt-4 flex justify-center space-x-2">
          {/* TODO Revisit design of LegacyButtonGroup later - for now use LegacyButton for its children.*/}
          <LegacyButtonGroup
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
          </LegacyButtonGroup>
          <LegacyButtonGroup
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
          </LegacyButtonGroup>
        </div>
      ) : null}
    </>
  );
}

export default ExportReports;
