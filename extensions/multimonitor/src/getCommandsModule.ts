import { ServicesManager, CommandsManager, ExtensionManager } from '@ohif/core';

import applyMultiMonitor from './MultiMonitor';

export default function getCommandsModule({
  servicesManager,
  commandsManager,
  extensionManager,
}: {
  servicesManager: ServicesManager;
  commandsManager: CommandsManager;
  extensionManager: ExtensionManager;
}) {
  const actions = {
    applyMultiMonitor,
  };

  const definitions = {
    applyMultiMonitor: {
      commandFn: actions.applyMultiMonitor,
      storeContexts: [] as any[],
      options: {},
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'MULTIMONITOR',
  };
}
