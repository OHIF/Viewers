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
import { Icon, Tooltip } from '../';

const MAX_TOOLTIP_LENGTH = 250;
const DROPDOWN_OPTION_PROPTYPE = PropTypes.shape({
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  info: PropTypes.string,
  activated: PropTypes.bool,
  completed: PropTypes.bool,
  onSelect: PropTypes.func,
});

type StepProgressDropdownOption = {
  label: string;
  value: string;
  info?: string;
  activated?: boolean;
  completed?: boolean;
  onSelect?: () => void;
};

const StepProgressStatus = ({ options }) => {
  const items: JSX.Element[] = [];

  for (let i = 0; i < options.length; i++) {
    const { activated, completed } = options[i];

    items.push(
      <div
        key={i}
        className={classnames(
          'h-1 grow mr-1 last:mr-0 first:rounded-l-sm last:rounded-r-sm',
          {
            'bg-black': !activated && !completed,
            'bg-primary-main': activated && !completed,
            'bg-primary-light': completed,
          }
        )}
      ></div>
    );
  }

  return <div className="flex">{items}</div>;
};

StepProgressStatus.propTypes = {
  options: PropTypes.arrayOf(DROPDOWN_OPTION_PROPTYPE).isRequired,
};

const StepProgressDropdownItemContent = ({ option, debugEnabled }) => {
  const { label, info, completed } = option;
  const [truncate, setTruncate] = useState(true);
  const handleOnHideTooltip = () => setTruncate(true);
  let icon;

  if (completed) {
    icon = 'status-tracked';
  } else if (info) {
    icon = 'launch-info';
  }

  const tooltipText = useMemo(() => {
    if (!truncate || !info || info.length <= MAX_TOOLTIP_LENGTH) {
      return info;
    }

    const handleReadMoreClick = e => {
      setTruncate(false);
      e.stopPropagation();
      e.preventDefault();
    };

    return (
      <>
        {info.substr(0, MAX_TOOLTIP_LENGTH)}
        <button
          className="text-primary-active font-bold"
          onClick={handleReadMoreClick}
        >
          &nbsp;Read more...
        </button>
      </>
    );
  }, [info, truncate]);

  const iconClassNames =
    'grow-0 text-primary-light h-4 w-4 mt-1 mr-2 mb-0 ml-1';

  const iconContent = (
    <>
      {icon && <Icon name={icon} className={iconClassNames} />}
      {!icon && <div className={iconClassNames} />}
    </>
  );

  return (
    <>
      {info && (
        <Tooltip
          content={tooltipText}
          position="bottom-left"
          tooltipBoxClassName={'max-w-xs'}
          onHide={handleOnHideTooltip}
        >
          {iconContent}
        </Tooltip>
      )}
      {!info && iconContent}

      <div className="grow text-base leading-6">{label}</div>
    </>
  );
};

StepProgressDropdownItemContent.propTypes = {
  option: DROPDOWN_OPTION_PROPTYPE.isRequired,
};

const StepProgressDropdownItem = ({ option, onSelect }) => {
  const { value } = option;

  return (
    <div
      key={value}
      className={
        'flex py-1 cursor-pointer hover:bg-secondary-main transition duration-1000'
      }
      onClick={() => onSelect(option)}
    >
      <StepProgressDropdownItemContent option={option} />
    </div>
  );
};

StepProgressDropdownItem.propTypes = {
  option: DROPDOWN_OPTION_PROPTYPE.isRequired,
  onSelect: PropTypes.func,
};

const StepProgressDropdown = ({
  options: optionsProps,
  value,
  children,
  onChange,
}: {
  options: StepProgressDropdownOption[];
  value?: string;
  children?: ReactNode;
  onChange?: ({ selectedOption }) => void;
}): JSX.Element => {
  const element = useRef(null);
  const [open, setOpen] = useState(false);
  const toggleOptions = () => setOpen(s => !s);
  const [options, setOptions] = useState(optionsProps);

  const getSelectedOption = useCallback(
    () => (value ? options.find(option => option.value === value) : undefined),
    [options, value]
  );

  const [selectedOption, setSelectedOption] = useState(() =>
    getSelectedOption()
  );

  const selectedOptionIndex = useMemo(
    () => options.findIndex(option => option.value === selectedOption?.value),
    [options, selectedOption]
  );

  const canMoveNext = useMemo(() => selectedOptionIndex < options.length - 1, [
    selectedOptionIndex,
    options,
  ]);

  const handleDocumentClick = e => {
    if (element.current && !element.current.contains(e.target)) {
      setOpen(false);
    }
  };

  const handleOptionSelected = useCallback(
    (newSelectedOption?: StepProgressDropdownOption): void => {
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
  useEffect(() => {
    setOptions(optionsProps);
    setSelectedOption(getSelectedOption());
  }, [optionsProps, getSelectedOption]);

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

  const renderOptions = () => {
    return (
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
          <StepProgressDropdownItem
            key={index}
            option={option}
            onSelect={() => handleOptionSelected(option)}
          />
        ))}
      </div>
    );
  };

  useEffect(() => {
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
            onClick={toggleOptions}
          >
            <div className="flex grow">
              {selectedOption && (
                <StepProgressDropdownItemContent
                  option={selectedOption}
                  debugEnabled={true}
                />
              )}

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
        {renderOptions()}
        <div>
          <StepProgressStatus options={options} />
        </div>
      </div>
    </div>
  );
};

StepProgressDropdown.propTypes = {
  options: PropTypes.arrayOf(DROPDOWN_OPTION_PROPTYPE).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  children: PropTypes.node,
};

export default StepProgressDropdown;
