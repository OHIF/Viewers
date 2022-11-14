import fs from 'fs';

export default function readPluginConfigFile() {
  let fileContents;

  try {
    fileContents = fs.readFileSync('./pluginConfig.json', { flag: 'r' });
  } catch (err) {
    return; // File doesn't exist yet.
  }

  if (fileContents) {
    fileContents = JSON.parse(fileContents);
  }

  return fileContents;
}
