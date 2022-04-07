describe('OHIF User Preferences', () => {
  context('Study List Page', function() {
    before(() => {
      cy.visit('/');
    });

    beforeEach(() => {
      // Open User Preferences modal
      cy.openPreferences();
    });

    it('checks displayed information on User Preferences modal', function() {
      cy.initPreferencesModalAliases();
      //Check Title
      cy.get('@preferencesModal').should('contain.text', 'User Preferences');
      //Check tabs
      cy.get('@userPreferencesHotkeysTab')
        .should('have.text', 'Hotkeys')
        .and('have.class', 'active');
      cy.get('@userPreferencesGeneralTab').should('have.text', 'General');
      cy.get('@userPreferencesWindowLevelTab').should(
        'have.text',
        'Window Level'
      );
      //Check buttons
      cy.get('@restoreBtn')
        .scrollIntoView()
        .should('have.text', 'Reset to Defaults');
      cy.get('@cancelBtn').should('have.text', 'Cancel');
      cy.get('@saveBtn').should('have.text', 'Save');

      cy.get('[data-cy="close-button"]').click();
    });

    it('checks translation by selecting Spanish language', function() {
      cy.selectPreferencesTab('@userPreferencesGeneralTab');

      // Language dropdown should be displayed
      cy.get('#language-select').should('be.visible');

      // Set language to Spanish and save
      cy.setLanguage('Spanish');

      // Header should be translated to Spanish
      cy.get('.research-use')
        .scrollIntoView()
        .should('have.text', 'SOLO USO PARA INVESTIGACIÓN');

      // Options menu should be translated
      cy.get('[data-cy="options-menu"]')
        .should('have.text', 'Opciones')
        .click();

      cy.get('[data-cy="dd-item-menu"]')
        .first()
        .should('contain.text', 'Acerca de');
      cy.get('[data-cy="dd-item-menu"]')
        .last()
        .should('contain.text', 'Preferencias');

      // Close Options menu
      cy.get('[data-cy="options-menu"]').click();
    });

    it('checks if user can cancel the language selection and application will be in "English (USA)"', function() {
      // Set language to English and save
      cy.setLanguage('English (USA)');

      // Set language to Spanish and cancel
      cy.setLanguage('Spanish', false);

      // Header should be kept in "English (USA)"
      cy.get('.research-use')
        .scrollIntoView()
        .should('have.text', 'INVESTIGATIONAL USE ONLY');

      // Options menu should be translated
      cy.get('[data-cy="options-menu"]')
        .should('have.text', 'Options')
        .click();

      cy.get('[data-cy="dd-item-menu"]')
        .first()
        .should('contain.text', 'About');
      cy.get('[data-cy="dd-item-menu"]')
        .last()
        .should('contain.text', 'Preferences');

      // Close Options menu
      cy.get('[data-cy="options-menu"]').click();
    });

    it('checks if user can restore to default the language selection and application will be in "English (USA)"', function() {
      // Set language to Spanish
      cy.setLanguage('Spanish');

      //Open Preferences again
      cy.openPreferences();

      // Go to general tab
      cy.selectPreferencesTab('@userPreferencesGeneralTab');

      cy.get('@restoreBtn')
        .scrollIntoView()
        .click();

      // Close Success Message overlay (if displayed)
      cy.get('body').then(body => {
        if (body.find('.sb-closeIcon').length > 0) {
          cy.get('.sb-closeIcon').click({ force: true });
        }
        // click on save button
        cy.get('@saveBtn')
          .scrollIntoView()
          .click();
      });

      // Header should be in "English (USA)"
      cy.get('.research-use')
        .scrollIntoView()
        .should('have.text', 'INVESTIGATIONAL USE ONLY');

      // Options menu should be in "English (USA)"
      cy.get('[data-cy="options-menu"]')
        .should('have.text', 'Options')
        .click();

      cy.get('[data-cy="dd-item-menu"]')
        .first()
        .should('contain.text', 'About');
      cy.get('[data-cy="dd-item-menu"]')
        .last()
        .should('contain.text', 'Preferences');

      // Close options Menu
      cy.get('[data-cy="options-menu"]').click();
    });

    it('checks if W/L Preferences table is being displayed in the Window Level tab', function() {
      //Navigate to Window Level tab
      cy.selectPreferencesTab('@userPreferencesWindowLevelTab');

      //Check table header
      cy.get('.wlRow.header')
        .should('contains.text', 'Preset')
        .and('contains.text', 'Description')
        .and('contains.text', 'Window')
        .and('contains.text', 'Level');

      //Check table has more than 1 row (more than header)
      cy.get('.wlRow')
        .its('length')
        .should('be.greaterThan', 1);
    });

    it('checks if Preferences set in Study List Page will be consistent on Viewer Page', function() {
      // Go go hotkeys tab
      cy.selectPreferencesTab('@userPreferencesHotkeysTab');

      // Set new hotkey for 'Rotate Right' function
      cy.setNewHotkeyShortcutOnUserPreferencesModal('Rotate Right', '{shift}Q');

      // Close Success Message overlay (if displayed)
      cy.get('body').then(body => {
        if (body.find('.sb-closeIcon').length > 0) {
          cy.get('.sb-closeIcon').click({ force: true });
        }
        // click on save button
        cy.get('@saveBtn')
          .scrollIntoView()
          .click();
      });

      // Open User Preferences modal again
      cy.openPreferences();

      // Go to General tab
      cy.selectPreferencesTab('@userPreferencesGeneralTab');

      // Set language to Spanish
      cy.setLanguage('Spanish');

      // Go to Study Viewer page
      cy.checkStudyRouteInViewer(
        '1.2.840.113619.2.5.1762583153.215519.978957063.78'
      );
      cy.expectMinimumThumbnails(3);
      cy.initCommonElementsAliases();

      // Check if application is in Spanish
      // Header should be translated to Spanish
      cy.get('.research-use')
        .scrollIntoView()
        .should('have.text', 'SOLO USO PARA INVESTIGACIÓN');

      // Options menu should be translated
      cy.get('[data-cy="options-menu"]')
        .should('have.text', 'Opciones')
        .click();
      cy.get('[data-cy="dd-item-menu"]')
        .first()
        .should('contain.text', 'Acerca de');
      cy.get('[data-cy="dd-item-menu"]')
        .last()
        .should('contain.text', 'Preferencias');

      // Check if new hotkey is working on viewport
      cy.get('body').type('{shift}Q', {
        release: false,
      });
      cy.get('@viewportInfoMidTop').should('contains.text', 'R');
    });
  });

  context('Study Viewer Page', function() {
    before(() => {
      cy.checkStudyRouteInViewer(
        '1.2.840.113619.2.5.1762583153.215519.978957063.78'
      );
      cy.expectMinimumThumbnails(3);
    });

    beforeEach(() => {
      cy.initCommonElementsAliases();
      cy.resetViewport();

      cy.resetUserHotkeyPreferences();
      cy.resetUserGeneralPreferences();
      // Open User Preferences modal
      cy.openPreferences();
    });

    afterEach(() => {
      // Close User Preferences Modal (if displayed)
      cy.get('body').then(body => {
        if (body.find('.OHIFModal__header').length > 0) {
          cy.get('[data-cy="close-button"]').click({ force: true });
        }
      });
    });

    it('checks displayed information on User Preferences modal', function() {
      cy.get('@preferencesModal').should('contain.text', 'User Preferences');
      cy.get('@userPreferencesHotkeysTab')
        .should('have.text', 'Hotkeys')
        .and('have.class', 'active');
      cy.get('@userPreferencesGeneralTab').should('have.text', 'General');
      cy.get('@userPreferencesWindowLevelTab').should(
        'have.text',
        'Window Level'
      );
      cy.get('@restoreBtn')
        .scrollIntoView()
        .should('have.text', 'Reset to Defaults');
      cy.get('@cancelBtn').should('have.text', 'Cancel');
      cy.get('@saveBtn').should('have.text', 'Save');
    });

    it('checks translation by selecting Spanish language', function() {
      cy.selectPreferencesTab('@userPreferencesGeneralTab');

      // Language dropdown should be displayed
      cy.get('#language-select').should('be.visible');

      // Set language to Spanish
      cy.setLanguage('Spanish');

      // Header should be translated to Spanish
      cy.get('.research-use')
        .scrollIntoView()
        .should('have.text', 'SOLO USO PARA INVESTIGACIÓN');

      // Options menu should be translated
      cy.get('[data-cy="options-menu"]')
        .should('have.text', 'Opciones')
        .click();

      cy.get('[data-cy="dd-item-menu"]')
        .first()
        .should('contain.text', 'Acerca de');
      cy.get('[data-cy="dd-item-menu"]')
        .last()
        .should('contain.text', 'Preferencias');
    });

    it('checks if user can cancel the language selection and application will be in "English (USA)"', function() {
      // Set language to English and save
      cy.setLanguage('English (USA)');

      // Set language to Spanish and cancel
      cy.setLanguage('Spanish', false);

      // Header should be kept in "English (USA)"
      cy.get('.research-use')
        .scrollIntoView()
        .should('have.text', 'INVESTIGATIONAL USE ONLY');

      // Options menu should be translated
      cy.get('[data-cy="options-menu"]')
        .should('have.text', 'Options')
        .click();

      cy.get('[data-cy="dd-item-menu"]')
        .first()
        .should('contain.text', 'About');
      cy.get('[data-cy="dd-item-menu"]')
        .last()
        .should('contain.text', 'Preferences');
    });

    it('checks if user can restore to default the language selection and application will be in "English (USA)', function() {
      cy.selectPreferencesTab('@userPreferencesGeneralTab');

      // Language dropdown should be displayed
      cy.get('#language-select').should('be.visible');

      // Set language to Spanish
      cy.setLanguage('Spanish');

      // Open User Preferences modal
      cy.openPreferences();

      // Go to general tab
      cy.selectPreferencesTab('@userPreferencesGeneralTab');

      // click on restore button
      cy.get('@restoreBtn')
        .scrollIntoView()
        .click();

      // click on save button
      cy.get('@saveBtn')
        .scrollIntoView()
        .click();


      // Header should be in "English (USA)""
      cy.get('.research-use')
        .scrollIntoView()
        .should('have.text', 'INVESTIGATIONAL USE ONLY');

      // Options menu should be in "English (USA)"
      cy.get('[data-cy="options-menu"]')
        .should('have.text', 'Options')
        .click();
      cy.get('[data-cy="dd-item-menu"]')
        .first()
        .should('contain.text', 'About');
      cy.get('[data-cy="dd-item-menu"]')
        .last()
        .should('contain.text', 'Preferences');
    });

    it('checks new hotkeys for "Rotate Right" and "Rotate Left"', function() {
      // Go go hotkeys tab
      cy.selectPreferencesTab('@userPreferencesHotkeysTab');

      // Set new hotkey for 'Rotate Right' function
      cy.setNewHotkeyShortcutOnUserPreferencesModal(
        'Rotate Right',
        '{shift}{rightarrow}'
      );
      // Set new hotkey for 'Rotate Left' function
      cy.setNewHotkeyShortcutOnUserPreferencesModal(
        'Rotate Left',
        '{shift}{leftarrow}'
      );

      // Close Success Message overlay (if displayed)
      cy.get('body').then(body => {
        if (body.find('.sb-closeIcon').length > 0) {
          cy.get('.sb-closeIcon').click({ force: true });
        }
        // click on save button
        cy.get('@saveBtn')
          .scrollIntoView()
          .click();
      });

      //Rotate Right with new Hotkey
      cy.get('body').type('{shift}{rightarrow}');
      cy.get('@viewportInfoMidTop').should('contains.text', 'R');

      //Rotate Left with new Hotkey
      cy.get('body').type('{shift}{leftarrow}');
      cy.get('@viewportInfoMidTop').should('contains.text', 'A');
    });

    it('checks new hotkeys for "Next" and "Previous" Image on Viewport', function() {
      // Update hotkeys for 'Next/Previous Viewport'
      cy.selectPreferencesTab('@userPreferencesHotkeysTab');

      cy.setNewHotkeyShortcutOnUserPreferencesModal(
        'Next Viewport',
        '{shift}{rightarrow}'
      );
      cy.setNewHotkeyShortcutOnUserPreferencesModal(
        'Previous Viewport',
        '{shift}{leftarrow}'
      );
      // Close Success Message overlay (if displayed)
      cy.get('body').then(body => {
        if (body.find('.sb-closeIcon').length > 0) {
          cy.get('.sb-closeIcon').click({ force: true });
        }
        // click on save button
        cy.get('@saveBtn')
          .scrollIntoView()
          .click();
      });

      // Set 3 viewports layout
      cy.setLayout(3, 1);
      cy.waitViewportImageLoading();

      // Reset, Rotate Right and Invert colors on Viewport #1
      cy.get('body').type(' ');
      cy.get('body').type('r');
      cy.get('body').type('i');

      // Shift active viewport to next
      // Reset, Rotate Left and Invert colors on Viewport #2
      cy.get('body').type('{shift}{rightarrow}');
      cy.get('body').type(' ');
      cy.get('body').type('l');
      cy.get('body').type('i');

      // Verify 1st viewport was rotated
      cy.get('@viewportInfoMidTop').should('contains.text', 'R');

      // Verify 2nd viewport was rotated
      cy.get(
        ':nth-child(2) > .viewport-wrapper > .viewport-element > .ViewportOrientationMarkers.noselect > .top-mid.orientation-marker'
      ).as('viewport2InfoMidTop');
      cy.get('@viewport2InfoMidTop').should('contains.text', 'P');

      //Move to Previous Viewport
      cy.get('body').type('{shift}{leftarrow}');
      // Reset viewport #1 with spacebar hotkey
      cy.get('body').type(' ');
      cy.get('@viewportInfoMidTop').should('contains.text', 'A');

      // Set 1 viewport layout
      cy.setLayout(1, 1);
    });

    it('checks error message when duplicated hotkeys are inserted', function() {
      // Go go hotkeys tab
      cy.selectPreferencesTab('@userPreferencesHotkeysTab');

      // Set duplicated hotkey for 'Rotate Right' function
      cy.setNewHotkeyShortcutOnUserPreferencesModal('Rotate Right', '{i}');

      // Check error message
      cy.get('.HotkeysPreferences').within(() => {
        cy.contains('Rotate Right') // label we're looking for
          .parent()
          .find('.preferencesInputErrorMessage')
          .as('errorMsg')
          .should('have.text', '"Invert" is already using the "i" shortcut.');
      });
    });

    it('checks error message when invalid hotkey is inserted', function() {
      // Go go hotkeys tab
      cy.selectPreferencesTab('@userPreferencesHotkeysTab');

      // Set invalid hotkey for 'Rotate Right' function
      cy.setNewHotkeyShortcutOnUserPreferencesModal('Rotate Right', '{ctrl}Z');

      // Check error message
      cy.get('.HotkeysPreferences').within(() => {
        cy.contains('Rotate Right') // label we're looking for
          .parent()
          .find('.preferencesInputErrorMessage')
          .as('errorMsg')
          .should('have.text', '"ctrl+z" shortcut combination is not allowed');
      });
    });

    it('checks error message when only modifier keys are inserted', function() {
      // Go go hotkeys tab
      cy.selectPreferencesTab('@userPreferencesHotkeysTab');

      // Set invalid modifier key: ctrl
      cy.setNewHotkeyShortcutOnUserPreferencesModal('Zoom Out', '{ctrl}');
      // Check error message
      cy.get('.HotkeysPreferences').within(() => {
        cy.contains('Zoom Out') // label we're looking for
          .parent()
          .find('.preferencesInputErrorMessage')
          .as('errorMsg')
          .should(
            'have.text',
            "It's not possible to define only modifier keys (ctrl, alt and shift) as a shortcut"
          );
      });

      // Set invalid modifier key: shift
      cy.setNewHotkeyShortcutOnUserPreferencesModal('Zoom Out', '{shift}');
      // Check error message
      cy.get('@errorMsg').should(
        'have.text',
        "It's not possible to define only modifier keys (ctrl, alt and shift) as a shortcut"
      );

      // Set invalid modifier key: alt
      cy.setNewHotkeyShortcutOnUserPreferencesModal('Zoom Out', '{alt}');
      // Check error message
      cy.get('@errorMsg').should(
        'have.text',
        "It's not possible to define only modifier keys (ctrl, alt and shift) as a shortcut"
      );
    });

    it('checks if user can cancel changes made on User Preferences Hotkeys tab', function() {
      // Go go hotkeys tab
      cy.selectPreferencesTab('@userPreferencesHotkeysTab');

      // Set new hotkey for 'Rotate Right' function
      cy.setNewHotkeyShortcutOnUserPreferencesModal(
        'Rotate Right',
        '{ctrl}{shift}S'
      );

      // Close Success Message overlay (if displayed)
      cy.get('body').then(body => {
        if (body.find('.sb-closeIcon').length > 0) {
          cy.get('.sb-closeIcon').click({ force: true });
        }
        //Cancel hotkeys
        cy.get('@cancelBtn')
          .scrollIntoView()
          .click();
      });

      // Open User Preferences modal again
      cy.openPreferences();

      //Check that hotkey for 'Rotate Right' function was not changed
      cy.get('.HotkeysPreferences').within(() => {
        cy.contains('Rotate Right') // label we're looking for
          .parent()
          .find('input')
          .should('have.value', 'r');
      });
    });

    it('checks if user can reset to default values on User Preferences Hotkeys tab', function() {
      // Go go hotkeys tab
      cy.selectPreferencesTab('@userPreferencesHotkeysTab');

      // Set new hotkey for 'Rotate Right' function
      cy.setNewHotkeyShortcutOnUserPreferencesModal(
        'Rotate Right',
        '{ctrl}{shift}S'
      );

      // click on save button
      cy.get('@saveBtn')
        .scrollIntoView()
        .click();

      // Close Success Message overlay (if displayed)
      cy.get('body').then(body => {
        if (body.find('.sb-closeIcon').length > 0) {
          cy.get('.sb-closeIcon').click({ force: true });
        }
      });

      // Open User Preferences modal again
      cy.openPreferences();

      //Restore Default hotkeys
      cy.get('@restoreBtn')
        .scrollIntoView()
        .click();

      //Check that hotkey for 'Rotate Right' function was not changed
      cy.get('.HotkeysPreferences').within(() => {
        cy.contains('Rotate Right') // label we're looking for
          .parent()
          .find('input')
          .should('have.value', 'r');
      });
    });
  });

  context('W/L Preset Preferences', function() {
    before(() => {
      cy.checkStudyRouteInViewer(
        '1.2.840.113619.2.5.1762583153.215519.978957063.78'
      );
      cy.expectMinimumThumbnails(3);
    });

    beforeEach(() => {
      cy.initCommonElementsAliases();

      // Open User Preferences modal
      cy.openPreferences();
      // Navigate to Window Level tab
      cy.selectPreferencesTab('@userPreferencesWindowLevelTab');
    });

    it('checks if W/L Preferences table is being displayed in the Window Level tab', function() {
      //Check table header
      cy.get('.wlRow.header')
        .should('contains.text', 'Preset')
        .and('contains.text', 'Description')
        .and('contains.text', 'Window')
        .and('contains.text', 'Level');

      //Check table has more than 1 row (more than header)
      cy.get('.wlRow')
        .its('length')
        .should('be.greaterThan', 1);
    });

    // //TODO: Test blocked by issue #1551: https://github.com/OHIF/Viewers/issues/1551
    // it('checks if user can add a new W/L preset', function() {
    //   let description = ':nth-child(8) > .description > .preferencesInput';
    //   let window = ':nth-child(8) > .window > .preferencesInput';
    //   let level = ':nth-child(8) > .level > .preferencesInput';
    //   let new_window_value = 150;
    //   let new_level_value = -600;
    //   // Check existing preset values
    //   cy.get(description).should('have.value', '');
    //   cy.get(window).should('have.value', '');
    //   cy.get(level).should('have.value', '');

    //   // Set new preset value
    //   cy.setWindowLevelPreset(
    //     7,
    //     'New Description',
    //     new_window_value,
    //     new_level_value
    //   );
    //   cy.get('@saveBtn').click();

    //   // Open User Preferences modal
    //   cy.openPreferences();
    //   // Navigate to Window Level tab
    //   cy.selectPreferencesTab('@userPreferencesWindowLevelTab');

    //   // Check recently added preset values
    //   cy.get(description).should('have.value', 'New Description');
    //   cy.get(window).should('have.value', new_window_value);
    //   cy.get(level).should('have.value', new_level_value);

    //   // Close User Preferences modal
    //   cy.get('[data-cy="close-button"]').click();

    //   // Check if new hotkey preset is working on viewport
    //   cy.get('body').type('8');
    //   cy.get('@viewportInfoBottomRight').should(
    //     'contains.text',
    //     'W: ' + new_window_value + ' L: ' + new_level_value
    //   );
    // });

    it('checks if user can remove an existing W/L preset', function() {
      let description = ':nth-child(3) > .description > .preferencesInput';
      let window = ':nth-child(3) > .window > .preferencesInput';
      let level = ':nth-child(3) > .level > .preferencesInput';
      // Check existing preset values
      cy.get(description)
        .should('not.have.value', '')
        .clear();
      cy.get(window)
        .should('not.have.value', '')
        .clear();
      cy.get(level)
        .should('not.have.value', '')
        .clear();

      // Save changes
      cy.get('@saveBtn').click();
      // Close Success Message overlay (if displayed)
      cy.get('body').then(body => {
        if (body.find('.sb-closeIcon').length > 0) {
          cy.get('.sb-closeIcon').click({ force: true });
        }
      });

      // Open User Preferences modal
      cy.openPreferences();
      // Navigate to Window Level tab
      cy.selectPreferencesTab('@userPreferencesWindowLevelTab');

      // Check recently added preset values
      cy.get(description).should('have.value', '');
      cy.get(window).should('have.value', '');
      cy.get(level).should('have.value', '');
      // Close User Preferences modal
      cy.get('[data-cy="close-button"]').click();
    });

    // //TODO: Test blocked by issue #1551: https://github.com/OHIF/Viewers/issues/1551
    // it('checks if user can edit an existing W/L preset', function() {
    //   let description = ':nth-child(2) > .description > .preferencesInput';
    //   let window = ':nth-child(2) > .window > .preferencesInput';
    //   let level = ':nth-child(2) > .level > .preferencesInput';
    //   // Check existing preset values
    //   cy.get(description).should('have.value', 'Soft tissue');
    //   cy.get(window).should('have.value', '550');
    //   cy.get(level).should('have.value', '40');

    //   // Set new preset value
    //   cy.setWindowLevelPreset(1, 'Soft tissue New Description', 1220, 333);
    //   cy.get('@saveBtn').click();

    //   // Open User Preferences modal
    //   cy.openPreferences();
    //   // Navigate to Window Level tab
    //   cy.selectPreferencesTab('@userPreferencesWindowLevelTab');

    //   // Check recently added preset values
    //   cy.get(description).should('have.value', 'Soft tissue New Description');
    //   cy.get(window).should('have.value', '1220');
    //   cy.get(level).should('have.value', '333');
    // });

    it('checks if user can change the W/L by triggering different hotkeys with W/L presets', function() {
      // Close User Preferences modal
      cy.get('[data-cy="close-button"]').click();
      // Check if hotkey preset is working on viewport
      cy.get('body').type('3');
      cy.get('@viewportInfoBottomRight').should(
        'contains.text',
        'W: 150 L: 90'
      );

      // Check if hotkey preset is working on viewport
      cy.get('body').type('4');
      cy.get('@viewportInfoBottomRight').should(
        'contains.text',
        'W: 2500 L: 480'
      );
    });

    it('checks if user can change the W/L by triggering different hotkeys with W/L presets on multiple viewports', function() {
      // Close User Preferences modal
      cy.get('[data-cy="close-button"]').click();

      // Set 3 viewports layout
      cy.setLayout(3, 1);
      cy.waitViewportImageLoading();

      // Check if hotkey preset is working on viewport
      cy.get('body').type('3');
      cy.get('@viewportInfoBottomRight').should(
        'contains.text',
        'W: 150 L: 90'
      );

      // Overlay information from 2nd viewport
      let second_viewport_overlay =
        'div:nth-child(2) > div > div.viewport-element > div.OHIFCornerstoneViewportOverlay > div.bottom-right.overlay-element > div';

      // Shift active viewport to Viewport #2
      cy.get('body').type('{rightarrow}');

      // Check if hotkey preset is working on viewport #2
      cy.get('body').type('4');
      cy.get(second_viewport_overlay).should('contains.text', 'W: 2500 L: 480');

      // Set 1 viewport layout
      cy.setLayout(1, 1);
    });
  });
});
