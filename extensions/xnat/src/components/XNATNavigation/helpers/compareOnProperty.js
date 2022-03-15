export default function(a, b, property) {
  if (a[property] < b[property]) return -1;
  if (a[property] > b[property]) return 1;
  return 0;
}
