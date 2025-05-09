import fs from 'fs';
import { prettyPrint } from './utils/index.js';
import { colors } from './enums/index.js';

const listPlugins = async configPath => {
  const pluginConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const { extensions, modes } = pluginConfig;

  const titleOptions = { color: colors.LIGHT, bold: true };
  const itemsOptions = { color: colors.ACTIVE, bold: true };

  const extensionsItems = extensions.map(
    extension => `${extension.packageName} @ ${extension.version}`
  );

  const modesItems = modes.map(mode => `${mode.packageName} @ ${mode.version}`);

  prettyPrint('Extensions', titleOptions, extensionsItems, itemsOptions);
  prettyPrint('Modes', titleOptions, modesItems, itemsOptions);
};

export default listPlugins;
