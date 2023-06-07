import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { Button, ButtonSize, ButtonType } from '@ohif/ui';

function ActionButtons({ onExportClick, onCreateReportClick, disabled }) {
  const { t } = useTranslation('MeasurementTable');

  return (
    <React.Fragment>
      <Button
        onClick={onExportClick}
        disabled={disabled}
        type={ButtonType.secondary}
        size={ButtonSize.small}
      >
        {t('Export')}
      </Button>
      <Button
        className="ml-2"
        onClick={onCreateReportClick}
        type={ButtonType.secondary}
        size={ButtonSize.small}
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
