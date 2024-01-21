import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';

import Icon from '../Icon';

import moment from 'jalali-moment';

const baseClasses = 'first:border-0 border-t border-secondary-light';

const StudyItem = ({
  date,
  description,
  numInstances,
  modalities,
  trackedSeries,
  isActive,
  onClick,
}) => {
  const { t } = useTranslation('StudyItem');

  const persianDate = moment(date, 'YYYY-MM-DD').format('jYYYY/jMM/jDD');

  return (
    <div
      className={classnames(
        isActive ? 'bg-primary-main' : 'hover:bg-secondary-main bg-primary-dark',
        baseClasses
      )}
      onClick={onClick}
      onKeyDown={onClick}
      role="button"
      tabIndex="0"
    >
      <div className="mx-1 flex flex-1 flex-col pb-2">
        <div className="flex flex-row items-center justify-between pt-2 pb-2">
          <div className="mr-7 whitespace-nowrap text-sm text-white">{persianDate}</div>
          <div className="pr-2 text-sm text-white">{modalities}</div>
        </div>
        <div className="flex flex-col py-1">
          <div className="break-words text-sm text-white">{description}</div>
        </div>
      </div>
      {!!trackedSeries && (
        <div className="flex-2 flex">
          <div
            className={classnames(
              'bg-secondary-main mt-2 flex flex-row py-1 pl-2 pr-4 text-base text-white ',
              isActive
                ? 'border-secondary-light flex-1 justify-center border-t'
                : 'mx-4 mb-4 rounded-sm'
            )}
          >
            <Icon
              name="tracked"
              className="text-primary-light mr-2 w-4"
            />
            {t('Tracked series', { trackedSeries: trackedSeries })}
          </div>
        </div>
      )}
    </div>
  );
};

StudyItem.propTypes = {
  date: PropTypes.string.isRequired,
  description: PropTypes.string,
  modalities: PropTypes.string.isRequired,
  numInstances: PropTypes.number.isRequired,
  trackedSeries: PropTypes.number,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};

export default StudyItem;
