import chalk from 'chalk';
import fs from 'fs';

const listPlugins = async configPath => {
  const pluginConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const { extensions, modes } = pluginConfig;

  console.log('');
  console.log(`%s:`, chalk.cyan.bold('Modes'));
  console.log('   |');
  modes.forEach(mode => {
    console.log(`   |- ${mode.packageName} @ ${mode.version}`);
  });

  console.log('');
  console.log(`%s:`, chalk.cyan.bold('Extensions'));
  console.log('   |');
  extensions.forEach(extension => {
    console.log(`   |- ${extension.packageName} @ ${extension.version}`);
  });
};

export { listPlugins };
