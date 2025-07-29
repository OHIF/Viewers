import React from 'react';
import classnames from 'classnames';
import getGridWidthClass from '../../utils/getGridWidthClass';

import InputText from '../InputText';
import InputDateRange from '../InputDateRange';
import InputMultiSelect from '../InputMultiSelect';
import InputLabelWrapper from '../InputLabelWrapper';

interface InputGroupProps {
  inputMeta: {
    name: string;
    displayName: string;
    inputType: "Text" | "MultiSelect" | "DateRange" | "None";
    isSortable: boolean;
    gridCol: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
    option?: {
      value?: string;
      label?: string;
    }[];
  }[];
  values: object;
  onValuesChange(...args: unknown[]): unknown;
  sorting: {
    sortBy?: string;
    sortDirection?: "ascending" | "descending" | "none";
  };
  onSortingChange(...args: unknown[]): unknown;
  isSortingEnabled: boolean;
}

const InputGroup = ({
  inputMeta,
  values,
  onValuesChange,
  sorting,
  onSortingChange,
  isSortingEnabled
}: InputGroupProps) => {
  const { sortBy, sortDirection } = sorting;

  const handleFilterLabelClick = name => {
    if (isSortingEnabled) {
      let _sortDirection = 'descending';
      if (sortBy === name) {
        if (sortDirection === 'ascending') {
          _sortDirection = 'descending';
        } else if (sortDirection === 'descending') {
          _sortDirection = 'ascending';
        }
      }

      onSortingChange({
        sortBy: _sortDirection !== 'none' ? name : '',
        sortDirection: _sortDirection,
      });
    }
  };

  const renderFieldInputComponent = ({ name, displayName, inputProps, isSortable, inputType }) => {
    const _isSortable = isSortable && isSortingEnabled;
    const _sortDirection = sortBy !== name ? 'none' : sortDirection;

    const onLabelClick = () => {
      handleFilterLabelClick(name);
    };

    const handleFieldChange = newValue => {
      onValuesChange({
        ...values,
        [name]: newValue,
      });
    };

    const handleDateRangeFieldChange = ({ startDate, endDate }) => {
      onValuesChange({
        ...values,
        [name]: {
          startDate: startDate,
          endDate: endDate,
        },
      });
    };

    switch (inputType) {
      case 'Text':
        return (
          <InputText
            id={name}
            key={name}
            label={displayName}
            isSortable={_isSortable}
            sortDirection={_sortDirection}
            onLabelClick={onLabelClick}
            value={values[name]}
            onChange={handleFieldChange}
          />
        );
      case 'MultiSelect':
        return (
          <InputMultiSelect
            id={name}
            key={name}
            label={displayName}
            isSortable={_isSortable}
            sortDirection={_sortDirection}
            onLabelClick={onLabelClick}
            value={values[name]}
            onChange={handleFieldChange}
            options={inputProps.options}
          />
        );
      case 'DateRange':
        return (
          <InputDateRange
            id={name}
            key={name}
            label={displayName}
            isSortable={_isSortable}
            sortDirection={_sortDirection}
            onLabelClick={onLabelClick}
            value={values[name]}
            onChange={handleDateRangeFieldChange}
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
    <div className="container relative m-auto flex flex-col">
      <div className="flex w-full flex-row">
        {inputMeta.map(inputMeta => {
          return (
            <div
              key={inputMeta.name}
              className={classnames('pl-4 first:pl-12', getGridWidthClass(inputMeta.gridCol))}
            >
              {renderFieldInputComponent(inputMeta)}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InputGroup;
