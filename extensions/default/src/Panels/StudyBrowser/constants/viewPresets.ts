import type { viewPreset } from '../types/viewPreset';

const defaultViewPresets = [
  {
    id: 'list',
    iconName: 'ListView',
    selected: false,
  },
  {
    id: 'thumbnails',
    iconName: 'ThumbnailView',
    selected: true,
  },
] as viewPreset[];

export { defaultViewPresets };
