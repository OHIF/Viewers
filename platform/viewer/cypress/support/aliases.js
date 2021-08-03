//Creating aliases for Cornerstone tools buttons
export function initCornerstoneToolsAliases() {
  cy.get('[data-cy="stack scroll"]').as('stackScrollBtn');
  cy.get('[data-cy="zoom"]').as('zoomBtn');
  cy.get('[data-cy="levels"]').as('levelsBtn');
  cy.get('[data-cy="pan"]').as('panBtn');
  cy.get('[data-cy="length"]').as('lengthBtn');
  cy.get('[data-cy="annotate"]').as('annotateBtn');
  cy.get('[data-cy="angle"]').as('angleBtn');
  cy.get('[data-cy="reset"]').as('resetBtn');
  cy.get('[data-cy="cine"]').as('cineBtn');
  cy.get('[data-cy="more"]').as('moreBtn');
  cy.get('[data-cy="layout"]').as('layoutBtn');
  cy.get('.viewport-element').as('viewport');
}

//Creating aliases for Common page elements
export function initCommonElementsAliases() {
  cy.get(
    '.pull-right > .RoundedButtonGroup > .roundedButtonWrapper:first-of-type > .roundedButton'
  ).as('measurementsBtn');
  cy.get('.viewport-element').as('viewport');
  cy.get('section.sidepanel.from-right').as('measurementsPanel');
  cy.get(
    '.pull-left > .RoundedButtonGroup > .roundedButtonWrapper > .roundedButton'
  ).as('seriesBtn');
  cy.get('section.sidepanel.from-left').as('seriesPanel');
  cy.get('div.OHIFCornerstoneViewportOverlay > div.bottom-left.overlay-element > div').as(
    'viewportInfoBottomLeft'
  );
  cy.get('div.OHIFCornerstoneViewportOverlay > div.bottom-right.overlay-element > div').as(
    'viewportInfoBottomRight'
  );
  cy.get('.left-mid.orientation-marker').as('viewportInfoMidLeft');
  cy.get('.top-mid.orientation-marker').as('viewportInfoMidTop');
}

//Creating aliases for Routes
export function initRouteAliases() {
  cy.server();
  cy.route('GET', '**/series**').as('getStudySeries');
  cy.route('GET', '**/studies**').as('getStudies');
}

//Creating aliases for VTK tools buttons
export function initVTKToolsAliases() {
  cy.get('[data-cy="exit 2d mpr"]').as('exit2dmprBtn');
  cy.get('[data-cy="crosshairs"]').as('crosshairsBtn');
  cy.get('[data-cy="wwwc"]').as('wwwcBtn');
  cy.get('.slab-thickness').as('slabSlider');
  cy.get('.select-ohif').as('modeDropdown');
  cy.get('.ohif-check-label').as('modeCheckbox');
  cy.get('[data-cy="layout"]').as('layoutBtn');
}

//Creating aliases for Study List page elements on Desktop experience
export function initStudyListAliasesOnDesktop() {
  cy.get('.study-count').as('studyCount');
  cy.get('#filter-PatientName').as('PatientName');
  cy.get('#filter-PatientID').as('MRN');
  cy.get('#filter-AccessionNumber').as('AccessionNumber');
  cy.get('#start-date').as('studyListStartDate');
  cy.get('#end-date').as('studyListEndDate');
  cy.get('#filter-modalities').as('modalities');
  cy.get('#filter-StudyDescription').as('StudyDescription');
  cy.get('[data-cy="study-list-results"] > tr').as('searchResult');
}

//Creating aliases for Study List page elements on Tablet experience
export function initStudyListAliasesOnTablet() {
  cy.get('.study-count').as('studyCount');
  cy.get('#filter-patientNameOrId').as('patientNameOrMRN');
  cy.get('#filter-accessionOrModalityOrDescription').as(
    'accessionModalityDescription'
  );
  cy.get('#start-date').as('studyListStartDate');
  cy.get('#end-date').as('studyListEndDate');
  cy.get('[data-cy="study-list-results"] > tr').as('searchResult');
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
