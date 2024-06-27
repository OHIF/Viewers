import axios from 'axios';

import { prettyPrint } from './utils/index.js';
import { keywords, colors, endPoints } from './enums/index.js';

async function searchRegistry(keyword) {
  const url = `${endPoints.NPM_KEYWORD}${keyword}`;

  try {
    const response = await axios.get(url);
    const { objects } = response.data;
    return objects;
  } catch (error) {
    console.log(error);
  }
}

async function searchPlugins(options) {
  const { verbose } = options;

  const extensions = await searchRegistry(keywords.EXTENSION);
  const modes = await searchRegistry(keywords.MODE);

  const titleOptions = { color: colors.LIGHT, bold: true };
  const itemsOptions = {};

  const extensionsItems = extensions.map(extension => {
    const item = [
      `${extension.package.name} @ ${extension.package.version}`,
      [`Description: ${extension.package.description}`],
    ];

    if (verbose) {
      item[1].push(`Repository: ${extension.package.links.repository}`);
    }

    return item;
  });

  const modesItems = modes.map(mode => {
    const item = [
      `${mode.package.name} @ ${mode.package.version}`,
      [`Description: ${mode.package.description}`],
    ];

    if (verbose) {
      item[1].push(`Repository: ${mode.package.links.repository}`);
    }

    return item;
  });

  prettyPrint('Extensions', titleOptions, extensionsItems, itemsOptions);
  prettyPrint('Modes', titleOptions, modesItems, itemsOptions);
}

export default searchPlugins;
