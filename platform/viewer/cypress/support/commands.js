import '@percy/cypress';
import { DragSimulator } from '../helpers/DragSimulator.js';
import {
  initCornerstoneToolsAliases,
  initCommonElementsAliases,
  initRouteAliases,
  initVTKToolsAliases,
  initStudyListAliasesOnDesktop,
  initStudyListAliasesOnTablet,
} from './aliases.js';

// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

/**
 * Command to search for a patient name and open his/her study.
 *
 * @param {string} PatientName - Patient name that we would like to search for
 */
Cypress.Commands.add('openStudy', patientName => {
  cy.openStudyList();
  cy.get('#filter-patientNameOrId').type(patientName);
  cy.wait('@getStudies');
  cy.get('[data-cy="study-list-results"]', { timeout: 5000 })
    .contains(patientName)
    .first()
    .click({ force: true });
});

/**
 * Command to search for a modality and open the study.
 *
 * @param {string} modality - Modality type that we would like to search for
 */
Cypress.Commands.add('openStudyModality', modality => {
  cy.initRouteAliases();
  cy.visit('/');

  cy.get('#filter-accessionOrModalityOrDescription')
    .type(modality)
    .wait(2000);

  cy.get('[data-cy="study-list-results"]')
    .contains(modality)
    .first()
    .click();
});

/**
 * Command to wait and check if a new page was loaded
 *
 * @param {string} url - part of the expected url. Default value is /viewer/
 */
Cypress.Commands.add('isPageLoaded', (url = '/viewer/') => {
  return cy.location('pathname', { timeout: 60000 }).should('include', url);
});

Cypress.Commands.add('openStudyList', () => {
  cy.initRouteAliases();
  cy.visit('/');
  cy.wait('@getStudies');
});

Cypress.Commands.add('waitStudyList', () => {
  cy.get('@searchResult').should($list => {
    expect($list).to.not.have.class('no-hover');
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
 * Command to perform two clicks into two different positions. Each position must be [x, y].
 * The positions are considering the element as reference, therefore, top-left of the element will be (0, 0).
 *
 * @param {*} viewport - Selector for viewport we would like to interact with
 * @param {number[]} firstClick - Click position [x, y]
 * @param {number[]} secondClick - Click position [x, y]
 */
Cypress.Commands.add('addLine', (viewport, firstClick, secondClick) => {
  cy.get(viewport).then($viewport => {
    const [x1, y1] = firstClick;
    const [x2, y2] = secondClick;

    cy.wrap($viewport)
      .click(x1, y1, { force: true })
      .trigger('mousemove', { clientX: x2, clientY: y2 })
      .click(x2, y2, { force: true });
  });
});

/**
 * Command to perform three clicks into three different positions. Each position must be [x, y].
 * The positions are considering the element as reference, therefore, top-left of the element will be (0, 0).
 *
 * @param {*} viewport - Selector for viewport we would like to interact with
 * @param {number[]} firstClick - Click position [x, y]
 * @param {number[]} secondClick - Click position [x, y]
 * @param {number[]} thirdClick - Click position [x, y]
 */
Cypress.Commands.add(
  'addAngle',
  (viewport, firstClick, secondClick, thirdClick) => {
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
  }
);

Cypress.Commands.add('expectMinimumThumbnails', (seriesToWait = 1) => {
  cy.get('[data-cy=thumbnail-list]', { timeout: 10000 }).should($itemList => {
    expect($itemList.length >= seriesToWait).to.be.true;
  });
});

//Command to wait DICOM image to load into the viewport
Cypress.Commands.add('waitDicomImage', (timeout = 20000) => {
  const loaded = cy.isPageLoaded();

  if (loaded) {
    cy.window()
      .its('cornerstone')
      .then({ timeout }, $cornerstone => {
        return new Cypress.Promise(resolve => {
          const onEvent = renderedEvt => {
            const element = renderedEvt.detail.element;

            element.removeEventListener('cornerstoneimagerendered', onEvent);
            $cornerstone.events.removeEventListener(
              'cornerstoneimagerendered',
              onEvent
            );
            resolve();
          };
          const onEnabled = enabledEvt => {
            const element = enabledEvt.detail.element;

            element.addEventListener('cornerstoneimagerendered', onEvent);
          };
          $cornerstone.events.addEventListener(
            'cornerstoneelementenabled',
            onEnabled
          );
        });
      });
  }
});

//Command to reset and clear all the changes made to the viewport
Cypress.Commands.add('resetViewport', () => {
  cy.initCornerstoneToolsAliases();

  //Click on More button
  cy.get('@moreBtn').click();
  //Verify if overlay is displayed
  cy.get('body').then(body => {
    if (body.find('.tooltip-toolbar-overlay').length == 0) {
      cy.get('@moreBtn').click();
    }
  });
  //Click on Clear button
  cy.get('.tooltip-inner > :nth-child(10)')
    .as('clearBtn')
    .click();
  //Click on Reset button
  cy.get('@resetBtn').click();
});

Cypress.Commands.add('imageZoomIn', () => {
  cy.initCornerstoneToolsAliases();
  cy.get('@zoomBtn').click();

  //drags the mouse inside the viewport to be able to interact with series
  cy.get('@viewport')
    .trigger('mousedown', 'top', { which: 1 })
    .trigger('mousemove', 'center', { which: 1 })
    .trigger('mouseup');
});

Cypress.Commands.add('imageContrast', () => {
  cy.initCornerstoneToolsAliases();
  cy.get('@levelsBtn').click();

  //drags the mouse inside the viewport to be able to interact with series
  cy.get('@viewport')
    .trigger('mousedown', 'center', { which: 1 })
    .trigger('mousemove', 'top', { which: 1 })
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

//Initialize aliases for VTK tools
Cypress.Commands.add('initVTKToolsAliases', () => {
  initVTKToolsAliases();
});

//Initialize aliases for Study List page elements
Cypress.Commands.add('initStudyListAliasesOnDesktop', () => {
  initStudyListAliasesOnDesktop();
});

//Initialize aliases for Study List page elements
Cypress.Commands.add('initStudyListAliasesOnTablet', () => {
  initStudyListAliasesOnTablet();
});

//Add measurements in the viewport
Cypress.Commands.add(
  'addLengthMeasurement',
  (firstClick = [150, 100], secondClick = [130, 170]) => {
    cy.initCornerstoneToolsAliases();
    cy.get('@lengthBtn').click();
    cy.addLine('@viewport', firstClick, secondClick);
  }
);

//Add measurements in the viewport
Cypress.Commands.add(
  'addAngleMeasurement',
  (initPos = [180, 390], midPos = [300, 410], finalPos = [180, 450]) => {
    cy.initCornerstoneToolsAliases();
    cy.get('@angleBtn').click();
    cy.addAngle('@viewport', initPos, midPos, finalPos);
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
  cy.get('.toolbar-button-label')
    .contains('Layout')
    .click();

  cy.get('.layoutChooser')
    .find('tr')
    .eq(rows - 1)
    .find('td')
    .eq(columns - 1)
    .click();

  cy.wait(1000);
});

function convertCanvas(documentClone) {
  documentClone
    .querySelectorAll('canvas')
    .forEach(selector => canvasToImage(selector));

  return documentClone;
}

function unconvertCanvas(documentClone) {
  // Remove previously generated images
  documentClone
    .querySelectorAll('[data-percy-image]')
    .forEach(selector => selector.remove());
  // Restore canvas visibility
  documentClone.querySelectorAll('[data-percy-canvas]').forEach(selector => {
    selector.removeAttribute('data-percy-canvas');
    selector.style = '';
  });
}

function canvasToImage(selectorOrEl) {
  let canvas =
    typeof selectorOrEl === 'object'
      ? selectorOrEl
      : document.querySelector(selectorOrEl);
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
