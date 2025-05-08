export interface ButtonState {
  isOpen: boolean;
  isVisible: boolean;
  isLocked: boolean;
}

export interface ToolbarButtonActions {
  lockItem: (itemId: string) => void;
  unlockItem: (itemId: string) => void;
  toggleLock: (itemId: string) => void;
  isItemLocked: (itemId: string) => boolean;
  showItem: (itemId: string) => void;
  hideItem: (itemId: string) => void;
  toggleVisibility: (itemId: string) => void;
  isItemVisible: (itemId: string) => boolean;
  openItem: (itemId: string) => void;
  closeItem: (itemId: string) => void;
  closeAllItems: () => void;
  isItemOpen: (itemId: string) => boolean;
}

export interface ToolbarHookReturn extends ToolbarButtonActions {
  toolbarButtons: any[]; // The display representation of toolbar buttons
  onInteraction: (args: any) => void;
}
