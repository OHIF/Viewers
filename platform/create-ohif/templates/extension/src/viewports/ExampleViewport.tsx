/**
 * Example viewport component. The viewer grid passes the matched
 * `displaySets` (plus viewport ids and options) as props. Style only with
 * classes compiled into this package's own stylesheet (dist/index.css) and
 * Tailwind utilities — never rely on host styles.
 */
function ExampleViewport(props) {
  const { displaySets = [] } = props;
  return (
    <div className="{{dirName}}-example flex h-full flex-col items-center justify-center">
      <span className="text-lg">Example viewport from {{dirName}}</span>
      <span>{displaySets.length} display set(s) matched</span>
    </div>
  );
}

export default ExampleViewport;
