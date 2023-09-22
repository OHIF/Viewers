import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { LegacyButton, LegacyButtonGroup } from '@ohif/ui';

function ActionButtons({ onExportClick, onCreateReportClick }) {
  const { t } = useTranslation('MeasurementTable');

  return (
    <React.Fragment>
      <LegacyButtonGroup
        color="black"
        size="inherit"
      >
        {/* TODO Revisit design of LegacyButtonGroup later - for now use LegacyButton for its children.*/}
        <LegacyButton
          className="px-2 py-2 text-base"
          onClick={onExportClick}
        >
          {t('Export CSV')}
        </LegacyButton>
        <LegacyButton
          className="px-2 py-2 text-base"
          onClick={onCreateReportClick}
        >
          {t('Create Report')}
        </LegacyButton>
      </LegacyButtonGroup>
    </React.Fragment>
  );
}

ActionButtons.propTypes = {
  onExportClick: PropTypes.func,
  onCreateReportClick: PropTypes.func,
};

ActionButtons.defaultProps = {
  onExportClick: () => alert('Export'),
  onCreateReportClick: () => alert('Create Report'),
};

export default ActionButtons;
