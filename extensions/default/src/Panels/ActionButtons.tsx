import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { Button, ButtonGroup } from '@ohif/ui';

function ActionButtons({ onExportClick, onCreateReportClick }) {
  const { t } = useTranslation('MeasurementTable');

  return (
    <React.Fragment>
      <ButtonGroup color="black" size="inherit">
        <Button className="px-2 py-2 text-base" onClick={onExportClick}>
          {t('Export CSV')}
        </Button>
      </ButtonGroup>
      {/* <Button
        className="ml-2 text-base"
        variant="outlined"
        size="small"
        color="black"
        onClick={onCreateReportClick}
      >
        {t('Create Report')}
      </Button> */}
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
