/**
 * Defines a displaySet message, that could be any pf the potential problems of a displaySet
 */
class DisplaySetMessage {
  id: number;
  static CODES = {
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
    UNSUPPORTED_DISPLAYSET: 13,
  };

  constructor(id: number) {
    this.id = id;
  }
}
/**
 * Defines a list of displaySet messages
 */
class DisplaySetMessageList {
  messages = [];

  public addMessage(messageId: number): void {
    const message = new DisplaySetMessage(messageId);
    this.messages.push(message);
  }

  public size(): number {
    return this.messages.length;
  }

  public includesMessage(messageId: number): boolean {
    return this.messages.some(message => message.id === messageId);
  }

  public includesAllMessages(messageIdList: number[]): boolean {
    return messageIdList.every(messageId => this.include(messageId));
  }
}

export { DisplaySetMessage, DisplaySetMessageList };
