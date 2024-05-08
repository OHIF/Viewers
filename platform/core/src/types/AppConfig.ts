import Hotkey from '../classes/Hotkey';

export interface AppConfig {
  extensions?: string[];
  defaultDataSourceName?: string;
  hotkeys?: Record<string, Hotkey> | Hotkey[];
  useSharedArrayBuffer?: string;
  preferSizeOverAccuracy?: boolean;
  useNorm16Texture?: boolean;
  useCPURendering?: boolean;
  strictZSpacingForVolumeViewport?: boolean;
  useCursors?: boolean;
  maxCacheSize?: number;
  showWarningMessageForCrossOrigin?: boolean;
  showCPUFallbackMessage?: boolean;
  maxNumRequests?: {
    interaction?: number;
    prefetch?: number;
    thumbnail?: number;
  };
}
