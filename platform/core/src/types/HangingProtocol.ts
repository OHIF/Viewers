import { Command } from './Command';

export type DisplaySetInfo = {
  displaySetInstanceUID?: string;
  displaySetOptions: DisplaySetOptions;
};

export type ViewportMatchDetails = {
  viewportOptions: ViewportOptions;
  displaySetsInfo: DisplaySetInfo[];
};

export type DisplaySetMatchDetails = {
  StudyInstanceUID?: string;
  displaySetInstanceUID: string;
  matchDetails?: any;
  matchingScores?: DisplaySetMatchDetails[];
  sortingInfo?: any;
};

export type DisplaySetAndViewportOptions = {
  displaySetInstanceUIDs: string[];
  viewportOptions: ViewportOptions;
  displaySetOptions: DisplaySetOptions;
};

export type DisplayArea = {
  type?: 'SCALE' | 'FIT';
  scale?: number;
  interpolationType?: any;
  imageArea?: [number, number]; // areaX, areaY
  imageCanvasPoint?: {
    imagePoint: [number, number]; // imageX, imageY
    canvasPoint?: [number, number]; // canvasX, canvasY
  };
  storeAsInitialCamera?: boolean;
};

export type SetProtocolOptions = {
  /** Used to provide a mapping of what keys are provided for which viewport.
   * For example, a Chest XRay might use have the display set selector id of
   * "ChestXRay", then the user might drag an alternate chest xray from the initially chosen one,
   * and then navigate to another stage or protocol.  If that new stage/protocol
   * uses the name "ChestXRay", then that selection will be used instead of
   * matching the display set selectors.  That allows remembering the
   * user selected views by name.
   * Note the keys are not simple display set selector values, but are:
   * `${activeStudyUID}:${displaySetSelectorId}:${matchingDisplaySetIndex || 0}`
   * This is normally transparent to the user of this, but in order to specify
   * specific instances, they can be added like that.
   */
  displaySetSelectorMap?: Record<string, Array<string>>;

  /** Used to define the display sets already in view, in order to allow
   * filling empty viewports with other instances.
   * Only used when the -1 value for matchedDisplaySetsIndex is provided.
   * List of display set instance UID's already displayed.
   */
  inDisplay?: string[];

  /** Select the given stage, either by ID or position.
   * Don't forget that name is used as the ID if ID not provided.
   */
  stageId?: string;
  stageIndex?: number;

  /** Indicates to setup the protocol and fire the PROTOCOL_RESTORED event
   * but don't fire the protocol changed event.  Used to restore the
   * HP service to a previous state.
   */
  restoreProtocol?: boolean;
};

export type HangingProtocolMatchDetails = {
  displaySetMatchDetails: Map<string, DisplaySetMatchDetails>;
  viewportMatchDetails: Map<string, ViewportMatchDetails>;
};

export type ConstraintValue =
  | string
  | number
  | boolean
  | []
  | string[]
  | {
      value: string | number | boolean | [];
    };

export type Constraint = {
  // This value exactly
  equals?: ConstraintValue;
  notEquals?: ConstraintValue;
  // A caseless contains
  containsI?: string;
  contains?: ConstraintValue;
  doesNotContain?: ConstraintValue;
  greaterThan?: ConstraintValue;
};

export type MatchingRule = {
  // No real use for the id
  id?: string;
  // Defaults to 1
  weight?: number;
  attribute: string;
  constraint?: Constraint;
  // Not required by default
  required?: boolean;
};

export type ViewportLayoutOptions = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ViewportStructure = {
  layoutType: string;
  properties: {
    rows: number;
    columns: number;
    layoutOptions?: ViewportLayoutOptions[];
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
export type DisplaySetSelector = {
  id?: string;

  /**
   *  This can be set to true to allow unmatched views to replace a view showing this instance
   * This is done at hte display set selector level to ensure that viewports sharing a display set
   * don't get different values of allowUnmatchedView
   */
  allowUnmatchedView?: boolean;

  // The image matching rule (not currently implemented) selects which image to
  // display initially, only for stack views.
  imageMatchingRules?: MatchingRule[];
  // The matching rules to choose the display sets at the series level
  seriesMatchingRules: MatchingRule[];
  studyMatchingRules?: MatchingRule[];
};

export type OverlaySelector = {
  id?: string;
  matchingRules: MatchingRule[];
};

export type SyncGroup = {
  type: string;
  id: string;
  source?: boolean;
  target?: boolean;
  options?: object;
};

/** Declares a custom option, that is a computed type value */
export type CustomOptionAttribute<T> = {
  custom: string;
  defaultValue?: T;
};

export type CustomOption<T> = CustomOptionAttribute<T> | T;

export type initialImageOptions = {
  index?: number;
  preset?: string; // todo: type more
};

export type ViewportOptions = {
  toolGroupId?: CustomOption<string>;
  viewportType?: CustomOption<string>;
  id?: string;
  orientation?: CustomOption<string>;
  background?: CustomOption<[number, number, number]>;
  viewportId?: string;
  displayArea?: DisplayArea;
  initialImageOptions?: CustomOption<initialImageOptions>;
  syncGroups?: CustomOption<SyncGroup>[];
  customViewportProps?: Record<string, unknown>;
  /**
   * Set to true to allow non-matching drag and drop or options provided
   * from options.displaySetSelectorsMap
   * @deprecated Moving to display set selector
   */
  allowUnmatchedView?: boolean;
};

// The options here includes both the display set selector and matching index
// as well as actual options to apply to the individual viewports.
export type DisplaySetOptions = {
  // The id is used to choose which display set selector to apply here
  id: string;
  /** The offset to allow display secondary series, for example
   * to display the second matching series, use `matchedDisplaySetsIndex==1` */
  matchedDisplaySetsIndex?: number;

  // The options to apply to the display set.
  options?: Record<string, unknown>;
};

// some options for overlays
// such as segmentation options
export type OverlayOptions = {
  id?: string;
  options?: Record<string, unknown>;
};

export type Viewport = {
  viewportOptions: ViewportOptions;
  displaySets: DisplaySetOptions[];
  overlays?: OverlayOptions[];
};

/**
 * disabled stages are missing display sets required in order to view them.
 * enabled stages have all the requiredDisplaySets and at least preferredViewports
 * filled.
 * passive stages have the requiredDisplaySets and at least requiredViewports filled.
 */
export type StageStatus = 'disabled' | 'enabled' | 'passive';

/** Controls whether a stage is activated or not, at the given level, by
 * controlling the status of the stage.
 */
export type StageActivation = {
  // The minimum number of viewports to be NON-blank to activate this level of the stage
  minViewportsMatched?: number;
  // The required set of display set selectors to have at least 1 match to activate
  displaySetSelectorsMatched?: string[];
};

/**
 * Protocol stages are a set of different views which can be applied, for
 * example, a 2x1 and a 1x1 view might be both applied (see default extension
 * for this example).
 */
export type ProtocolStage = {
  /** The id defaults to the name of the protocol if not otherwise specified */
  id?: string;
  /**
   * The display name used for this stage when shown to the user.  This can
   * differ from the id, for example, to use the same name for different
   * stages, only one of which ends up being active.
   */
  name: string;
  /** Indicate if the stage can be applied or not */
  status?: StageStatus;

  viewportStructure: ViewportStructure;
  stageActivation?: {
    // The enabled activation is provided for fully active stages,
    // participating in automatic stage selection and navigation
    enabled?: StageActivation;
    // The passive activation is provided to allow stages to manually
    // be activated, but not navigated to by default, or used on initial view
    passive?: StageActivation;
  };

  /** A viewport definition used for to fill in manually selected viewports.
   * This allows changing the layout definition for additional viewports without
   * needing to define layouts for each of the 1x1, 2x2 etc modes.
   */
  defaultViewport?: Viewport;

  viewports: Viewport[];

  // Unused.
  createdDate?: string;
};

// Add notifications for various types of events.
export type ProtocolNotifications = {
  // This set of commands is executed after the protocol is exited and the new one applied
  onProtocolExit?: Command[];
  // This set of commands is executed after the protocol is entered and applied
  onProtocolEnter?: Command[];
  // This set of commands is executed before the layout change is started.
  // If it returns false, the layout change will be aborted.
  // The numRows and numCols is included in the command params, so it is possible
  // to apply a specific hanging protocol
  onLayoutChange?: Command[];
  // This set of commands is executed after the initial viewport grid data is set
  // and all viewport data includes a designated display set. This command
  // will run on every stage's initial layout.
  onViewportDataInitialized?: Command[];
  // This set of commands is executed before the stage change is applied
  onStageChange?: Command[];
};

/**
 * A protocol is the top level definition for a hanging protocol.
 * It is a set of rules about when the protocol can be applied at all,
 * as well as a set of stages that represent individual views.
 * Additionally, the display set selectors are used to choose from the existing
 * display sets.  The hanging protocol definition here does NOT allow
 * redefining the display sets to use, but only selects the views to show.
 */
export type Protocol = {
  // Mandatory
  id: string;
  /** A description of this protocol.  Used as a tool tip for the user. */
  description?: string;
  /** Maps ids to display set selectors to choose display sets */
  displaySetSelectors: Record<string, DisplaySetSelector>;
  /** overlay selectors that decide whether an overlay such as segmentation should be shown or not */
  overlaySelectors?: Record<string, OverlaySelector>;
  /** A default viewport to use for any stage to select new viewport layouts. */
  defaultViewport?: Viewport;
  stages: ProtocolStage[];
  // Optional
  locked?: boolean;
  name?: string;
  createdDate?: string;
  modifiedDate?: string;
  availableTo?: Record<string, unknown>;
  editableBy?: Record<string, unknown>;
  toolGroupIds?: string[];
  // A set of callbacks relevant to entering and exiting the protocol
  callbacks?: ProtocolNotifications;
  imageLoadStrategy?: string; // Todo: this should be types specifically
  protocolMatchingRules?: MatchingRule[];
  /* The number of priors required for this hanging protocol.
   * -1 means that NO priors are referenced, and thus this HP matches
   * only the active study, whereas 0 means that an unknown number of
   * priors is matched.  Positive values mean at least that many priors are
   * required.
   * Replaces hasUpdatedPriors
   */
  numberOfPriorsReferenced?: number;
  syncDataForViewports?: boolean;
  /**
   * Set of minimal conditions necessary to run the hanging protocol.
   */
  hpInitiationCriteria?: {
    /* If configured, sets the minimum number of series needed to run the hanging
     * protocol and start displaying images. Used when OHIF needs to handle studies
     * with several series and it is required that the first image should be loaded
     * faster.
     */
    minSeriesLoaded: number;
  };

  /*
   * The icon to use for this protocol.  This is used to display the protocol
   * in the advanced layout selector.
   */

  icon?: string;

  /** Indicates if the protocol is a preset or not. Useful for setting presets for the layout selector */
  isPreset?: true;
};

/** Used to dynamically generate protocols.
 * Try to avoid this as it is difficult to provide active/disabled settings
 * to the GUI when this is used, and it can be expensive to apply.
 * Alternatives include using the custom attributes where possible.
 */
export type ProtocolGenerator = ({ servicesManager, commandsManager }: withAppTypes) => {
  protocol: Protocol;
};

export type HPInfo = {
  protocolId: string;
  stageId: string;
  stageIndex: number;
  activeStudyUID: string;
};
