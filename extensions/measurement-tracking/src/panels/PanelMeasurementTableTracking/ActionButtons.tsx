import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { Button, ButtonGroup } from '@ohif/ui';

function ActionButtons({ onExportClick, onCreateReportClick, disabled }) {
  const { t } = useTranslation('MeasurementTable');

  return (
    <React.Fragment>
      <Button
        className="text-base px-2 py-2"
        size="initial"
        variant={disabled ? 'disabled' : 'outlined'}
        color="black"
        border="primaryActive"
        onClick={onExportClick}
        disabled={disabled}
      >
        {t('Export')}
      </Button>
      <Button
        className="ml-2 px-2 text-base"
        variant={disabled ? 'disabled' : 'outlined'}
        size="initial"
        color="black"
        border="primaryActive"
        onClick={onCreateReportClick}
        disabled={disabled}
      >
        {t('Create Report')}
      </Button>
    </React.Fragment>
  );
}

ActionButtons.propTypes = {
  onExportClick: PropTypes.func,
  onCreateReportClick: PropTypes.func,
  disabled: PropTypes.bool,
};

ActionButtons.defaultProps = {
  onExportClick: () => alert('Export'),
  onCreateReportClick: () => alert('Create Report'),
  disabled: false,
};

export default ActionButtons;
