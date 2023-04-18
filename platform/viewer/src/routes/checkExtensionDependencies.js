import { ExtensionManager } from '@ohif/core';

import loadModules from '../pluginImports';

export default async function checkExtensionDependencies(
  mode,
  extensionManager: ExtensionManager
) {
  const extensionDependencies = mode.extensions;

  const dependencyString = `Unmet extension dependency in mode: ${mode.id}`;

  // Load missing extensions
  const extensions = await loadModules(extensionDependencies);
  extensionManager.registerExtensions(extensions);

  Object.keys(extensionDependencies).forEach(extensionId => {
    const extensionInstalled = extensionManager.registeredExtensionIds.includes(
      extensionId
    );

    if (!extensionInstalled) {
      throw new Error(
        `${dependencyString}: extension ${extensionId} not found`
      );
    }
  });
}

function areVersionsCompatible(semanticVersion, installedVersion) {
  if (semanticVersion.includes('^')) {
    // Major must match
    const versionLessCaret = semanticVersion.split('^')[1];

    // Index 0 is the major version.
    return versionLessCaret[0] === installedVersion[0];
  } else if (semanticVersion.includes('~')) {
    // Major and minor must match
    const versionLessTilde = semanticVersion.split('~')[1];

    // Index 0 is the major version.
    // Index 2 is the minor version.
    return (
      versionLessTilde[0] === installedVersion[0] &&
      versionLessTilde[2] === installedVersion[2]
    );
  } else {
    return semanticVersion === installedVersion;
  }
}
