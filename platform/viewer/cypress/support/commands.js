import { DragSimulator } from '../helpers/DragSimulator.js';
import { doesNotReject } from 'assert';
import { disconnect } from 'cluster';

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

Cypress.Commands.add('openStudy', patientName => {
  cy.visit('/');
  cy.get('#patientName').type(patientName);

  cy.get('.studylistStudy > .patientName')
    .as('patientResult')
    .then({ timeout: 5000 }, $patientResult => {
      cy.contains(patientName).click();
    });
});

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

//Command to wait DICOM image to load into the viewport
Cypress.Commands.add('waitDicomImage', (timeout = 20000) => {
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
});

//Command to reset the viewport changes throught the cornerstone method
Cypress.Commands.add('resetViewport', () => {
  cy.get('@resetBtn').click();
});

Cypress.Commands.add('imageZoomIn', () => {
  cy.get('@zoomBtn').click();

  //drags the mouse inside the viewport to be able to interact with series
  cy.get('@viewport')
    .trigger('mousedown', 'top', { which: 1 })
    .trigger('mousemove', 'center', { which: 1 })
    .trigger('mouseup');
});

Cypress.Commands.add('imageContrast', () => {
  cy.get('@levelsBtn').click();

  //drags the mouse inside the viewport to be able to interact with series
  cy.get('@viewport')
    .trigger('mousedown', 'center', { which: 1 })
    .trigger('mousemove', 'top', { which: 1 })
    .trigger('mouseup');
});
