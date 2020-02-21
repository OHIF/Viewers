describe('Visual Regression - OHIF User Preferences', () => {
  context('Study List Page', function() {
    before(() => {
      cy.visit('/');
    });

    beforeEach(() => {
      // Open User Preferences modal
      cy.openPreferences();
      cy.initPreferencesModalAliases();
    });

    it('checks displayed information on User Preferences modal', function() {
      cy.get('@restoreBtn').scrollIntoView();

      // Visual comparison
      cy.percyCanvasSnapshot(
        'User Preferences Modal - Hotkeys tab initial state in StudyList page'
      );
      cy.get('[data-cy="close-button"]').click();
    });

    it('checks translation by selecting Spanish language', function() {
      cy.changePreferencesTab('@userPreferencesGeneralTab');
      cy.get('@userPreferencesGeneralTab').should('have.class', 'active');

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
      cy.openStudy('MISTER^MR');
      cy.expectMinimumThumbnails(5);
    });

    beforeEach(() => {
      cy.initCommonElementsAliases();
      cy.resetViewport();

      cy.resetUserHoktkeyPreferences();
      // Open User Preferences modal
      cy.openPreferences();
    });

    it('checks displayed information on User Preferences modal', function() {
      cy.get('@restoreBtn').scrollIntoView();

      // Visual comparison
      cy.percyCanvasSnapshot(
        'User Preferences Modal - Hotkeys tab initial state in StudyViewer page'
      );
      cy.get('[data-cy="close-button"]').click(); //close User Preferences modal
    });

    it('checks translation by selecting Spanish language', function() {
      cy.changePreferencesTab('@userPreferencesGeneralTab');
      cy.get('@userPreferencesGeneralTab').should('have.class', 'active');

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
      cy.changePreferencesTab('@userPreferencesGeneralTab');
      cy.get('@userPreferencesGeneralTab').should('have.class', 'active');

      // Set language to Spanish
      cy.setLanguage('Spanish');

      // Open User Preferences modal
      cy.openPreferences();

      // Go to general tab
      cy.changePreferencesTab('@userPreferencesGeneralTab');

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
      cy.changePreferencesTab('@userPreferencesHotkeysTab');
      cy.get('@userPreferencesHotkeysTab').should('have.class', 'active');

      // Set new hotkey for 'Next Image Viewport' function
      cy.setNewHotkeyShortcutOnUserPreferencesModal(
        'Next Image Viewport',
        '{shift}{rightarrow}'
      );

      // Set new hotkey for 'Previous Image Viewport' function
      cy.setNewHotkeyShortcutOnUserPreferencesModal(
        'Previous Image Viewport',
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
