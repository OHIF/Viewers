import React, {
  ReactNode,
  useEffect,
  useCallback,
  useState,
  useMemo,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import ProgressDiscreteBar from './ProgressDiscreteBar';
import ProgressItemDetail from './ProgressItemDetail';
import ProgressItem from './ProgressItem';
import { Icon } from '../';
import {
  ProgressDropdownOption,
  ProgressDropdownOptionPropType,
} from './types';

const ProgressDropdown = ({
  options: optionsProps,
  value,
  children,
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

  const canMoveNext = useMemo(() => selectedOptionIndex < options.length - 1, [
    selectedOptionIndex,
    options,
  ]);

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

    const newOption = value
      ? options.find(option => option.value === value)
      : undefined;

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
    <div ref={element} className="grow text-white relative text-[0px]">
      <div>
        <div className="flex mb-1.5 h-[26px]">
          <div
            className="flex grow border bg-secondary-dark border-primary-main rounded cursor-pointer"
            onClick={toggleOpen}
          >
            <div className="flex grow">
              {selectedOption && <ProgressItemDetail option={selectedOption} />}

              {!selectedOption && (
                <div className="grow text-base leading-6 ml-1">{children}</div>
              )}
            </div>
            <Icon
              name="chevron-down"
              className="text-primary-active mt-0.5 ml-1"
            />
          </div>
          <button
            className={classnames('text-base rounded w-[26px] ml-1.5', {
              'bg-primary-main': canMoveNext,
              'bg-primary-dark pointer-events-none': !canMoveNext,
            })}
          >
            <Icon
              name="arrow-right"
              className={classnames('text-white relative left-0.5 w-6 h-6', {
                'text-white': canMoveNext,
                'text-secondary-light': !canMoveNext,
              })}
              onClick={handleNextButtonClick}
            />
          </button>
        </div>
        <div
          className={classnames(
            'absolute top-7 mt-0.5 left-0 right-8 z-10 origin-top-right',
            'transition duration-300 transform bg-primary-dark',
            'border border-secondary-main rounded shadow',
            {
              'scale-0': !open,
              'scale-100': open,
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
};

export default ProgressDropdown;
