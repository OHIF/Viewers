//Creating aliases for Cornerstone tools buttons
export function initCornerstoneToolsAliases() {
  cy.get('[data-cy="StackScroll"]').as('stackScrollBtn');
  cy.get('[data-cy="Zoom"]').as('zoomBtn');
  cy.get('[data-cy="Wwwc-split-button-primary"]').as('wwwcBtnPrimary');
  cy.get('[data-cy="Wwwc-split-button-secondary"]').as('wwwcBtnSecondary');
  cy.get('[data-cy="Pan"]').as('panBtn');
  cy.get('[data-cy="MeasurementTools-split-button-primary"]').as('measurementToolsBtnPrimary');
  cy.get('[data-cy="MeasurementTools-split-button-secondary"]').as('measurementToolsBtnSecondary');
  cy.get('[data-cy="Angle"]').as('angleBtn');
  cy.get('[data-cy="MoreTools-split-button-primary"]').as('moreBtnPrimary');
  cy.get('[data-cy="MoreTools-split-button-secondary"]').as('moreBtnSecondary');
  cy.get('[data-cy="Layout"]').as('layoutBtn');
  cy.get('.viewport-element').as('viewport');
}

//Creating aliases for Common page elements
export function initCommonElementsAliases() {
  cy.get('[data-cy="trackedMeasurements-btn"]').as('measurementsBtn');
  cy.get('.viewport-element').as('viewport');
  cy.get('[data-cy="seriesList-btn"]').as('seriesBtn');

  // TODO: Panels are not in DOM when closed, move this somewhere else
  cy.get('[data-cy="trackedMeasurements-panel"]').as('measurementsPanel');
  cy.get('[data-cy="studyBrowser-panel"]').as('seriesPanel');
  cy.get('[data-cy="viewport-overlay-top-right"]').as('viewportInfoTopRight');
  cy.get('[data-cy="viewport-overlay-top-left"]').as('viewportInfoTopLeft');
  cy.get('[data-cy="viewport-overlay-bottom-right"]').as('viewportInfoBottomRight');
  cy.get('[data-cy="viewport-overlay-bottom-left"]').as('viewportInfoBottomLeft');

  cy.get('.left-mid.orientation-marker').as('viewportInfoMidLeft');
  cy.get('.top-mid.orientation-marker').as('viewportInfoMidTop');
}

//Creating aliases for Routes
export function initRouteAliases() {
  cy.server();
  cy.route('GET', '**/series**').as('getStudySeries');
  cy.route('GET', '**/studies**').as('getStudies');
}

//Creating aliases for Study List page elements on Desktop experience
export function initStudyListAliasesOnDesktop() {
  cy.get('[data-cy="num-studies"]').as('numStudies');
  cy.get('[data-cy="input-patientName"]').as('PatientName');
  cy.get('[data-cy="input-mrn"]').as('MRN');
  cy.get('[data-cy="input-accession"]').as('AccessionNumber');
  cy.get('[data-cy="input-description"]').as('StudyDescription');
  cy.get('[data-cy="study-list-results"]').as('searchResult');
  cy.get('[data-cy="study-list-results"] > tr').as('searchResult2');

  // We can't use data attributes (e.g. data--cy) for these since
  // they are using third party libraires (i.e. react-dates, react-select)
  cy.get('#date-range-studyDate-start-date').as('studyListStartDate');
  cy.get('#date-range-studyDate-end-date').as('studyListEndDate');
  cy.get('#input-modalities').as('modalities');
}

//Creating aliases for User Preferences modal
export function initPreferencesModalAliases() {
  cy.get('.OHIFModal').as('preferencesModal');
  cy.get('[data-cy="hotkeys"]').as('userPreferencesHotkeysTab');
  cy.get('[data-cy="general"]').as('userPreferencesGeneralTab');
  cy.get('[data-cy="window-level"]').as('userPreferencesWindowLevelTab');
  initPreferencesModalFooterBtnAliases();
}

//Creating aliases for User Preferences modal
export function initPreferencesModalFooterBtnAliases() {
  cy.get('.active [data-cy="reset-default-btn"]').as('restoreBtn');
  cy.get('.active [data-cy="cancel-btn"]').as('cancelBtn');
  cy.get('.active [data-cy="save-btn"]').as('saveBtn');
}
