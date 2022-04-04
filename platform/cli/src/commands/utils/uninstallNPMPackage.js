import { remove } from 'yarn-programmatic';

const uninstallNPMPackage = async packageName => {
  // TODO - Anoyingly pkg-install doesn't seem to have uninstall.
  // So since we are using yarn we will just use yarn here, but the tool
  // is certainly less generic. But its a super minor issue.
  await remove(packageName).catch(err => {
    //Package not present, fail silently and continue
  });
};

export default uninstallNPMPackage;
