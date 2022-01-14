import installNPMPackage from './utils/installNPMPackage.js';
import fs from 'fs';
import { info } from 'yarn-programmatic';

export default async function addExtension(packageName, version) {
  console.log('Adding ohif extension...');
  console.log(
    'Note: There is currently no validation that this extension is an ohif-extension.'
  );
  await installNPMPackage(packageName, version);

  if (!version) {
    // Find the version actually installed using yarn info.
    const packageInfo = await info(packageName);

    version = packageInfo.version;
  }

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
  } else {
    fileContents = {
      extensions: [],
      modes: [],
    };
  }

  const extensions = fileContents.extensions;

  const indexOfExistingEntry = extensions.findIndex(
    extensionEntry => extensionEntry.packageName === packageName
  );

  if (indexOfExistingEntry !== -1) {
    fileContents.extensions.splice(indexOfExistingEntry, 1);
  }

  fileContents.extensions.push({ packageName, version });

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

  console.log('Extension Added');
}
