import Hotkey from '../classes/Hotkey';

export interface AppConfig {
  extensions?: string[];
  defaultDataSourceName?: string;
  hotkeys?: Record<string, Hotkey> | Hotkey[];
}
