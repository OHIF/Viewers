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
function CollectionList(props) {
  const {
    isLoading,
    hasError,
    collections,
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
      displayText: t('CollectionID'),
      fieldName: 'CollectionID',
      inputType: 'text',
      size: 230,
    },
    {
      displayText: t('CancerType'),
      fieldName: 'CancerType',
      inputType: 'text',
      size: 230,
    },
    {
      displayText: t('SupportingData'),
      fieldName: 'SupportingData',
      inputType: 'text',
      size: 114,
    },
  ];

  const mediumTableMeta = [
    {
      displayText: t('CollectionID'),
      fieldName: 'CollectionID',
      inputType: 'text',
      size: 230,
    },
    {
      displayText: t('CancerType'),
      fieldName: 'CancerType',
      inputType: 'text',
      size: 230,
    },
    {
      displayText: t('SupportingData'),
      fieldName: 'SupportingData',
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
      <tbody className="table-body" data-cy="study-list-results">
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
                {t('There was an error fetching collections')}
              </div>
            </td>
          </tr>
        )}
        {/* EMPTY */}
        {!isLoading && !collections.length && (
          <tr className="no-hover">
            <td colSpan={tableMeta.length}>
              <div className="notFound">{t('No matching results')}</div>
            </td>
          </tr>
        )}
        {!isLoading &&
          collections.map((collection, index) => (
            <TableRow
              key={`${collection.CollectionID}-${index}`}
              onClick={selectedCollectionID =>
                handleSelectItem(collection.CollectionID)
              }
              Doi={collection.Doi || ''}
              Location={collection.Location}
              CancerType={collection.CancerType || ''}
              Species={collection.Species || ''}
              SupportingData={collection.SupportingData || ''}
              SubjectCount={collection.SubjectCount || ''}
              UpdatedDate={collection.UpdatedDate}
              Description={collection.Description || ''}
              CollectionID={collection.CollectionID}
              displaySize={displaySize}
            />
          ))}
      </tbody>
    </table>
  ) : null;
}

CollectionList.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  hasError: PropTypes.bool.isRequired,
  collections: PropTypes.array.isRequired,
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

CollectionList.defaultProps = {};

function TableRow(props) {
  const {
    isHighlighted,
    Location,
    CancerType,
    Species,
    UpdatedDate,
    Description,
    onClick: handleClick,
    CollectionID,
    SubjectCount,
    displaySize,
    SupportingData,
  } = props;

  const { t } = useTranslation('StudyList');

  const largeRowTemplate = (
    <tr
      onClick={() => handleClick(CollectionID)}
      className={classNames({ active: isHighlighted })}
    >
      <td>{CollectionID}</td>
      <td>
        <div>{CancerType}</div>
        <div style={{ color: '#60656f' }}>{Location}</div>
      </td>
      <td>
        <div>{SupportingData}</div>
        <div style={{ color: '#60656f' }}>{SubjectCount}</div>
      </td>
    </tr>
  );

  const mediumRowTemplate = (
    <tr
      onClick={() => handleClick(CollectionID)}
      className={classNames({ active: isHighlighted })}
    >
      <td>{CollectionID}</td>
      <td>
        <div>{CancerType}</div>
        <div style={{ color: '#60656f' }}>{Location}</div>
      </td>
      <td>
        <div>{Species}</div>
        <div style={{ color: '#60656f' }}>{SubjectCount}</div>
      </td>
      {/* DATE */}
    </tr>
  );

  const smallRowTemplate = (
    <tr
      onClick={() => handleClick(CollectionID)}
      className={classNames({ active: isHighlighted })}
    >
      <td style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {/* NAME AND ID */}
          <div
            className={classNames({ 'empty-value': !CancerType })}
            style={{ width: '150px', minWidth: '150px' }}
          >
            <div style={{ fontWeight: 500, paddingTop: '3px' }}>
              {Species || `(${t('Empty')})`}
            </div>
            <div style={{ color: '#60656f' }}>{CancerType}</div>
          </div>

          {/* DESCRIPTION */}
          <div
            className="hide-xs"
            style={{
              whiteSpace: 'pre-wrap',
              flexGrow: 1,
              paddingLeft: '35px',
            }}
          >
            {Description}
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
                modalities: Location,
                'empty-value': !Location,
              })}
              aria-label={Location}
              title={Location}
            >
              {Location || `(${t('Empty')})`}
            </div>
            <div>{UpdatedDate}</div>
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
  Location: PropTypes.string,
  CancerType: PropTypes.string.isRequired,
  Species: PropTypes.string.isRequired,
  UpdatedDate: PropTypes.string.isRequired,
  Description: PropTypes.string.isRequired,
  Doi: PropTypes.string.isRequired,
  CollectionID: PropTypes.string.isRequired,
  displaySize: PropTypes.string,
};

TableRow.defaultProps = {
  isHighlighted: false,
};

export { CollectionList };
