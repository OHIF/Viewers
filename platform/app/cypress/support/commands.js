import '@percy/cypress';
import 'cypress-file-upload';
import { DragSimulator } from './DragSimulator.js';
import {
  initCornerstoneToolsAliases,
  initCommonElementsAliases,
  initRouteAliases,
  initStudyListAliasesOnDesktop,
  initPreferencesModalAliases,
  initPreferencesModalFooterBtnAliases,
} from './aliases.js';

/**
 * Command to select a layout preset.
 * The layout preset is selected by clicking on the Layout button and then clicking on the desired preset.
 * The preset name is the text that is displayed on the button.
 * @param {string} presetName - The name of the layout preset that we would like to select
 * @param {boolean} screenshot - If true, a screenshot will be taken when the layout tool is opened
 */
Cypress.Commands.add('selectLayoutPreset', (presetName, screenshot) => {
  cy.get('[data-cy="Layout"]').click();
  if (screenshot) {
    cy.percyCanvasSnapshot('Layout tool opened');
  }
  cy.get('div').contains(presetName).should('be.visible').click();
  // fixed wait time for layout changes and rendering
  cy.wait(3000);
});

/**
 * Command to search for a patient name and open his/her study.
 *
 * @param {string} PatientName - Patient name that we would like to search for
 */
Cypress.Commands.add('openStudy', PatientName => {
  cy.openStudyList();
  cy.get('#filter-patientNameOrId').type(PatientName);
  // cy.get('@getStudies').then(() => {
  cy.waitQueryList();

  cy.get('[data-cy="study-list-results"]', { timeout: 5000 })
    .contains(PatientName)
    .first()
    .click({ force: true });
});

Cypress.Commands.add(
  'checkStudyRouteInViewer',
  (StudyInstanceUID, otherParams = '', mode = '/basic-test') => {
    cy.location('pathname').then($url => {
      cy.log($url);
      if ($url === 'blank' || !$url.includes(`${mode}/${StudyInstanceUID}${otherParams}`)) {
        cy.openStudyInViewer(StudyInstanceUID, otherParams, mode);
        cy.waitDicomImage();
        // Very short wait to ensure pending updates are handled
        cy.wait(25);
      }
    });
  }
);

Cypress.Commands.add('initViewer', (StudyInstanceUID, other = {}) => {
  const { mode = '/basic-test', minimumThumbnails = 1, params = '' } = other;
  cy.openStudyInViewer(StudyInstanceUID, params, mode);
  cy.waitDicomImage();
  // Very short wait to ensure pending updates are handled
  cy.wait(25);

  cy.expectMinimumThumbnails(minimumThumbnails);
  cy.initCommonElementsAliases();
  cy.initCornerstoneToolsAliases();
});

Cypress.Commands.add(
  'openStudyInViewer',
  (StudyInstanceUID, otherParams = '', mode = '/basic-test') => {
    cy.visit(`${mode}?StudyInstanceUIDs=${StudyInstanceUID}${otherParams}`);
  }
);

Cypress.Commands.add('waitQueryList', () => {
  cy.get('[data-querying="false"]');
});
/**
 * Command to search for a Modality and open the study.
 *
 * @param {string} Modality - Modality type that we would like to search for
 */
Cypress.Commands.add('openStudyModality', Modality => {
  cy.initRouteAliases();
  cy.visit('/');

  cy.get('#filter-accessionOrModalityOrDescription').type(Modality).waitQueryList();

  cy.get('[data-cy="study-list-results"]').contains(Modality).first().click();
});

/**
 * Command to wait and check if a new page was loaded
 *
 * @param {string} url - part of the expected url. Default value is /basic-test
 */
Cypress.Commands.add('isPageLoaded', (url = '/basic-test') => {
  return cy.location('pathname', { timeout: 60000 }).should('include', url);
});

Cypress.Commands.add('openStudyList', () => {
  cy.initRouteAliases();
  cy.visit('/', { timeout: 15000 });

  // For some reason cypress 12.x does not like to stub the network request
  // so we just wait here for 1 second
  // cy.wait('@getStudies');
  cy.waitQueryList();
});

Cypress.Commands.add('waitStudyList', () => {
  // wait 1 second for the studies to get updated
  cy.wait(1000);
  cy.get('@searchResult').should($list => {
    expect($list).to.not.have.class('no-hover');
  });
});

Cypress.Commands.add('waitViewportImageLoading', () => {
  // Wait for finish loading
  cy.get('[data-cy="viewport-grid"]', { timeout: 30000 }).should($grid => {
    expect($grid).not.to.contain.text('Load');
  });
});

/**
 * Command to perform a drag and drop action. Before using this command, we must get the element that should be dragged first.
 * Example of usage: cy.get(element-to-be-dragged).drag(dropzone-element)
 *
 * @param {*} element - Selector for element that we want to use as dropzone
 */
Cypress.Commands.add('drag', { prevSubject: 'element' }, (...args) =>
  DragSimulator.simulate(...args)
);

/**
 * Command to perform three clicks into three different positions. Each position must be [x, y].
 * The positions are considering the element as reference, therefore, top-left of the element will be (0, 0).
 *
 * @param {*} viewport - Selector for viewport we would like to interact with
 * @param {number[]} firstClick - Click position [x, y]
 * @param {number[]} secondClick - Click position [x, y]
 * @param {number[]} thirdClick - Click position [x, y]
 */
Cypress.Commands.add('addAngle', (viewport, firstClick, secondClick, thirdClick) => {
  cy.get(viewport).then($viewport => {
    const [x1, y1] = firstClick;
    const [x2, y2] = secondClick;
    const [x3, y3] = thirdClick;

    cy.wrap($viewport)
      .click(x1, y1, { force: true })
      .trigger('mousemove', { clientX: x2, clientY: y2 })
      .click(x2, y2, { force: true })
      .trigger('mousemove', { clientX: x3, clientY: y3 })
      .click(x3, y3, { force: true });
  });
});

Cypress.Commands.add('expectMinimumThumbnails', (seriesToWait = 1) => {
  cy.get('[data-cy="study-browser-thumbnail"]', { timeout: 50000 }).should(
    'have.length.gte',
    seriesToWait
  );
});

//Command to wait DICOM image to load into the viewport
Cypress.Commands.add('waitDicomImage', (mode = '/basic-test', timeout = 50000) => {
  cy.window()
    .its('cornerstone', { timeout: 30000 })
    .should($cornerstone => {
      const enabled = $cornerstone.getEnabledElements();
      if (enabled?.length) {
        enabled.forEach((item, i) => {
          if (item.viewport.viewportStatus !== $cornerstone.Enums.ViewportStatus.RENDERED) {
            throw new Error(`Viewport ${i} in state ${item.viewport.viewportStatus}`);
          }
        });
      } else {
        throw new Error('No enabled elements');
      }
    });
  // This shouldn't be necessary, but seems to be.
  cy.wait(250);
  cy.log('DICOM image loaded');
});

//Command to reset and clear all the changes made to the viewport
Cypress.Commands.add('resetViewport', () => {
  // Assign an alias to the More button
  cy.get('[data-cy="MoreTools-split-button-primary"]')
    .should('have.attr', 'data-tool', 'Reset')
    .as('moreBtn');

  // Use the alias to click on the More button
  cy.get('@moreBtn').click();
});

Cypress.Commands.add('imageZoomIn', () => {
  cy.initCornerstoneToolsAliases();
  cy.get('@zoomBtn').click();
  cy.wait(25);

  //drags the mouse inside the viewport to be able to interact with series
  cy.get('@viewport')
    .trigger('mousedown', 'top', { buttons: 1 })
    .trigger('mousemove', 'center', { buttons: 1 })
    .trigger('mouseup');
});

Cypress.Commands.add('imageContrast', () => {
  cy.initCornerstoneToolsAliases();
  cy.get('@wwwcBtnPrimary').click();
  cy.wait(25);

  //drags the mouse inside the viewport to be able to interact with series
  cy.get('@viewport')
    .trigger('mousedown', 'center', { buttons: 1 })
    .trigger('mousemove', 'top', { buttons: 1 })
    .trigger('mouseup');
});

//Initialize aliases for Cornerstone tools buttons
Cypress.Commands.add('initCornerstoneToolsAliases', () => {
  initCornerstoneToolsAliases();
});

//Initialize aliases for Common page elements
Cypress.Commands.add('initCommonElementsAliases', () => {
  initCommonElementsAliases();
});

//Initialize aliases for Routes
Cypress.Commands.add('initRouteAliases', () => {
  initRouteAliases();
});

//Initialize aliases for Study List page elements
Cypress.Commands.add('initStudyListAliasesOnDesktop', () => {
  initStudyListAliasesOnDesktop();
});

//Add measurements in the viewport
Cypress.Commands.add(
  'addLengthMeasurement',
  (firstClick = [150, 100], secondClick = [130, 170]) => {
    // Assign an alias to the button element
    cy.get('@measurementToolsBtnPrimary').as('lengthButton');

    cy.get('@lengthButton').should('have.attr', 'data-tool', 'Length');

    cy.get('@lengthButton').then(button => {
      // Only click the length tool if it is not active, in case the length tool is set up to
      // toggle to inactive.
      if (!button.is('.active')) {
        cy.wrap(button).click();
      }
    });

    cy.get('@lengthButton').should('have.class', 'bg-primary-light');

    cy.get('@viewport').then($viewport => {
      const [x1, y1] = firstClick;
      const [x2, y2] = secondClick;

      cy.wrap($viewport)
        .click(x1, y1, { force: true })
        .wait(1000)
        .click(x2, y2, { force: true })
        .wait(1000);
    });
  }
);

// Add brush stroke in the viewport
Cypress.Commands.add('addBrush', (viewport, firstClick = [85, 100], secondClick = [85, 300]) => {
  cy.get(viewport)
    .first()
    .then(viewportElement => {
      const [x1, y1] = firstClick;
      const [x2, y2] = secondClick;

      const steps = 10;
      const xStep = (x2 - x1) / steps;
      const yStep = (y2 - y1) / steps;

      cy.wrap(viewportElement)
        .trigger('mousedown', x1, y1, { buttons: 1 })
        .then(() => {
          for (let i = 1; i <= steps; i++) {
            let x = x1 + xStep * i;
            let y = y1 + yStep * i;
            cy.wrap(viewportElement).trigger('mousemove', x, y, { buttons: 1 });
          }
        })
        .trigger('mouseup');
    });
});

// Add erase stroke in the viewport
Cypress.Commands.add('addEraser', (viewport, firstClick = [85, 100], secondClick = [85, 300]) => {
  cy.get(viewport)
    .first()
    .then(viewportElement => {
      const [x1, y1] = firstClick;
      const [x2, y2] = secondClick;

      const steps = 10;
      const xStep = (x2 - x1) / steps;
      const yStep = (y2 - y1) / steps;

      cy.wrap(viewportElement)
        .trigger('mousedown', x1, y1, { buttons: 1 })
        .then(() => {
          for (let i = 1; i <= steps; i++) {
            let x = x1 + xStep * i;
            let y = y1 + yStep * i;
            cy.wrap(viewportElement).trigger('mousemove', x, y, { buttons: 1 });
          }
        })
        .trigger('mouseup');
    });
});

//Add measurements in the viewport
Cypress.Commands.add(
  'addAngleMeasurement',
  (initPos = [180, 390], midPos = [300, 410], finalPos = [180, 450]) => {
    cy.get('[data-cy="MeasurementTools-split-button-secondary"]').click();
    cy.get('[data-cy="Angle"]').click();

    cy.addAngle('.cornerstone-canvas', initPos, midPos, finalPos);
  }
);

/**
 * Tests if element is NOT in viewport, or does not exist in DOM
 *
 * @param {string} element - element selector string or alias
 * @returns
 */
Cypress.Commands.add('isNotInViewport', element => {
  cy.get(element, { timeout: 3000 }).should($el => {
    const bottom = Cypress.$(cy.state('window')).height() - 50;
    const right = Cypress.$(cy.state('window')).width() - 50;

    // If it's not visible, it's not in the viewport
    if ($el) {
      const rect = $el[0].getBoundingClientRect();

      // TODO: support leftOf, above
      const isBeneath = rect.top >= bottom && rect.bottom >= bottom;
      const isRightOf = rect.left >= right && rect.right >= right;
      const isNotInViewport = isBeneath && isRightOf;

      expect(isNotInViewport).to.be.true;
    }
  });
});

/**
 * Tests if element is in viewport, or it does exist in DOM
 *
 * @param {string} element - element selector string or alias
 * @returns
 */
Cypress.Commands.add('isInViewport', element => {
  cy.get(element, { timeout: 3000 }).should($el => {
    const bottom = Cypress.$(cy.state('window')).height();
    const right = Cypress.$(cy.state('window')).width();

    // If it's not visible, it's not in the viewport
    if ($el) {
      const rect = $el[0].getBoundingClientRect();

      // TODO: support leftOf, above
      const isBeneath = rect.top < bottom && rect.bottom < bottom;
      const isRightOf = rect.left < right && rect.right < right;
      const isInViewport = isBeneath && isRightOf;

      expect(isInViewport).to.be.true;
    }
  });
});

/**
 * Percy.io Canvas screenshot workaround
 *
 */
Cypress.Commands.add('percyCanvasSnapshot', (name, options = {}) => {
  cy.document().then(doc => {
    convertCanvas(doc);
  });

  // `domTransformation` does not appear to be working
  // But modifying our immediate DOM does.
  cy.percySnapshot(name, { ...options }); //, domTransformation: convertCanvas });

  cy.document().then(doc => {
    unconvertCanvas(doc);
  });
});

Cypress.Commands.add('setLayout', (columns = 1, rows = 1) => {
  cy.get('[data-cy="Layout"]').click();

  cy.get(`[data-cy="Layout-${columns - 1}-${rows - 1}"]`).click();

  cy.wait(10);
  cy.waitDicomImage();
});

function convertCanvas(documentClone) {
  documentClone.querySelectorAll('canvas').forEach(selector => canvasToImage(selector));

  return documentClone;
}

function unconvertCanvas(documentClone) {
  // Remove previously generated images
  documentClone.querySelectorAll('[data-percy-image]').forEach(selector => selector.remove());
  // Restore canvas visibility
  documentClone.querySelectorAll('[data-percy-canvas]').forEach(selector => {
    selector.removeAttribute('data-percy-canvas');
    selector.style = '';
  });
}

function canvasToImage(selectorOrEl) {
  let canvas =
    typeof selectorOrEl === 'object' ? selectorOrEl : document.querySelector(selectorOrEl);
  let image = document.createElement('img');
  let canvasImageBase64 = canvas.toDataURL('image/png');

  // Show Image
  image.src = canvasImageBase64;
  image.style = 'width: 100%';
  image.setAttribute('data-percy-image', true);
  // Hide Canvas
  canvas.setAttribute('data-percy-canvas', true);
  canvas.parentElement.appendChild(image);
  canvas.style = 'display: none';
}

//Initialize aliases for User Preferences modal
Cypress.Commands.add('initPreferencesModalAliases', () => {
  initPreferencesModalAliases();
});

Cypress.Commands.add('openPreferences', () => {
  cy.log('Open User Preferences Modal');
  // Open User Preferences modal
  cy.get('body').then(body => {
    if (body.find('.OHIFModal').length === 0) {
      cy.get('[data-cy="options-chevron-down-icon"]')
        .scrollIntoView()
        .click()
        .then(() => {
          cy.get('[data-cy="options-dropdown"]').last().click().wait(200);
        });
    }
  });
});

Cypress.Commands.add('scrollToIndex', index => {
  // Workaround implemented based on Cypress issue:
  // https://github.com/cypress-io/cypress/issues/1570#issuecomment-450966053
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  ).set;

  cy.get('input.imageSlider[type=range]').then($range => {
    // get the DOM node
    const range = $range[0];
    // set the value manually
    nativeInputValueSetter.call(range, index);
    // now dispatch the event
    range.dispatchEvent(
      new Event('change', {
        value: index,
        bubbles: true,
      })
    );
  });
});

Cypress.Commands.add('closePreferences', () => {
  cy.log('Close User Preferences Modal');

  cy.get('body').then(body => {
    // Close notification if displayed
    if (body.find('.sb-closeIcon').length > 0) {
      cy.get('.sb-closeIcon').first().click({ force: true });
    }

    // Close User Preferences Modal (if displayed)
    if (body.find('.OHIFModal__header').length > 0) {
      cy.get('[data-cy="close-button"]').click({ force: true });
    }
  });
});

Cypress.Commands.add('selectPreferencesTab', tabAlias => {
  cy.initPreferencesModalAliases();

  cy.get(tabAlias).as('selectedTab');
  cy.get('@selectedTab').click();
  cy.get('@selectedTab').should('have.class', 'active');

  initPreferencesModalFooterBtnAliases();
});

Cypress.Commands.add('resetUserHotkeyPreferences', () => {
  // Open User Preferences modal
  cy.openPreferences();

  cy.selectPreferencesTab('@userPreferencesHotkeysTab').then(() => {
    cy.log('Reset Hotkeys to Default Preferences');
    cy.get('@restoreBtn').click();
  });

  // Close Success Message overlay (if displayed)
  cy.get('body').then(body => {
    if (body.find('.sb-closeIcon').length > 0) {
      cy.get('.sb-closeIcon').first().click({ force: true });
    }
    // Click on Save Button
    cy.get('@saveBtn').click();
  });
});

Cypress.Commands.add('resetUserGeneralPreferences', () => {
  // Open User Preferences modal
  cy.openPreferences();

  cy.selectPreferencesTab('@userPreferencesGeneralTab').then(() => {
    cy.log('Reset Language to Default Preferences');
    cy.get('@restoreBtn').click();
  });

  // Close Success Message overlay (if displayed)
  cy.get('body').then(body => {
    if (body.find('.sb-closeIcon').length > 0) {
      cy.get('.sb-closeIcon').first().click({ force: true });
    }
    // Click on Save Button
    cy.get('@saveBtn').click();
  });
});

Cypress.Commands.add('setNewHotkeyShortcutOnUserPreferencesModal', (function_label, shortcut) => {
  // Within scopes all `.get` and `.contains` to within the matched elements
  // dom instead of checking from document
  cy.get('.HotkeysPreferences').within(() => {
    cy.contains(function_label) // label we're looking for
      .parent()
      .find('input') // closest input to that label
      .type(shortcut, { force: true }); // Set new shortcut for that function
  });
});

Cypress.Commands.add(
  'setWindowLevelPreset',
  (preset_index, description_value, window_value, level_value) => {
    let index = parseInt(preset_index) + 1;

    // Set new Description value
    cy.get(':nth-child(' + index + ') > .description > .preferencesInput')
      .clear()
      .type(description_value, {
        force: true,
      })
      .blur();

    // Set new Window value
    cy.get(':nth-child(' + index + ') > .window > .preferencesInput')
      .clear()
      .type(window_value, {
        force: true,
      })
      .blur();

    // Set new Level value
    cy.get(':nth-child(' + index + ') > .level > .preferencesInput')
      .clear()
      .type(level_value, {
        force: true,
      })
      .blur();
  }
);

Cypress.Commands.add('openDownloadImageModal', () => {
  // Click on More button
  cy.get('[data-cy="Capture"]').as('captureBtn').click();
});

Cypress.Commands.add('setLanguage', (language, save = true) => {
  cy.openPreferences();
  cy.initPreferencesModalAliases();
  cy.selectPreferencesTab('@userPreferencesGeneralTab');

  // Language dropdown should be displayed
  cy.get('#language-select').should('be.visible');

  // Select Language and Save/Cancel
  cy.get('#language-select').select(language);

  // Close Success Message overlay (if displayed)
  cy.get('body').then(body => {
    if (body.find('.sb-closeIcon').length > 0) {
      cy.get('.sb-closeIcon').first().click({ force: true });
    }

    //Click on Save/Cancel button
    const toClick = save ? '@saveBtn' : '@cancelBtn';
    cy.get(toClick).scrollIntoView().click();
  });
});

// hide noisy logs
// https://github.com/cypress-io/cypress/issues/7362
// uncomment this if you really need the network logs
const origLog = Cypress.log;
Cypress.log = function (opts, ...other) {
  if (opts.displayName === 'script' || opts.name === 'request') {
    return;
  }
  return origLog(opts, ...other);
};
