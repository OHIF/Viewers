import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  InputText,
  InputDateRange,
  InputMultiSelect,
  InputLabelWrapper,
} from '@ohif/ui';

const InputGroup = ({
  filtersMeta,
  filterValues,
  setFilterValues,
  filterSorting,
  setFilterSorting,
  isSortingEnable,
}) => {
  const { sortBy, sortDirection } = filterSorting;

  const handleFilterLabelClick = name => {
    if (isSortingEnable) {
      let _sortDirection = 'ascending';
      if (sortBy === name) {
        if (sortDirection === 'ascending') {
          _sortDirection = 'descending';
        } else if (sortDirection === 'descending') {
          _sortDirection = 'none';
        }
      }

      setFilterSorting({
        sortBy: _sortDirection !== 'none' ? name : '',
        sortDirection: _sortDirection,
      });
    }
  };

  const renderFieldInputComponent = ({
    name,
    displayName,
    inputProps,
    isSortable,
    inputType,
  }) => {
    const _isSortable = isSortable && isSortingEnable;
    const _sortDirection = sortBy !== name ? 'none' : sortDirection;

    const onLabelClick = () => {
      handleFilterLabelClick(name);
    };

    const handleFieldChange = newValue => {
      setFilterValues({
        ...filterValues,
        [name]: newValue,
      });
    };

    switch (inputType) {
      case 'Text':
        return (
          <InputText
            key={name}
            label={displayName}
            isSortable={_isSortable}
            sortDirection={_sortDirection}
            onLabelClick={onLabelClick}
            value={filterValues[name]}
            onChange={handleFieldChange}
          />
        );
        break;
      case 'MultiSelect':
        return (
          <InputMultiSelect
            key={name}
            label={displayName}
            isSortable={_isSortable}
            sortDirection={_sortDirection}
            onLabelClick={onLabelClick}
            value={filterValues[name]}
            onChange={handleFieldChange}
            options={inputProps.options}
          />
        );
      case 'DateRange':
        return (
          <InputDateRange
            key={name}
            label={displayName}
            isSortable={_isSortable}
            sortDirection={_sortDirection}
            onLabelClick={onLabelClick}
            value={filterValues[name]}
            onChange={handleFieldChange}
          />
        );
      case 'None':
        return (
          <InputLabelWrapper
            key={name}
            label={displayName}
            isSortable={_isSortable}
            sortDirection={_sortDirection}
            onLabelClick={onLabelClick}
          />
        );
      default:
        break;
    }
  };
  return (
    <div className="container m-auto relative flex flex-col">
      <div className="flex flex-row w-full">
        {filtersMeta.map(filterMeta => {
          return (
            <div
              key={filterMeta.name}
              className={classnames(
                'pl-4 first:pl-12',
                `w-${filterMeta.gridCol}/24`
              )}
            >
              {renderFieldInputComponent(filterMeta)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

InputGroup.propTypes = {
  filtersMeta: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      displayName: PropTypes.string.isRequired,
      inputType: PropTypes.oneOf(['Text', 'MultiSelect', 'DateRange', 'None'])
        .isRequired,
      isSortable: PropTypes.bool.isRequired,
      gridCol: PropTypes.oneOf([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
        .isRequired,
      option: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string,
          label: PropTypes.string,
        })
      ),
    })
  ).isRequired,
  filterValues: PropTypes.object.isRequired,
  setFilterValues: PropTypes.func.isRequired,
  filterSorting: PropTypes.shape({
    sortBy: PropTypes.string,
    sortDirection: PropTypes.oneOf(['ascending', 'descending', 'none']),
  }).isRequired,
  setFilterSorting: PropTypes.func.isRequired,
  isSortingEnable: PropTypes.bool.isRequired,
};

export default InputGroup;
