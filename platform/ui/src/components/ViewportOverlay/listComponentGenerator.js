const listComponentGenerator = props => {
  const { contents, itemGenerator } = props;
  if (!contents) return;
  return contents.map(item => {
    if (!item) return;
    const generator = item.generator || itemGenerator;
    if (!generator) throw new Error(`No generator for ${item}`);
    return generator({ ...props, item });
  });
}

export default listComponentGenerator;
