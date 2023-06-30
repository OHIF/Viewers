import displaySetMessageThumbnailContent from './displaySetMessageContent';
import React from 'react';

const displaySetMessageCodes = {
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

const displaySetMessageStrings = {
  [displaySetMessageCodes.NO_VALID_INSTANCES]:
    'No valid instances found in series.',
  [displaySetMessageCodes.NO_POSITION_INFORMATION]:
    'Series has missing position information.',
  [displaySetMessageCodes.NOT_RECONSTRUCTABLE]:
    'Series is not a reconstructable 3D volume.',
  [displaySetMessageCodes.MULTIFRAME_NO_PIXEL_MEASUREMENTS]:
    "Multi frame series don't have pixel measurement information.",
  [displaySetMessageCodes.MULTIFRAME_NO_ORIENTATION]:
    "Multi frame series don't have orientation information.",
  [displaySetMessageCodes.MULTIFRAME_NO_POSITION_INFORMATION]:
    "Multi frame series don't have position information.",
  [displaySetMessageCodes.MISSING_FRAMES]: 'Series has missing frames.',
  [displaySetMessageCodes.IRREGULAR_SPACING]: 'Series has irregular spacing.',
  [displaySetMessageCodes.INCONSISTENT_DIMENSIONS]:
    'Series has inconsistent dimensions between frames.',
  [displaySetMessageCodes.INCONSISTENT_COMPONENTS]:
    'Series has frames with inconsistent number of components.',
  [displaySetMessageCodes.INCONSISTENT_ORIENTATIONS]:
    'Series has frames with inconsistent orientations.',
  [displaySetMessageCodes.INCONSISTENT_POSITION_INFORMATION]:
    'Series has inconsistent position information.',
};

const displayLocationCodes = {
  THUMBNAIL: 1,
  CONSOLE: 2,
  SNACKBAR_NOTIFICATION: 3,
};

class displayServiceMessage {
  id: number;
  displayLocation: number;
  hangingProtocolId: string;

  constructor(
    id: number,
    displayLocation: number = displayLocationCodes.THUMBNAIL,
    hangingProtocolId?: string
  ) {
    this.id = id;
    this.displayLocation = displayLocation;
    this.hangingProtocolId = hangingProtocolId;
  }

  public toString(): string {
    return displaySetMessageStrings[this.id];
  }
}

class displayServiceMessageList {
  messages = [];

  public thumbnailContents(): React.ReactNode {
    return displaySetMessageThumbnailContent(this.messages);
  }
  public addMessage(messageId: number): void {
    const message = new displayServiceMessage(messageId);
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

export {
  displayServiceMessage,
  displayServiceMessageList,
  displaySetMessageCodes,
  displaySetMessageStrings,
  displayLocationCodes,
};
