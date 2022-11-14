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

/**
 * Selects the display sets to apply for a given id.
 * This is a set of rules which match the study and display sets
 * and then provides an id for them so that they can re-used in different
 * viewports.
 * The matches are done lazily, so if a stage doesn't need a given match,
 * it won't be selected.
 */
type DisplaySetSelector = {
  // The image matching rule (not currently implemented) selects which image to
  // display initially, only for stack views.
  imageMatchingRules?: MatchingRule[];
  // The matching rules to choose the display sets at the series level
  seriesMatchingRules: MatchingRule[];
  studyMatchingRules?: MatchingRule[];
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
  customViewportProps?: Record<string, unknown>;
};

type DisplaySetOptions = {
  // The id is used to choose which display set selector to apply here
  id: string;
  // An offset to allow display secondary series, for example
  // to display the second matching series (displaySetIndex==1)
  // This cannot easily be done with the matching rules directly.
  displaySetIndex?: number;
  // The options to apply to the display set.
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
  viewports: Viewport[];
  createdDate?: string;
};

type Protocol = {
  // Mandatory
  id: string;
  // Selects which display sets are given a specific name.
  displaySetSelectors: Record<string, DisplaySetSelector>;
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
  DisplaySetSelector,
  ViewportStructure,
  ViewportLayoutOptions,
  DisplaySetOptions,
  MatchingRule,
  SyncGroup,
  initialImageOptions,
  DisplaySetInfo
};
