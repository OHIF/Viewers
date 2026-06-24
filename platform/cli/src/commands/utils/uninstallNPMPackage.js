import { execa } from 'execa';

const uninstallNPMPackage = async packageName => {
  await execa('pnpm', ['remove', packageName]).catch(err => {
    console.log(err);
  });
};

export default uninstallNPMPackage;
