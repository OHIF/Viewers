import defaults from '../../defaults';
const defaultHotkeyBindings = defaults.hotkeyBindings;

/**
 * Migrates old hotkey definitions from localStorage to the new format
 * Old format: 'hotkey-definitions' containing full hotkey definitions array
 * New format: 'user-preferred-keys' containing hashed command keys with their key bindings
 *
 * @private
 */
function migrateOldHotkeyDefinitions({
  generateHash,
}: {
  generateHash: (definition: Record<string, unknown>) => string;
}): void {
  try {
    const oldHotkeyDefinitions = localStorage.getItem('hotkey-definitions');
    const migrated = localStorage.getItem('hotkeys-migrated');

    if (!oldHotkeyDefinitions || migrated === 'true') {
      return;
    }

    const oldDefinitions = JSON.parse(oldHotkeyDefinitions);

    if (!Array.isArray(oldDefinitions) || oldDefinitions.length === 0) {
      return;
    }

    const defaultBindings = defaultHotkeyBindings || [];

    const userPreferredKeys = JSON.parse(localStorage.getItem('user-preferred-keys') || '{}');

    oldDefinitions.forEach(oldDefinition => {
      if (!oldDefinition.commandName || !oldDefinition.keys) {
        return;
      }

      const matchingDefault = defaultBindings.find(defaultBinding => {
        const sameCommand = defaultBinding.commandName === oldDefinition.commandName;

        const oldOptions = oldDefinition.commandOptions || {};
        const defaultOptions = defaultBinding.commandOptions || {};

        const sameOptions = JSON.stringify(oldOptions) === JSON.stringify(defaultOptions);

        return sameCommand && sameOptions;
      });

      if (
        !matchingDefault ||
        JSON.stringify(matchingDefault.keys) !== JSON.stringify(oldDefinition.keys)
      ) {
        const commandHash = generateHash({
          commandName: oldDefinition.commandName,
          commandOptions: oldDefinition.commandOptions || {},
        });

        userPreferredKeys[commandHash] = oldDefinition.keys;
        console.debug(`HotkeysManager: Migrated custom hotkey for ${oldDefinition.commandName}`);
      }
    });

    localStorage.setItem('user-preferred-keys', JSON.stringify(userPreferredKeys));
    localStorage.setItem('hotkeys-migrated', 'true');
    localStorage.removeItem('hotkey-definitions');

    console.debug('HotkeysManager: Successfully migrated hotkey definitions to new format');
  } catch (error) {
    console.error('HotkeysManager: Error migrating hotkey definitions', error);

    localStorage.setItem('hotkeys-migrated', 'false');
  }
}

export default migrateOldHotkeyDefinitions;
