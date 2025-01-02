export interface LabelInfo {
  label: string;
  value: string;
  items?: LabelInfo[]; // optional sub-items for nesting
}
