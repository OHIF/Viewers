import { ProtocolMatchingRule } from './rules';
import { removeFromArray } from '../lib/removeFromArray';
import Stage from './Stage';
import guid from '../../utils/guid';
import user from '../../user';

/**
 * This class represents a Hanging Protocol at the highest level
 *
 * @type {Protocol}
 */
export default class Protocol {
  /**
   * The Constructor for the Class to create a Protocol with the bare
   * minimum information
   *
   * @param name The desired name for the Protocol
   */
  constructor(name) {
    // Create a new UUID for this Protocol
    this.id = guid();

    // Store a value which determines whether or not a Protocol is locked
    // This is probably temporary, since we will eventually have role / user
    // checks for editing. For now we just need it to prevent changes to the
    // default protocols.
    this.locked = false;

    // Boolean value to indicate if the protocol has updated priors information
    // it's set in "updateNumberOfPriorsReferenced" function
    this.hasUpdatedPriorsInformation = false;

    // Apply the desired name
    this.name = name;

    // Set the created and modified dates to Now
    this.createdDate = new Date();
    this.modifiedDate = new Date();

    // If we are logged in while creating this Protocol,
    // store this information as well
    if (user.userLoggedIn && user.userLoggedIn()) {
      this.createdBy = user.getUserId();
      this.modifiedBy = user.getUserId();
    }

    // Create two empty Sets specifying which roles
    // have read and write access to this Protocol
    this.availableTo = new Set();
    this.editableBy = new Set();

    // Define empty arrays for the Protocol matching rules
    // and Stages
    this.protocolMatchingRules = [];
    this.stages = [];

    // Define auxiliary values for priors
    this.numberOfPriorsReferenced = -1;
  }

  getNumberOfPriorsReferenced(skipCache = false) {
    let numberOfPriorsReferenced =
      skipCache !== true ? this.numberOfPriorsReferenced : -1;

    // Check if information is cached already
    if (numberOfPriorsReferenced > -1) {
      return numberOfPriorsReferenced;
    }

    numberOfPriorsReferenced = 0;

    // Search each study matching rule for prior rules
    // Each stage can have many viewports that can have
    // multiple study matching rules.
    this.stages.forEach(stage => {
      if (!stage.viewports) {
        return;
      }

      stage.viewports.forEach(viewport => {
        if (!viewport.studyMatchingRules) {
          return;
        }

        viewport.studyMatchingRules.forEach(rule => {
          // If the current rule is not a priors rule, it will return -1 then numberOfPriorsReferenced will continue to be 0
          const priorsReferenced = rule.getNumberOfPriorsReferenced();
          if (priorsReferenced > numberOfPriorsReferenced) {
            numberOfPriorsReferenced = priorsReferenced;
          }
        });
      });
    });

    this.numberOfPriorsReferenced = numberOfPriorsReferenced;

    return numberOfPriorsReferenced;
  }

  updateNumberOfPriorsReferenced() {
    this.getNumberOfPriorsReferenced(true);
  }

  /**
   * Method to update the modifiedDate when the Protocol
   * has been changed
   */
  protocolWasModified() {
    // If we are logged in while modifying this Protocol,
    // store this information as well
    if (user.userLoggedIn && user.userLoggedIn()) {
      this.modifiedBy = user.getUserId();
    }

    // Protocol has been modified, so mark priors information
    // as "outdated"
    this.hasUpdatedPriorsInformation = false;

    // Update number of priors referenced info
    this.updateNumberOfPriorsReferenced();

    // Update the modifiedDate with the current Date/Time
    this.modifiedDate = new Date();
  }

  /**
   * Occasionally the Protocol class needs to be instantiated from a JavaScript Object
   * containing the Protocol data. This function fills in a Protocol with the Object
   * data.
   *
   * @param input A Protocol as a JavaScript Object, e.g. retrieved from JSON
   */
  fromObject(input) {
    // Check if the input already has an ID
    // If so, keep it. It not, create a new UUID
    this.id = input.id || guid();

    // Assign the input name to the Protocol
    this.name = input.name;

    // Retrieve locked status, use !! to make it truthy
    // so that undefined values will be set to false
    this.locked = !!input.locked;

    // TODO: Check how to regenerate Set from Object
    //this.availableTo = new Set(input.availableTo);
    //this.editableBy = new Set(input.editableBy);

    // If the input contains Protocol matching rules
    if (input.protocolMatchingRules) {
      input.protocolMatchingRules.forEach(ruleObject => {
        // Create new Rules from the stored data
        var rule = new ProtocolMatchingRule();
        rule.fromObject(ruleObject);

        // Add them to the Protocol
        this.protocolMatchingRules.push(rule);
      });
    }

    // If the input contains data for various Stages in the
    // display set sequence
    if (input.stages) {
      input.stages.forEach(stageObject => {
        // Create Stages from the stored data
        var stage = new Stage();
        stage.fromObject(stageObject);

        // Add them to the Protocol
        this.stages.push(stage);
      });
    }
  }

  /**
   * Creates a clone of the current Protocol with a new name
   *
   * @param name
   * @returns {Protocol|*}
   */
  createClone(name) {
    // Create a new JavaScript independent of the current Protocol
    var currentProtocol = Object.assign({}, this);

    // Create a new Protocol to return
    var clonedProtocol = new Protocol();

    // Apply the desired properties
    currentProtocol.id = clonedProtocol.id;
    clonedProtocol.fromObject(currentProtocol);

    // If we have specified a name, assign it
    if (name) {
      clonedProtocol.name = name;
    }

    // Unlock the clone
    clonedProtocol.locked = false;

    // Return the cloned Protocol
    return clonedProtocol;
  }

  /**
   * Adds a Stage to this Protocol's display set sequence
   *
   * @param stage
   */
  addStage(stage) {
    this.stages.push(stage);

    // Update the modifiedDate and User that last
    // modified this Protocol
    this.protocolWasModified();
  }

  /**
   * Adds a Rule to this Protocol's array of matching rules
   *
   * @param rule
   */
  addProtocolMatchingRule(rule) {
    this.protocolMatchingRules.push(rule);

    // Update the modifiedDate and User that last
    // modified this Protocol
    this.protocolWasModified();
  }

  /**
   * Removes a Rule from this Protocol's array of matching rules
   *
   * @param rule
   */
  removeProtocolMatchingRule(rule) {
    var wasRemoved = removeFromArray(this.protocolMatchingRules, rule);

    // Update the modifiedDate and User that last
    // modified this Protocol
    if (wasRemoved) {
      this.protocolWasModified();
    }
  }
}
