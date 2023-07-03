const CODES = {
  NO_VALID_INSTANCES: 1,
  NO_POSITION_INFORMATION: 2,
  NOT_RECONSTRUCTABLE: 3,
  MULTIFRAME_NO_PIXEL_MEASUREMENTS: 4,
  MULTIFRAME_NO_ORIENTATION: 5,
  MULTIFRAME_NO_POSITION_INFORMATION: 6,
  MISSING_FRAMES: 7,
  IRREGULAR_SPACING: 8,
  INCONSISTENT_DIMENSIONS: 9,
  INCONSISTENT_COMPONENTS: 10,
  INCONSISTENT_ORIENTATIONS: 11,
  INCONSISTENT_POSITION_INFORMATION: 12,
};

const STRINGS = {
  [CODES.NO_VALID_INSTANCES]: 'No valid instances found in series.',
  [CODES.NO_POSITION_INFORMATION]: 'Series has missing position information.',
  [CODES.NOT_RECONSTRUCTABLE]: 'Series is not a reconstructable 3D volume.',
  [CODES.MULTIFRAME_NO_PIXEL_MEASUREMENTS]:
    "Multi frame series don't have pixel measurement information.",
  [CODES.MULTIFRAME_NO_ORIENTATION]:
    "Multi frame series don't have orientation information.",
  [CODES.MULTIFRAME_NO_POSITION_INFORMATION]:
    "Multi frame series don't have position information.",
  [CODES.MISSING_FRAMES]: 'Series has missing frames.',
  [CODES.IRREGULAR_SPACING]: 'Series has irregular spacing.',
  [CODES.INCONSISTENT_DIMENSIONS]:
    'Series has inconsistent dimensions between frames.',
  [CODES.INCONSISTENT_COMPONENTS]:
    'Series has frames with inconsistent number of components.',
  [CODES.INCONSISTENT_ORIENTATIONS]:
    'Series has frames with inconsistent orientations.',
  [CODES.INCONSISTENT_POSITION_INFORMATION]:
    'Series has inconsistent position information.',
};

class DisplaySetMessage {
  id: number;

  constructor(id: number) {
    this.id = id;
  }

  public toString(): string {
    return STRINGS[this.id];
  }
  public static get STRINGS() {
    return STRINGS;
  }
  public static get CODES() {
    return CODES;
  }
}

class DisplaySetMessageList {
  messages = [];

  public addMessage(messageId: number): void {
    const message = new DisplaySetMessage(messageId);
    this.messages.push(message);
  }

  public size(): number {
    return this.messages.length;
  }

  public include(messageId: number): boolean {
    for (let i = 0; i < this.messages.length; i++) {
      if (this.messages[i].id === messageId) {
        return true;
      }
    }
    return false;
  }

  public includes(messageIdList: number[]): boolean {
    for (let i = 0; i < messageIdList.length; i++) {
      if (!this.include(messageIdList[i])) {
        return false;
      }
    }
    return true;
  }
}

export { DisplaySetMessage, DisplaySetMessageList };
