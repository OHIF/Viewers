import type { viewPreset } from '../types/viewPreset';

const defaultViewPresets = [
  {
    id: 'list',
    iconName: 'ListViewCustom',
    selected: false,
  },
  {
    id: 'thumbnails',
    iconName: 'ListGrid',
    selected: true,
  },
] as viewPreset[];

export { defaultViewPresets };
