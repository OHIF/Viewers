import { info } from 'yarn-programmatic';

export default async function getPackageVersion(packageName) {
  const packageInfo = await info(packageName);

  return packageInfo.version;
}
