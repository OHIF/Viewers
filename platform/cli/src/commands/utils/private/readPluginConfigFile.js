import fs from 'fs';

export default function readPluginConfigFile() {
  let fileContents;

  fileContents = fs.readFileSync('./pluginConfig.json', { flag: 'r' }, function(
    err
  ) {
    if (err) {
      return; // File doesn't exist yet.
    }
  });

  if (fileContents) {
    fileContents = JSON.parse(fileContents);
  }

  return fileContents;
}
