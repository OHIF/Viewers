import PropTypes from 'prop-types';

export type ProgressDropdownOption = {
  label: string;
  value: string;
  info?: string;
  activated?: boolean;
  completed?: boolean;
  onSelect?: () => void;
};

export const ProgressDropdownOptionPropType = PropTypes.shape({
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  info: PropTypes.string,
  activated: PropTypes.bool,
  completed: PropTypes.bool,
  onSelect: PropTypes.func,
});
