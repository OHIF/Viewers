import fs from 'fs';

export default function writePluginConfigFile(pluginConfig) {
  // Note: Second 2 arguments are to pretty print the JSON so its human readable.
  const jsonStringOfFileContents = JSON.stringify(pluginConfig, null, 2);

  fs.writeFileSync(
    `./pluginConfig.json`,
    jsonStringOfFileContents,
    { flag: 'w+' },
    (err) => {
      if (err) {
        console.error(err);
        return;
      }
    }
  );
}
