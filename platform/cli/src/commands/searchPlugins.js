import axios from 'axios';
import chalk from 'chalk';

const URL = 'https://registry.npmjs.com/-/v1/search?text=keywords:';
const OHIF_EXTENSION = 'ohif-extension';
const OHIF_MODE = 'ohif-mode';

async function searchRegistry(type) {
  const url = `${URL}${type}`;

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

  const extensions = await searchRegistry(OHIF_EXTENSION);
  const modes = await searchRegistry(OHIF_MODE);

  console.log('');
  console.log(`%s:`, chalk.cyan.bold('Modes'));
  console.log('   |');
  modes.forEach(mode => {
    console.log(`   |- ${mode.package.name} @ ${mode.package.version}`);
  });

  console.log('');
  console.log(`%s:`, chalk.cyan.bold('Extensions'));
  console.log('   |');
  extensions.forEach(extension => {
    console.log(
      `   |- ${extension.package.name} @ ${extension.package.version}`
    );
  });
}

export default searchPlugins;
