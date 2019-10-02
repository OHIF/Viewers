import { DragSimulator } from "../helpers/DragSimulator.js";

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

Cypress.Commands.add('openStudy', (patientName) => {
    cy.visit('/');
    cy.get('#patientName')
      .type(patientName);

    const patientResult = '.studylistStudy > .patientName';

    cy.get(patientResult)
      .then({ timeout: 5000 }, ($patientResult) => {
        cy.contains(patientName)
        .click();
      })
  }
);

Cypress.Commands.add('drag', {prevSubject: 'element',},
  (...args) => DragSimulator.simulate(...args)
);

// Command to perform two clicks into two different positions. Each position must be (x, y).
// The positions are considering the element as reference, therefore, top-left of the element will be (0, 0).
Cypress.Commands.add('addLine', (element, initPosition, finalPosition) =>  {

  cy.get(element)
    .click(initPosition[0], initPosition[1], { force: true })
    .then(() =>{
      cy.get(element)
        .trigger('mousemove', { clientX: finalPosition[0], clientY: finalPosition[1] })
        .click({ force: true })
    })
});


// Command to perform three clicks into three different positions. Each position must be (x, y).
// The positions are considering the element as reference, therefore, top-left of the element will be (0, 0).
Cypress.Commands.add('addAngle', (element, initPosition, midPosition, finalPosition) =>  {

  cy.get(element)
    .click(initPosition[0], initPosition[1], { force: true })
    .then(() =>{
      cy.get(element)
        .trigger('mousemove', { clientX: midPosition[0], clientY: midPosition[1] })
        .click(midPosition[0], midPosition[1], { force: true })
    }).then(() =>{
      cy.get(element)
        .trigger('mousemove', { clientX: finalPosition[0], clientY: finalPosition[1] })
        .click(finalPosition[0], finalPosition[1], { force: true })
    })
});


//Command to wait DICOM image to load into the viewport
Cypress.Commands.add('waitDicomImage', (timeout = 10000) => {
  // Give an alias to request
  cy.server().route("GET", '/dcm4chee-arc/aets/DCM4CHEE/rs/studies/**').as('imageRequest')
 
  // Wait for response.status to be 200
  cy.wait('@imageRequest', {timeout:timeout}).its('status').should('be', 200) 
  Cypress.on('uncaught:exception', (err, runnable) => {
    cy.log('No Image Request was made.');
    // returning false here prevents Cypress from failing the test
    return false
  })
});


//Command to reset the viewport changes throught the cornerstone method
Cypress.Commands.add('resetViewport', () => {
  let cornerstone;

  cy.window()
    .its('cornerstone')
    .then((c) => {
      cornerstone = c;
      cornerstone.reset(cornerstone.getEnabledElements()[0].element)
    });
});