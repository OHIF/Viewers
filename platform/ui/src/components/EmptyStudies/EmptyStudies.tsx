import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';

import Typography from '../Typography';
import { Icons } from '@ohif/ui-next';

const EmptyStudies = ({ className = '' }) => {
  const { t } = useTranslation('StudyList');
  return (
    <div className={classnames('inline-flex flex-col items-center', className)}>
      <Icons.Magnifier className="mb-4" />
      <Typography
        className="text-primary-light"
        variant="h5"
      >
        {t('No studies available')}
      </Typography>
    </div>
  );
};

EmptyStudies.propTypes = {
  className: PropTypes.string,
};

export default EmptyStudies;
