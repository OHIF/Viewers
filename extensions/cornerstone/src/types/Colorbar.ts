import { ColorMapPreset } from './Colormap';
import { CommandsManager, ServicesManager } from '@ohif/core';

export type ColorbarOptions = {
  position: string;
  colormaps: Array<ColorMapPreset>;
  activeColormapName: string;
  ticks: object;
  width: string;
};

export type ColorbarProps = {
  viewportId: string;
  commandsManager: CommandsManager;
  serviceManager: ServicesManager;
  displaySets: Array<any>;
  colorbarProperties: ColorbarProperties;
};

export type ColorbarProperties = {
  width: string;
  colorbarTickPosition: string;
  colorbarContainerPosition: string;
  colormaps: Array<ColorMapPreset>;
  colorbarInitialColormap: string;
};

export enum ChangeTypes {
  Removed = 'removed',
  Added = 'added',
  Modified = 'modified',
}
