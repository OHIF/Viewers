/**
 * Commands: `actions` hold the implementations, `definitions` expose them to
 * commandsManager.runCommand('sayHello', { who: 'reader' }) and to hotkey or
 * toolbar bindings. `defaultContext` scopes when the commands are available.
 */
export default function getCommandsModule({ servicesManager, commandsManager }) {
  const actions = {
    sayHello: ({ who = 'OHIF' }) => console.log(`Hello ${who} from {{name}}`),
  };

  return {
    actions,
    definitions: {
      sayHello: {
        commandFn: actions.sayHello,
        options: {},
      },
    },
    defaultContext: 'DEFAULT',
  };
}
