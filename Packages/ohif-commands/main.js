import { ReactiveVar } from 'meteor/reactive-var';
import { OHIF } from 'meteor/ohif:core';
import { CommandsManager } from 'meteor/ohif:commands/client/classes/CommandsManager';

// Create context namespace using a ReactiveVar
const context = new ReactiveVar(null);

// Append context namespace to OHIF namespace
OHIF.context = context;

// Create commands namespace using a CommandsManager class instance
const commands = new CommandsManager(context);

// Append commands namespace to OHIF namespace
OHIF.commands = commands;

// Export relevant objects
export { context, commands };
