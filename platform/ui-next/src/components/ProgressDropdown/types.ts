export type ProgressDropdownOption = {
  label: string;
  value: string;
  info?: string;
  activated?: boolean;
  completed?: boolean;
  onSelect?: () => void;
};

