export default function getVersionedPackageName(packageName, version) {
  return version === undefined ? packageName : `${packageName}@${version}`;
}
