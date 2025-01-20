type DisplaySet {
  displaySetInstanceUID: string;
  StudyInstanceUID: string;
  SeriesInstanceUID?: string;
  SeriesNumber?: string;
  unsupported?: boolean;
  viewportType?: string;
  instances: any[];
  instance?: any;
}

export default DisplaySet;
