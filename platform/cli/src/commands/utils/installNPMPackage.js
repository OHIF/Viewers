import { install } from 'pkg-install';

const installNPMPackage = async (packageName, version) => {
  let installObject = {};

  installObject[packageName] = version;

  await install(installObject, {
    prefer: 'yarn',
    stdio: ['pipe', process.stdout, process.stderr],
  });
};

export default installNPMPackage;
