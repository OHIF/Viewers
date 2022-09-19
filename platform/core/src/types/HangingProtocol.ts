type DisplaySetInfo = {
  SeriesInstanceUID: string;
  displaySetInstanceUID: string;
  displaySetOptions: Record<string, unknown>;
};

type ViewportMatchDetails = {
  viewportOptions: ViewportOptions;
  displaySetsInfo: DisplaySetInfo[];
};

type DisplaySetMatchDetails = {
  SeriesInstanceUID: string;
  StudyInstanceUID: string;
  displaySetInstanceUID: string;
  matchDetails?: any;
  matchingScores?: any[];
  sortingInfo?: any;
};

type HangingProtocolMatchDetails = {
  displaySetMatchDetails: Map<string, DisplaySetMatchDetails>;
  viewportMatchDetails: ViewportMatchDetails[];
  hpAlreadyApplied: boolean[];
};

type MatchingRule = {
  id: string;
  weight: number;
  attribute: string;
  constraint: Record<string, unknown>;
  required: boolean;
};

type ViewportLayoutOptions = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type ViewportStructure = {
  layoutType: string;
  properties: {
    rows: number;
    columns: number;
    layoutOptions: ViewportLayoutOptions[];
  };
};

type DisplaySet = {
  id: string;
  imageMatchingRules: MatchingRule[];
  seriesMatchingRules: MatchingRule[];
  studyMatchingRules: MatchingRule[];
};

type SyncGroup = {
  type: string;
  id: string;
  source?: boolean
  target?: boolean
}

type initialImageOptions = {
  index?: number;
  preset? : string; // todo: type more
}

type ViewportOptions = {
  toolGroupId: string;
  viewportType: string;
  id?: string;
  orientation?: string;
  viewportId?: string;
  initialImageOptions?: initialImageOptions;
  syncGroups?: SyncGroup[];
            customViewportProps? : Record<string, unknown>;
};

type DisplaySetOptions = {
  id: string;
  options?: Record<string, unknown>;
};

type Viewport = {
  viewportOptions: ViewportOptions;
  displaySets: DisplaySetOptions[];
};

type ProtocolStage = {
  id: string;
  name: string;
  viewportStructure: ViewportStructure;
  displaySets: DisplaySet[];
  viewports: Viewport[];
  createdDate?: string;
};

type Protocol = {
  // Mandatory
  id: string;
  stages: ProtocolStage[];
  // Optional
  locked?: boolean;
  hasUpdatedPriorsInformation?: boolean;
  name?: string;
  createdDate?: string;
  modifiedDate?: string;
  availableTo?: Record<string, unknown>;
  editableBy?: Record<string, unknown>;
  toolGroupIds?: string[];
  imageLoadStrategy?: string; // Todo: this should be types specifically
  protocolMatchingRules?: MatchingRule[];
  numberOfPriorsReferenced?: number;
};

type ProtocolGenerator = ({servicesManager: any, commandsManager: any}) => {
  protocol: Protocol;
  matchingDisplaySets: any;
};

export type {
  ProtocolGenerator,
  ViewportOptions,
  ViewportMatchDetails,
  DisplaySetMatchDetails,
  HangingProtocolMatchDetails,
  Protocol,
  ProtocolStage,
  Viewport,
  DisplaySet,
  ViewportStructure,
  ViewportLayoutOptions,
  DisplaySetOptions,
  MatchingRule,
  SyncGroup,
  initialImageOptions,
  DisplaySetInfo
};
