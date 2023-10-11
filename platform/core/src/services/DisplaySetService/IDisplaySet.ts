interface IDisplaySet {
  displaySetInstanceUID: string;
  StudyInstanceUID: string;
  SeriesInstanceUID?: string;
  SeriesNumber?: string;
  unsupported?: boolean;
}

export default IDisplaySet;
