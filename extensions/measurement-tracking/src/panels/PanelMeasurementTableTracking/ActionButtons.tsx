import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { Button, ButtonGroup } from '@ohif/ui';

function ActionButtons({ onExportClick, onCreateReportClick }) {
  const { t } = useTranslation('MeasurementTable');

  return (
    <React.Fragment>
      <Button
        className="text-base px-2 py-2"
        size="initial"
        variant="outlined"
        color="default"
        border="secondary"
        onClick={onExportClick}
      >
        {t('Export')}
      </Button>
      <Button
        className="ml-2 px-2 text-base"
        variant="outlined"
        size="initial"
        color="black"
        border="secondary"
        onClick={onCreateReportClick}
      >
        {t('Create Report')}
      </Button>
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
