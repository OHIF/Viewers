export default function isDicomUid(subject) {
  const regex = /^\d+(?:\.\d+)*$/;
  return typeof subject === 'string' && regex.test(subject.trim());
}
