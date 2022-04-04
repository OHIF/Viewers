export default function checkExtensionDependencies(mode, extensionManager) {
  const extensionDependencies = mode.extensions;

  const dependencyString = `Unmet extension dependency in mode: ${mode.id}@${mode.version}`;

  Object.keys(extensionDependencies).forEach(extensionId => {
    const requiredVersion = extensionDependencies[extensionId];
    const installedVersion = extensionManager.getExtensionVersion(extensionId);

    if (!installedVersion) {
      throw new Error(
        `${dependencyString}: extension ${extensionId}@${requiredVersion} not found`
      );
    }

    if (!areVersionsCompatible(requiredVersion, installedVersion)) {
      throw new Error(
        `${dependencyString}: required version @${requiredVersion} not met, found version ${installedVersion}`
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
