describe('Visual Regression - OHIF User Preferences', () => {
  context('Study List Page', function() {
    before(() => {
      cy.visit('/');
    });

    beforeEach(() => {
      // Open User Preferences modal
      cy.openPreferences();
    });

    afterEach(() => {
      // Close User Preferences modal
      cy.closePreferences();
    });

    it('checks displayed information on User Preferences modal', function() {
      // Go go hotkeys tab
      cy.selectPreferencesTab('@userPreferencesHotkeysTab');
      cy.get('@restoreBtn').scrollIntoView();

      // Visual comparison
      cy.percyCanvasSnapshot(
        'User Preferences Modal - Hotkeys tab initial state in StudyList page'
      );
      cy.get('[data-cy="close-button"]').click();
    });

    it('checks translation by selecting Spanish language', function() {
      cy.selectPreferencesTab('@userPreferencesGeneralTab');

      // Language dropdown should be displayed
      cy.get('#language-select').should('be.visible');

      // Visual comparison
      cy.percyCanvasSnapshot(
        'User Preferences Modal - General tab initial state in StudyList page'
      );
      // Set language to Spanish and save
      cy.setLanguage('Spanish');

      // Options menu should be translated
      cy.get('[data-cy="options-menu"]')
        .should('have.text', 'Opciones')
        .click();

      // Visual comparison
      cy.percyCanvasSnapshot(
        'User Preferences Modal - Spanish selected in StudyList page'
      );

      // Close Options menu
      cy.get('[data-cy="options-menu"]').click();
    });
  });

  context('Study Viewer Page', function() {
    before(() => {
      cy.openStudyInViewer('1.2.840.113619.2.5.1762583153.215519.978957063.78');
      cy.expectMinimumThumbnails(3);
    });

    beforeEach(() => {
      cy.initCommonElementsAliases();
      cy.resetViewport();

      cy.resetUserHotkeyPreferences();
      // Open User Preferences modal
      cy.openPreferences();
    });

    afterEach(() => {
      // Close User Preferences modal
      cy.closePreferences();
    });

    it('checks displayed information on User Preferences modal', function() {
      // Go go hotkeys tab
      cy.selectPreferencesTab('@userPreferencesHotkeysTab');
      cy.get('@restoreBtn').scrollIntoView();

      // Visual comparison
      cy.percyCanvasSnapshot(
        'User Preferences Modal - Hotkeys tab initial state in StudyViewer page'
      );
      cy.get('[data-cy="close-button"]').click(); //close User Preferences modal
    });

    it('checks if W/L Preferences table is being displayed in the Window Level tab', function() {
      //Navigate to Window Level tab
      cy.selectPreferencesTab('@userPreferencesWindowLevelTab');

      // Visual comparison
      cy.percyCanvasSnapshot(
        'User Preferences Modal - Window Level Presets Tab'
      );
    });

    it('checks translation by selecting Spanish language', function() {
      cy.selectPreferencesTab('@userPreferencesGeneralTab');

      // Visual comparison
      cy.percyCanvasSnapshot(
        'User Preferences Modal - General tab initial state in StudyViewer page'
      );
      // Set language to Spanish
      cy.setLanguage('Spanish');

      // Options menu should be translated
      cy.get('[data-cy="options-menu"]')
        .should('have.text', 'Opciones')
        .click();

      // Visual comparison
      cy.percyCanvasSnapshot(
        'User Preferences Modal - Spanish selected in StudyViewer page'
      );

      // Close Options menu
      cy.get('[data-cy="options-menu"]').click();
    });

    it('checks if user can restore to default the language selection and application will be in English', function() {
      cy.selectPreferencesTab('@userPreferencesGeneralTab');

      // Set language to Spanish
      cy.setLanguage('Spanish');

      // Open User Preferences modal
      cy.openPreferences();

      // Go to general tab
      cy.selectPreferencesTab('@userPreferencesGeneralTab');

      cy.get('@restoreBtn')
        .scrollIntoView()
        .click();

      cy.get('@saveBtn')
        .scrollIntoView()
        .click();

      // Options menu should be in English
      cy.get('[data-cy="options-menu"]')
        .should('have.text', 'Options')
        .click();

      // Visual comparison
      cy.percyCanvasSnapshot(
        'User Preferences Modal - English selected in StudyViewer page'
      );

      // Close Options menu
      cy.get('[data-cy="options-menu"]').click();
    });

    it('checks new hotkeys for "Next" and "Previous" Image on Viewport', function() {
      // Go go hotkeys tab
      cy.selectPreferencesTab('@userPreferencesHotkeysTab');

      // Set new hotkey for 'Next Image Viewport' function
      cy.setNewHotkeyShortcutOnUserPreferencesModal(
        'Next Viewport',
        '{shift}{rightarrow}'
      );

      // Set new hotkey for 'Previous Image Viewport' function
      cy.setNewHotkeyShortcutOnUserPreferencesModal(
        'Previous Viewport',
        '{shift}{leftarrow}'
      );

      // Save new hotkeys
      cy.get('@saveBtn')
        .scrollIntoView()
        .click();

      // Set 3 viewports layout
      cy.setLayout(3, 1);
      cy.waitViewportImageLoading();

      // Rotate Right and Invert colors on Viewport #1
      cy.get('body').type('RI');

      //Move to Next Viewport
      cy.get('body').type('{shift}{rightarrow}');
      // Rotate Left and Invert colors on Viewport #2
      cy.get('body').type('LI');

      //Move to Previous Viewport
      cy.get('body').type('{shift}{leftarrow}');
      // Reset viewport #1 with spacebar hotkey
      cy.get('body').type(' ');

      // Visual comparison
      cy.percyCanvasSnapshot(
        'Viewport Navigation - 2nd viewport inverted and rotated'
      );
      // Set 1 viewport layout
      cy.setLayout(1, 1);
    });
  });
});
