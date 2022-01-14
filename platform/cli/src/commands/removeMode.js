import uninstallNPMPackage from './utils/uninstallNPMPackage.js';
import fs from 'fs';

export default async function removeMode(packageName) {
  console.log('Removing ohif mode...');
  console.log(
    'Note: There is currently no validation that this extension is an ohif-extension.'
  );
  await uninstallNPMPackage(packageName);

  let fileContents;

  fileContents = fs.readFileSync('./pluginConfig.json', { flag: 'r' }, function(
    err
  ) {
    if (err) {
      return; // File doesn't exist yet.
    }
  });

  // Note: if file is not found, nothing to remove.
  if (fileContents) {
    fileContents = JSON.parse(fileContents);

    const modes = fileContents.modes;

    const indexOfExistingEntry = modes.findIndex(
      modeEntry => modeEntry.packageName === packageName
    );

    if (indexOfExistingEntry !== -1) {
      fileContents.modes.splice(indexOfExistingEntry, 1);
    }

    const jsonStringOfFileContents = JSON.stringify(fileContents, null, 4);

    fs.writeFileSync(
      `./pluginConfig.json`,
      jsonStringOfFileContents,
      { flag: 'w+' },
      err => {
        if (err) {
          console.error(err);
          return;
        }
      }
    );
  }

  // TODO - Remove extensions if they aren't used by any other mode??

  console.log('Mode Removed');
}
