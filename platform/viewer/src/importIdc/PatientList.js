import React from 'react';
import classNames from 'classnames';
import TableSearchFilter from './TableSearchFilter.js';
import PropTypes from 'prop-types';
import { LoadingText } from './LoadingText';
import { useTranslation } from 'react-i18next';

const getContentFromUseMediaValue = (
  displaySize,
  contentArrayMap,
  defaultContent
) => {
  const content =
    displaySize in contentArrayMap
      ? contentArrayMap[displaySize]
      : defaultContent;

  return content;
};
/**
 *
 *
 * @param {*} props
 * @returns
 */

function PatientList(props) {
  const {
    isLoading,
    hasError,
    patients,
    sort,
    onSort: handleSort,
    filterValues,
    onFilterChange: handleFilterChange,
    onSelectItem: handleSelectItem,
    displaySize,
  } = props;
  const { t, ready: translationsAreReady } = useTranslation('StudyList');

  const largeTableMeta = [
    {
      displayText: t('PatientID'),
      fieldName: 'PatientID',
      inputType: 'text',
      size: 230,
    },
    {
      displayText: t('Modalities'),
      fieldName: 'Modalities',
      inputType: 'text',
      size: 114,
    },
    {
      displayText: t('BodyPart'),
      fieldName: 'BodyPart',
      inputType: 'text',
      size: 230,
    },
  ];

  const mediumTableMeta = [
    {
      displayText: t('PatientID'),
      fieldName: 'PatientID',
      inputType: 'text',
      size: 230,
    },
    {
      displayText: t('Modalities'),
      fieldName: 'Modalities',
      inputType: 'text',
      size: 114,
    },
    {
      displayText: t('BodyPart'),
      fieldName: 'BodyPart',
      inputType: 'text',
      size: 114,
    },
  ];

  const smallTableMeta = [
    {
      displayText: t('Search'),
      fieldName: 'allFields',
      inputType: 'text',
      size: 100,
    },
  ];

  const tableMeta = getContentFromUseMediaValue(
    displaySize,
    { large: largeTableMeta, medium: mediumTableMeta, small: smallTableMeta },
    smallTableMeta
  );

  const totalSize = tableMeta
    .map(field => field.size)
    .reduce((prev, next) => prev + next);

  return translationsAreReady ? (
    <table className="table table--striped table--hoverable">
      <colgroup>
        {tableMeta.map((field, i) => {
          const size = field.size;
          const percentWidth = (size / totalSize) * 100.0;

          return <col key={i} style={{ width: `${percentWidth}%` }} />;
        })}
      </colgroup>
      <thead className="table-head">
        <tr className="filters">
          <TableSearchFilter
            meta={tableMeta}
            values={filterValues}
            onSort={handleSort}
            onValueChange={handleFilterChange}
            sortFieldName={sort.fieldName}
            sortDirection={sort.direction}
          />
        </tr>
      </thead>
      <tbody className="table-body" data-cy="import-list-results">
        {/* I'm not in love with this approach, but it's the quickest way for now
         *
         * - Display different content based on loading, empty, results state
         *
         * This is not ideal because it create a jump in focus. For loading especially,
         * We should keep our current results visible while we load the new ones.
         */}
        {/* LOADING */}
        {isLoading && (
          <tr className="no-hover">
            <td colSpan={tableMeta.length}>
              <LoadingText />
            </td>
          </tr>
        )}
        {!isLoading && hasError && (
          <tr className="no-hover">
            <td colSpan={tableMeta.length}>
              <div className="notFound">
                {t('There was an error fetching patients')}
              </div>
            </td>
          </tr>
        )}
        {/* EMPTY */}
        {!isLoading && !patients.length && (
          <tr className="no-hover">
            <td colSpan={tableMeta.length}>
              <div className="notFound">{t('No matching results')}</div>
            </td>
          </tr>
        )}

        {!isLoading &&
          patients.map((patient, index) => (
            <TableRow
              key={`${patient.PatientID}-${index}`}
              onClick={selectedPatientStudyUID =>
                handleSelectItem(selectedPatientStudyUID)
              }
              PatientID={patient.PatientID || ''}
              StudyUID={patient.Modalities}
              Modalities={patient.Modalities}
              BodyPart={patient.BodyPart || ''}
              TotalSeries={patient.TotalSeries || ''}
              displaySize={displaySize}
            />
          ))}
      </tbody>
    </table>
  ) : null;
}

PatientList.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  hasError: PropTypes.bool.isRequired,
  patients: PropTypes.array.isRequired,
  onSelectItem: PropTypes.func.isRequired,
  // ~~ SORT
  sort: PropTypes.shape({
    fieldName: PropTypes.string,
    direction: PropTypes.oneOf(['desc', 'asc', null]),
  }).isRequired,
  onSort: PropTypes.func.isRequired,
  // ~~ FILTERS
  filterValues: PropTypes.shape({
    allFields: PropTypes.string.isRequired,
  }).isRequired,
  onFilterChange: PropTypes.func.isRequired,
  displaySize: PropTypes.string,
};

PatientList.defaultProps = {};

function TableRow(props) {
  const {
    isHighlighted,
    PatientID,
    Modalities,
    BodyPart,
    TotalSeries,
    StudyUID,
    onClick: handleClick,
    displaySize,
  } = props;

  const { t } = useTranslation('StudyList');

  const largeRowTemplate = (
    <tr
      // onClick={() => handleClick(StudyUID)}
      className={classNames({ active: isHighlighted })}
    >
      <td>{PatientID}</td>
      <td>
        <div>{Modalities}</div>
      </td>
      <td>
        <button
          className="btn btn-sm btn-primary"
          onClick={() => handleClick(StudyUID)}
        >
          {t('import-idc')}
        </button>
        {/* <div>{BodyPart}</div> */}
        <div style={{ color: '#60656f' }}>{TotalSeries}</div>
      </td>
    </tr>
  );

  const mediumRowTemplate = (
    <tr
      // onClick={() => handleClick(StudyUID)}
      className={classNames({ active: isHighlighted })}
    >
      <td>{PatientID}</td>
      <td>
        <div>{Modalities}</div>
      </td>
      <td>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div>{BodyPart}</div>
            <div style={{ color: '#60656f' }}>{TotalSeries}</div>
          </div>

          <button
            className="btn btn-sm btn-primary"
            onClick={() => handleClick(StudyUID)}
          >
            {t('import-idc')}
          </button>
        </div>
      </td>
    </tr>
  );

  const smallRowTemplate = (
    <tr
      onClick={() => handleClick(StudyUID)}
      className={classNames({ active: isHighlighted })}
    >
      <td style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* NAME AND ID */}

          {/* DESCRIPTION */}
          <div
            className="hide-xs"
            style={{
              whiteSpace: 'pre-wrap',
              flexGrow: 1,
              paddingLeft: '35px',
            }}
          >
            {BodyPart}
          </div>

          {/* MODALITY & DATE */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: '80px',
              width: '80px',
            }}
          >
            <div
              className={classNames({
                modalities: Modalities,
                'empty-value': !Modalities,
              })}
              aria-label={Modalities}
              title={Modalities}
            >
              {Modalities || `(${t('Empty')})`}
            </div>
            <div>{TotalSeries}</div>
          </div>
        </div>
      </td>
    </tr>
  );

  const rowTemplate = getContentFromUseMediaValue(
    displaySize,
    {
      large: largeRowTemplate,
      medium: mediumRowTemplate,
      small: smallRowTemplate,
    },
    smallRowTemplate
  );

  return rowTemplate;
}

TableRow.propTypes = {
  isHighlighted: PropTypes.bool,
  Modalities: PropTypes.string,
  TotalSeries: PropTypes.string.isRequired,
  StudyUID: PropTypes.string.isRequired,
  BodyPart: PropTypes.string.isRequired,
  PatientID: PropTypes.string.isRequired,
  displaySize: PropTypes.string,
};

TableRow.defaultProps = {
  isHighlighted: false,
};

export { PatientList };
