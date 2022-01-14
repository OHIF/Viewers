import uninstallNPMPackage from './utils/uninstallNPMPackage.js';
import fs from 'fs';

export default async function removeExtension(packageName) {
  console.log('Removing ohif extension...');
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

    const extensions = fileContents.extensions;

    const indexOfExistingEntry = extensions.findIndex(
      extensionEntry => extensionEntry.packageName === packageName
    );

    if (indexOfExistingEntry !== -1) {
      fileContents.extensions.splice(indexOfExistingEntry, 1);
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

  console.log('Extension Removed');
}
