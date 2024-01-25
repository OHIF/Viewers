import { id } from './id';
import getCommandsModule from './getCommandsModule';
import getLayoutTemplateModule from './getLayoutTemplateModule';

const multimonitor = {
  id,

  /**
   * CommandsModule should provide a list of commands that will be available in OHIF
   * for Modes to consume and use in the viewports. Each command is defined by
   * an object of { actions, definitions, defaultContext } where actions is an
   * object of functions, definitions is an object of available commands, their
   * options, and defaultContext is the default context for the command to run against.
   */
  getCommandsModule,
  getLayoutTemplateModule,
};

export default multimonitor;
