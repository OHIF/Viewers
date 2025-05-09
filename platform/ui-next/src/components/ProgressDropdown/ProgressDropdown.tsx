import React, { ReactNode, useEffect, useCallback, useState, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import ProgressDiscreteBar from './ProgressDiscreteBar';
import ProgressItemDetail from './ProgressItemDetail';
import ProgressItem from './ProgressItem';
import { Icons } from '../Icons';
import { ProgressDropdownOption, ProgressDropdownOptionPropType } from './types';

const ProgressDropdown = ({
  options: optionsProps,
  value,
  children,
  dropDownWidth = '170',
  onChange,
}: {
  options: ProgressDropdownOption[];
  value?: string;
  children?: ReactNode;
  onChange?: ({ selectedOption }) => void;
}): JSX.Element => {
  const element = useRef(null);
  const [open, setOpen] = useState(false);
  const toggleOpen = () => setOpen(s => !s);
  const [options, setOptions] = useState(optionsProps);
  const [selectedOption, setSelectedOption] = useState(undefined);

  const selectedOptionIndex = useMemo(
    () => options.findIndex(option => option.value === selectedOption?.value),
    [options, selectedOption]
  );

  const canMoveNext = useMemo(
    () => selectedOptionIndex < options.length - 1,
    [selectedOptionIndex, options]
  );

  const handleOptionSelected = useCallback(
    (newSelectedOption?: ProgressDropdownOption): void => {
      if (newSelectedOption?.value === selectedOption?.value) {
        return;
      }

      setOpen(false);
      setSelectedOption(newSelectedOption);

      if (newSelectedOption) {
        newSelectedOption.activated = true;
        newSelectedOption.onSelect?.();
      }

      if (onChange) {
        onChange({ selectedOption: newSelectedOption });
      }
    },
    [selectedOption, onChange]
  );

  const handleNextButtonClick = useCallback(() => {
    if (canMoveNext) {
      handleOptionSelected(options[selectedOptionIndex + 1]);
    }
  }, [options, selectedOptionIndex, canMoveNext, handleOptionSelected]);

  // Update the options in case the options from props has changed
  useEffect(() => setOptions(optionsProps), [optionsProps]);

  // Updates the selected item based on the value from props
  useEffect(() => {
    if (!value) {
      return;
    }

    const newOption = value ? options.find(option => option.value === value) : undefined;

    handleOptionSelected(newOption);
  }, [value, options, handleOptionSelected]);

  // Listen to any click event outside of the dropdown context to hide the options
  useEffect(() => {
    const handleDocumentClick = e => {
      if (element.current && !element.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleDocumentClick);

    if (!open) {
      document.removeEventListener('click', handleDocumentClick);
    }
  }, [open]);

  return (
    <div
      ref={element}
      className="relative grow select-none text-[0px] text-white"
    >
      <div>
        <div className="mb-1.5 flex h-[26px]">
          <div
            className="bg-secondary-dark border-primary-main flex grow cursor-pointer rounded border"
            style={{ width: `${dropDownWidth}px` }}
            onClick={toggleOpen}
          >
            <div className="flex grow">
              {selectedOption && <ProgressItemDetail option={selectedOption} />}

              {!selectedOption && <div className="ml-1 grow text-base leading-6">{children}</div>}
            </div>
            <Icons.ChevronDown className="text-primary-active mt-1.5 ml-1 mr-2" />
          </div>
          <button
            className={classnames('ml-1.5 w-[26px] rounded text-base', {
              'bg-primary-main': canMoveNext,
              'bg-primary-dark pointer-events-none': !canMoveNext,
            })}
          >
            <Icons.ArrowRight
              className={classnames('relative left-0.5 h-6 w-6 text-white', {
                'text-white': canMoveNext,
                'text-secondary-light': !canMoveNext,
              })}
              onClick={handleNextButtonClick}
            />
          </button>
        </div>
        <div
          className={classnames(
            'absolute top-7 left-0 right-8 z-10 mt-0.5 origin-top',
            'bg-primary-dark overflow-hidden transition-[max-height] duration-300',
            'border-secondary-main rounded border shadow',
            {
              hidden: !open,
              'max-h-[500px]': open,
            }
          )}
        >
          {options.map((option, index) => (
            <ProgressItem
              key={index}
              option={option}
              onSelect={() => handleOptionSelected(option)}
            />
          ))}
        </div>

        <div>
          <ProgressDiscreteBar options={options} />
        </div>
      </div>
    </div>
  );
};

ProgressDropdown.propTypes = {
  options: PropTypes.arrayOf(ProgressDropdownOptionPropType).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  children: PropTypes.node,
  dropDownWidth: PropTypes.string,
};

export default ProgressDropdown;
